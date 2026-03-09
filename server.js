// ========================================
// Express 服务器 - 用于 Railway 部署
// ========================================

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 内存存储（演示用，生产环境建议用数据库）
const db = {
  users: [],
  tasks: [],
  submissions: [],
  products: [],
  redemptions: [],
  photos: [],
  activity: []
};

// 初始化一些测试数据
function initData() {
  if (db.users.length === 0) {
    const testUsers = [
      { id: 'parent_1', username: '爸爸', password: 'dad123', role: 'parent', familyCode: '888666', avatar: '👨', points: 0 },
      { id: 'parent_2', username: '妈妈', password: 'mom123', role: 'parent', familyCode: '888666', avatar: '👩', points: 0 },
      { id: 'child_1', username: '小明', password: '123456', role: 'child', familyCode: '888666', avatar: '👦', points: 280 },
      { id: 'child_2', username: '小红', password: '654321', role: 'child', familyCode: '888666', avatar: '👧', points: 120 }
    ];
    db.users = testUsers;
  }
}
initData();

// 工具函数
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

function findUserById(userId) {
  return db.users.find(user => user.id === userId) || null;
}

function normalizeTask(task) {
  const targetChildId = task.target_child_id ?? task.assigneeId ?? null;
  return {
    ...task,
    target_child_id: targetChildId,
    assigneeId: targetChildId,
  };
}

function normalizeSubmission(submission) {
  return {
    ...submission,
    task_id: submission.taskId,
    child_name: submission.childName,
    child_avatar: submission.childAvatar,
    task_title: submission.taskTitle,
    task_points: submission.taskPoints,
    photo_key: submission.photoKey,
    reject_reason: submission.rejectReason,
    created_at: submission.createdAt,
    reviewed_at: submission.reviewedAt,
  };
}

function normalizeRedemption(redemption) {
  return {
    ...redemption,
    product_name: redemption.productName,
    product_emoji: redemption.productEmoji,
    child_name: redemption.childName,
    created_at: redemption.createdAt,
  };
}

// 路由
app.use((req, res, next) => {
  const path = req.path;

  // 公开路由
  if (path.startsWith('/api/auth/')) {
    return handleAuth(req, res);
  }

  // 认证
  const authHeader = req.headers['authorization'];
  let user = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    user = verifyJWT(token);
  }

  if (path.startsWith('/api/') && !user) {
    return res.status(401).json({ error: '未登录' });
  }

  req.user = user;
  next();
});

// 认证
function handleAuth(req, res) {
  const { method, body, path } = req;

  if (path === '/api/auth/register' && method === 'POST') {
    let { username, password, role, familyCode, joinExisting } = body;
    if (!username || !password || !role) return res.status(400).json({ error: '请填写完整信息' });

    const existing = db.users.find(u => u.username === username);
    if (existing) return res.status(400).json({ error: '用户名已存在' });

    if (role === 'child' || (role === 'parent' && joinExisting)) {
      if (!familyCode) return res.status(400).json({ error: '请输入家庭码' });
      const familyExists = db.users.find(u => u.familyCode === familyCode && u.role === 'parent');
      if (!familyExists) return res.status(400).json({ error: '家庭码无效' });
    }
    if (role === 'parent' && !joinExisting) {
      familyCode = generateFamilyCode();
    }

    const avatarMap = { parent: ['👨', '👩', '🧑', '👴', '👵'], child: ['👦', '👧', '🧒'] };
    const sameRoleCount = db.users.filter(u => u.familyCode === familyCode && u.role === role).length;
    const avatar = avatarMap[role]?.[sameRoleCount % avatarMap[role].length] || '👦';

    const user = { id: uid(), username, password, role, familyCode, avatar, points: 0 };
    db.users.push(user);

    const token = signJWT({ id: user.id, username: user.username, role: user.role, familyCode: user.familyCode, avatar: user.avatar, points: user.points });
    return res.json({ user, token, familyCode });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const { username, password } = body;
    if (!username || !password) return res.status(400).json({ error: '请填写完整' });

    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(400).json({ error: '用户名或密码错误' });

    const payload = { id: user.id, username: user.username, role: user.role, familyCode: user.familyCode, avatar: user.avatar, points: user.points };
    const token = signJWT(payload);
    return res.json({ user: payload, token });
  }

  if (path === '/api/auth/status' && method === 'GET') {
    return res.json({ loggedIn: !!req.user, user: req.user });
  }

  res.status(404).json({ error: '接口不存在' });
}

