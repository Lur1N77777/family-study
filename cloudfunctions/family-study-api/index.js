// ========================================
// 腾讯云云开发后端 - index.js
// ========================================

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

function generateFamilyCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

const SECRET = 'family-study-secret-2024';

function signJWT(payload) {
  const now = Date.now();
  const claims = { ...payload, iat: now, exp: now + 30 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(claims)).toString('base64');
}

function verifyJWT(token) {
  try {
    const claims = JSON.parse(Buffer.from(token, 'base64').toString());
    if (claims.exp < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

exports.main = async (event, context) => {
  const { httpMethod, path, headers, body, queryStringParameters } = event;

  const res = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  };

  if (httpMethod === 'OPTIONS') {
    return { ...res, statusCode: 204, body: '' };
  }

  const pathParts = (path || '/').split('/').filter(Boolean);
  const apiIndex = pathParts.indexOf('api');
  const apiPath = apiIndex >= 0 ? '/' + pathParts.slice(apiIndex).join('/') : '/';

  let reqBody = {};
  if (body) {
    try {
      reqBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch {}
  }

  const authHeader = headers['Authorization'] || headers['authorization'];
  let user = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    user = verifyJWT(token);
  }

  try {
    let result;

    if (apiPath === '/api/auth/register') {
      result = await handleRegister(reqBody);
    } else if (apiPath === '/api/auth/login') {
      result = await handleLogin(reqBody);
    } else if (apiPath === '/api/auth/status') {
      result = { loggedIn: !!user, user };
    } else if (!user) {
      return { ...res, statusCode: 401, body: JSON.stringify({ error: '未登录' }) };
    } else if (apiPath === '/api/tasks') {
      result = await handleTasks(httpMethod, reqBody, user);
    } else if (apiPath.startsWith('/api/tasks/') && httpMethod === 'DELETE') {
      result = await handleTaskDelete(apiPath, user);
    } else if (apiPath === '/api/submissions') {
      result = await handleSubmissions(httpMethod, reqBody, user);
    } else if (apiPath.startsWith('/api/submissions/') && httpMethod === 'PUT') {
      result = await handleSubmissionReview(apiPath, reqBody, user);
    } else if (apiPath === '/api/products') {
      result = await handleProducts(httpMethod, reqBody, user);
    } else if (apiPath.startsWith('/api/products/') && httpMethod === 'DELETE') {
      result = await handleProductDelete(apiPath, user);
    } else if (apiPath === '/api/redemptions') {
      result = await handleRedemptions(httpMethod, reqBody, user);
    } else if (apiPath.startsWith('/api/redemptions/') && httpMethod === 'PUT') {
      result = await handleRedemptionConfirm(apiPath, reqBody, user);
    } else if (apiPath === '/api/photos/upload') {
      result = await handlePhotoUpload(reqBody, user);
    } else if (apiPath.startsWith('/api/photos/') && httpMethod === 'GET') {
      result = await handlePhotoGet(apiPath);
    } else if (apiPath === '/api/stats') {
      result = await handleStats(user);
    } else if (apiPath === '/api/users/family') {
      result = await handleFamilyUsers(user);
    } else if (apiPath === '/api/activity') {
      result = await handleActivity(user, queryStringParameters);
    } else {
      return { ...res, statusCode: 404, body: JSON.stringify({ error: '接口不存在' }) };
    }

    return { ...res, body: JSON.stringify(result) };
  } catch (err) {
    console.error('Error:', err);
    return { ...res, statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

async function handleRegister({ username, password, role, familyCode, joinExisting }) {
  if (!username || !password || !role) throw new Error('请填写完整信息');

  const existing = await db.collection('users').where({ username }).get();
  if (existing.data.length > 0) throw new Error('用户名已存在');

  if (role === 'child' || (role === 'parent' && joinExisting)) {
    if (!familyCode) throw new Error('请输入家庭码');
    const family = await db.collection('users').where({ familyCode, role: 'parent' }).get();
    if (family.data.length === 0) throw new Error('家庭码无效');
  }
  if (role === 'parent' && !joinExisting) {
    familyCode = generateFamilyCode();
  }

  const avatarMap = { parent: ['👨', '👩', '🧑', '👴', '👵'], child: ['👦', '👧', '🧒'] };
  const familyUsers = await db.collection('users').where({ familyCode, role }).get();
  const avatar = avatarMap[role]?.[familyUsers.data.length % avatarMap[role].length] || '👦';

  const id = uid();
  const user = { _id: id, username, password, role, familyCode, avatar, points: 0, createdAt: Date.now() };
  await db.collection('users').add(user);

  const token = signJWT({ id: user._id, username: user.username, role: user.role, familyCode: user.familyCode, avatar: user.avatar, points: user.points });
  return { user: { ...user, id: user._id }, token, familyCode };
}

async function handleLogin({ username, password }) {
  if (!username || !password) throw new Error('请填写完整');
  const result = await db.collection('users').where({ username }).get();
  const user = result.data[0];
  if (!user || user.password !== password) throw new Error('用户名或密码错误');

  const payload = { id: user._id, username: user.username, role: user.role, familyCode: user.familyCode, avatar: user.avatar, points: user.points };
  const token = signJWT(payload);
  return { user: payload, token };
}

async function handleTasks(method, body, user) {
  if (method === 'GET') {
    const tasks = await db.collection('tasks').where({ familyCode: user.familyCode, status: 'active' }).get();
    if (user.role === 'child') return tasks.data.filter(t => !t.assigneeId || t.assigneeId === user.id);
    return tasks.data;
  }

  if (method === 'POST') {
    if (user.role !== 'parent') throw new Error('只有家长可以创建任务');
    const { title, description, type, points, assigneeId } = body;
    if (!title || !type) throw new Error('请填写任务标题和类型');

    const id = uid();
    const task = { _id: id, title, description: description || '', type, points: points || 0, creatorId: user.id, assigneeId: assigneeId || null, familyCode: user.familyCode, status: 'active', createdAt: Date.now() };
    await db.collection('tasks').add(task);
    await logActivity(user.familyCode, 'task_created', `${user.username} 创建了新任务: ${title}`);
    return task;
  }
}

async function handleTaskDelete(path, user) {
  if (user.role !== 'parent') throw new Error('只有家长可以删除任务');
  const taskId = path.split('/').pop();
  await db.collection('tasks').doc(taskId).update({ status: 'deleted' });
  return { success: true };
}

async function handleSubmissions(method, body, user) {
  if (method === 'GET') {
    const submissions = await db.collection('submissions').where({ familyCode: user.familyCode }).orderBy('createdAt', 'desc').get();
    if (user.role === 'child') return submissions.data.filter(s => s.childId === user.id);
    return submissions.data;
  }

  if (method === 'POST') {
    const { taskId, photoKey } = body;
    if (!taskId) throw new Error('请选择任务');
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    const task = taskDoc.data;
    if (!task) throw new Error('任务不存在');

    const id = uid();
    const submission = { _id: id, taskId, childId: user.id, childName: user.username, status: 'pending', photoKey: photoKey || null, points: task.points || 0, rejectReason: null, createdAt: Date.now(), reviewedAt: null, familyCode: user.familyCode };
    await db.collection('submissions').add(submission);
    await logActivity(user.familyCode, 'submission', `${user.username} 提交了任务: ${task.title}`);
    return submission;
  }
}

async function handleSubmissionReview(path, body, user) {
  if (user.role !== 'parent') throw new Error('只有家长可以审核');
  const submissionId = path.split('/').pop();
  const { status, rejectReason } = body;
  const doc = await db.collection('submissions').doc(submissionId).get();
  const submission = doc.data;
  if (!submission) throw new Error('提交不存在');

  submission.status = status;
  submission.reviewedAt = Date.now();

  if (status === 'approved') {
    const childDoc = await db.collection('users').where({ username: submission.childName }).get();
    if (childDoc.data.length > 0) {
      const child = childDoc.data[0];
      child.points = (child.points || 0) + submission.points;
      await db.collection('users').doc(child._id).update({ points: child.points });
      await logActivity(user.familyCode, 'points', `${submission.childName} 获得了 ${submission.points} 积分`);
    }
  }
  if (status === 'rejected') submission.rejectReason = rejectReason || '';

  await db.collection('submissions').doc(submissionId).update(submission);
  return submission;
}

async function handleProducts(method, body, user) {
  if (method === 'GET') {
    const products = await db.collection('products').where({ familyCode: user.familyCode, status: 'active' }).get();
    return products.data;
  }
  if (method === 'POST') {
    if (user.role !== 'parent') throw new Error('只有家长可以添加商品');
    const { name, description, emoji, category, price } = body;
    if (!name || !price) throw new Error('请填写商品名称和价格');

    const id = uid();
    const product = { _id: id, name, description: description || '', emoji: emoji || '🎁', category: category || 'virtual', price: parseInt(price), creatorId: user.id, familyCode: user.familyCode, status: 'active', createdAt: Date.now() };
    await db.collection('products').add(product);
    return product;
  }
}

async function handleProductDelete(path, user) {
  if (user.role !== 'parent') throw new Error('只有家长可以删除商品');
  const productId = path.split('/').pop();
  await db.collection('products').doc(productId).update({ status: 'deleted' });
  return { success: true };
}

async function handleRedemptions(method, body, user) {
  if (method === 'GET') {
    const redemptions = await db.collection('redemptions').where({ familyCode: user.familyCode }).orderBy('createdAt', 'desc').get();
    if (user.role === 'child') return redemptions.data.filter(r => r.childId === user.id);
    return redemptions.data;
  }
  if (method === 'POST') {
    if (user.role !== 'child') throw new Error('只有孩子可以兑换');
    const { productId } = body;
    if (!productId) throw new Error('请选择商品');
    const productDoc = await db.collection('products').doc(productId).get();
    const product = productDoc.data;
    if (!product || product.status !== 'active') throw new Error('商品不存在');
    if (user.points < product.price) throw new Error('积分不足');

    user.points -= product.price;
    await db.collection('users').doc(user.id).update({ points: user.points });

    const id = uid();
    const redemption = { _id: id, productId, childId: user.id, childName: user.username, productName: product.name, productEmoji: product.emoji, price: product.price, status: 'pending', createdAt: Date.now(), familyCode: user.familyCode };
    await db.collection('redemptions').add(redemption);
    await logActivity(user.familyCode, 'redemption', `${user.username} 兑换了: ${product.emoji} ${product.name}`);
    return redemption;
  }
}

async function handleRedemptionConfirm(path, body, user) {
  if (user.role !== 'parent') throw new Error('只有家长可以确认兑换');
  const redemptionId = path.split('/').pop();
  const { status } = body;
  await db.collection('redemptions').doc(redemptionId).update({ status });
  return { success: true };
}

async function handlePhotoUpload({ image, filename }, user) {
  if (!image) throw new Error('请上传图片');
  const id = uid();
  const key = `photo_${id}`;
  await db.collection('photos').add({ key, data: image, filename: filename || 'photo.jpg', userId: user.id, createdAt: Date.now() });
  return { key, url: `/api/photos/${key}` };
}

async function handlePhotoGet(path) {
  const key = path.split('/').pop();
  const result = await db.collection('photos').where({ key }).get();
  if (!result.data.length) throw new Error('照片不存在');
  return result.data[0];
}

async function handleStats(user) {
  const users = await db.collection('users').where({ familyCode: user.familyCode }).get();
  const tasks = await db.collection('tasks').where({ familyCode: user.familyCode }).get();
  const submissions = await db.collection('submissions').where({ familyCode: user.familyCode }).get();
  const redemptions = await db.collection('redemptions').where({ familyCode: user.familyCode }).get();

  const userList = users.data;
  const children = userList.filter(u => u.role === 'child');

  return {
    totalUsers: userList.length,
    childrenCount: children.length,
    parentsCount: userList.filter(u => u.role === 'parent').length,
    activeTasks: tasks.data.filter(t => t.status === 'active').length,
    pendingSubmissions: submissions.data.filter(s => s.status === 'pending').length,
    approvedSubmissions: submissions.data.filter(s => s.status === 'approved').length,
    pendingRedemptions: redemptions.data.filter(r => r.status === 'pending').length,
    childrenPoints: children.map(c => ({ id: c._id, username: c.username, avatar: c.avatar, points: c.points || 0 }))
  };
}

async function handleFamilyUsers(user) {
  const result = await db.collection('users').where({ familyCode: user.familyCode }).get();
  return result.data.map(u => ({ ...u, id: u._id }));
}

async function handleActivity(user, query) {
  const limit = parseInt(query?.limit || '20');
  const result = await db.collection('activity').where({ familyCode: user.familyCode }).orderBy('timestamp', 'desc').limit(limit).get();
  return result.data;
}

async function logActivity(familyCode, type, message) {
  await db.collection('activity').add({ type, message, familyCode, timestamp: Date.now() });
}