// 任务
app.get('/api/tasks', (req, res) => {
  const tasks = db.tasks
    .filter(t => t.familyCode === req.user.familyCode && t.status === 'active')
    .map(normalizeTask);

  if (req.user.role === 'child') {
    const visibleTasks = tasks
      .filter(t => !t.target_child_id || t.target_child_id === req.user.id)
      .map(task => {
        const latestSubmission = db.submissions
          .filter(submission => submission.taskId === task.id && submission.childId === req.user.id)
          .sort((a, b) => b.createdAt - a.createdAt)[0];

        return {
          ...task,
          todaySubmission: latestSubmission ? normalizeSubmission(latestSubmission) : null,
        };
      });

    return res.json(visibleTasks);
  }

  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以创建任务' });
  const { title, description, type, points, assigneeId, target_child_id } = req.body;
  if (!title || !type) return res.status(400).json({ error: '请填写任务标题和类型' });

  const task = {
    id: uid(),
    title,
    description: description || '',
    type,
    points: points || 0,
    creatorId: req.user.id,
    target_child_id: target_child_id || assigneeId || null,
    familyCode: req.user.familyCode,
    status: 'active',
    createdAt: Date.now()
  };
  db.tasks.push(task);
  logActivity(req.user.familyCode, 'task_created', `${req.user.username} 创建了新任务: ${title}`);
  res.json(normalizeTask(task));
});

app.patch('/api/tasks/:id', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以编辑任务' });

  const task = db.tasks.find(t => t.id === req.params.id && t.familyCode === req.user.familyCode);
  if (!task) return res.status(404).json({ error: '任务不存在' });

  const updates = req.body || {};
  if (updates.title !== undefined) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.type !== undefined) task.type = updates.type;
  if (updates.points !== undefined) task.points = updates.points;
  if (updates.target_child_id !== undefined || updates.assigneeId !== undefined) {
    task.target_child_id = updates.target_child_id ?? updates.assigneeId ?? null;
  }

  res.json(normalizeTask(task));
});

app.delete('/api/tasks/:id', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以删除任务' });
  const task = db.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: '任务不存在' });
  task.status = 'deleted';
  res.json({ success: true });
});

// 提交
app.get('/api/submissions', (req, res) => {
  let submissions = db.submissions.filter(s => s.familyCode === req.user.familyCode);
  if (req.user.role === 'child') {
    submissions = submissions.filter(s => s.childId === req.user.id);
  }
  if (req.query.status) {
    submissions = submissions.filter(s => s.status === req.query.status);
  }
  if (req.query.childId) {
    submissions = submissions.filter(s => s.childId === req.query.childId);
  }
  res.json(submissions.slice().reverse().map(normalizeSubmission));
});

app.post('/api/submissions', (req, res) => {
  const { taskId, photoKey, photoKeys } = req.body;
  if (!taskId) return res.status(400).json({ error: '请选择任务' });

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });

  const child = findUserById(req.user.id) || req.user;
  const submission = {
    id: uid(),
    taskId,
    childId: req.user.id,
    childName: req.user.username,
    childAvatar: child.avatar || '👦',
    taskTitle: task.title,
    taskPoints: task.points || 0,
    status: 'pending',
    photoKey: Array.isArray(photoKeys) ? JSON.stringify(photoKeys) : (photoKey || null),
    points: task.points || 0,
    rejectReason: '',
    createdAt: Date.now(),
    reviewedAt: null,
    familyCode: req.user.familyCode
  };
  db.submissions.push(submission);
  logActivity(req.user.familyCode, 'submission', `${req.user.username} 提交了任务: ${task.title}`);
  res.json(normalizeSubmission(submission));
});

function handleSubmissionReview(req, res) {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以审核' });
  const submission = db.submissions.find(s => s.id === req.params.id);
  if (!submission) return res.status(404).json({ error: '提交不存在' });

  const { status, action, rejectReason, reason } = req.body;
  const nextStatus = status || (action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null);
  if (!nextStatus) return res.status(400).json({ error: '缺少审核状态' });

  const previousStatus = submission.status;
  submission.status = nextStatus;
  submission.reviewedAt = Date.now();

  if (nextStatus === 'approved' && previousStatus !== 'approved') {
    const child = findUserById(submission.childId) || db.users.find(u => u.username === submission.childName);
    if (child) {
      child.points = (child.points || 0) + submission.points;
      logActivity(req.user.familyCode, 'points', `${submission.childName} 获得了 ${submission.points} 积分`);
    }
    submission.rejectReason = '';
  }
  if (nextStatus === 'rejected') submission.rejectReason = reason || rejectReason || '';

  res.json(normalizeSubmission(submission));
}

app.put('/api/submissions/:id', handleSubmissionReview);
app.patch('/api/submissions/:id', handleSubmissionReview);

// 商品
app.get('/api/products', (req, res) => {
  const products = db.products.filter(p => p.familyCode === req.user.familyCode && p.status === 'active');
  res.json(products);
});

app.post('/api/products', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以添加商品' });
  const { name, description, emoji, category, price } = req.body;
  if (!name || !price) return res.status(400).json({ error: '请填写商品名称和价格' });

  const product = { id: uid(), name, description: description || '', emoji: emoji || '🎁', category: category || 'virtual', price: parseInt(price), creatorId: req.user.id, familyCode: req.user.familyCode, status: 'active', createdAt: Date.now() };
  db.products.push(product);
  res.json(product);
});

app.patch('/api/products/:id', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以编辑商品' });

  const product = db.products.find(p => p.id === req.params.id && p.familyCode === req.user.familyCode);
  if (!product) return res.status(404).json({ error: '商品不存在' });

  const updates = req.body || {};
  if (updates.name !== undefined) product.name = updates.name;
  if (updates.description !== undefined) product.description = updates.description;
  if (updates.emoji !== undefined) product.emoji = updates.emoji;
  if (updates.category !== undefined) product.category = updates.category;
  if (updates.price !== undefined) product.price = parseInt(updates.price, 10);

  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以删除商品' });
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  product.status = 'deleted';
  res.json({ success: true });
});

// 兑换
app.get('/api/redemptions', (req, res) => {
  let redemptions = db.redemptions.filter(r => r.familyCode === req.user.familyCode);
  if (req.user.role === 'child') {
    redemptions = redemptions.filter(r => r.childId === req.user.id);
  }
  if (req.query.status) {
    redemptions = redemptions.filter(r => r.status === req.query.status);
  }
  res.json(redemptions.slice().reverse().map(normalizeRedemption));
});

app.post('/api/redemptions', (req, res) => {
  if (req.user.role !== 'child') return res.status(403).json({ error: '只有孩子可以兑换' });
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: '请选择商品' });

  const product = db.products.find(p => p.id === productId && p.status === 'active');
  if (!product) return res.status(404).json({ error: '商品不存在' });
  const child = findUserById(req.user.id);
  if (!child) return res.status(404).json({ error: '用户不存在' });
  if ((child.points || 0) < product.price) return res.status(400).json({ error: '积分不足' });

  child.points -= product.price;

  const redemption = { id: uid(), productId, childId: req.user.id, childName: req.user.username, productName: product.name, productEmoji: product.emoji, price: product.price, status: 'pending', createdAt: Date.now(), familyCode: req.user.familyCode };
  db.redemptions.push(redemption);
  logActivity(req.user.familyCode, 'redemption', `${req.user.username} 兑换了: ${product.emoji} ${product.name}`);
  res.json(normalizeRedemption(redemption));
});

function handleRedemptionReview(req, res) {
  if (req.user.role !== 'parent') return res.status(403).json({ error: '只有家长可以确认兑换' });
  const redemption = db.redemptions.find(r => r.id === req.params.id);
  if (!redemption) return res.status(404).json({ error: '兑换记录不存在' });
  redemption.status = req.body.status || 'confirmed';
  res.json(normalizeRedemption(redemption));
}

app.put('/api/redemptions/:id', handleRedemptionReview);
app.patch('/api/redemptions/:id', handleRedemptionReview);

app.patch('/api/users/avatar', (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (!req.body?.avatar) return res.status(400).json({ error: '缺少头像' });

  user.avatar = req.body.avatar;
  res.json({ success: true, avatar: user.avatar });
});

// 照片
app.post('/api/photos/upload', (req, res) => {
  const { image, filename } = req.body;
  if (!image) return res.status(400).json({ error: '请上传图片' });

  const id = uid();
  const key = `photo_${id}`;
  db.photos.push({ key, data: image, filename: filename || 'photo.jpg', userId: req.user.id, createdAt: Date.now() });
  res.json({ key, url: `/api/photos/${key}` });
});

app.get('/api/photos/:key', (req, res) => {
  const photo = db.photos.find(p => p.key === req.params.key);
  if (!photo) return res.status(404).json({ error: '照片不存在' });
  res.json(photo);
});

// 统计
app.get('/api/stats', (req, res) => {
  const users = db.users.filter(u => u.familyCode === req.user.familyCode);
  const tasks = db.tasks.filter(t => t.familyCode === req.user.familyCode);
  const submissions = db.submissions.filter(s => s.familyCode === req.user.familyCode);
  const redemptions = db.redemptions.filter(r => r.familyCode === req.user.familyCode);

  const children = users.filter(u => u.role === 'child');
  const activeTasks = tasks.filter(t => t.status === 'active').length;
  const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;
  const completionRate = activeTasks > 0 ? Math.round((approvedSubmissions / activeTasks) * 100) : 0;

  res.json({
    totalUsers: users.length,
    childrenCount: children.length,
    parentsCount: users.filter(u => u.role === 'parent').length,
    totalTasks: activeTasks,
    activeTasks,
    pendingSubmissions,
    pendingReview: pendingSubmissions,
    approvedSubmissions,
    completionRate,
    pendingRedemptions,
    childrenPoints: children.map(c => ({ id: c.id, username: c.username, avatar: c.avatar, points: c.points || 0 }))
  });
});

app.get('/api/users/family', (req, res) => {
  const users = db.users.filter(u => u.familyCode === req.user.familyCode);
  res.json(users);
});

app.get('/api/activity', (req, res) => {
  const limit = parseInt(req.query.limit || '20');
  const activities = db.activity.filter(a => a.familyCode === req.user.familyCode).slice(0, limit);
  res.json(activities);
});

function logActivity(familyCode, type, message) {
  db.activity.push({ type, message, familyCode, timestamp: Date.now() });
}

// 静态文件
app.use(express.static('dist'));
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/dist/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
