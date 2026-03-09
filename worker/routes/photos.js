// ========================================
// 照片存储路由 - /api/photos
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { canAccessSubmissionPhotos, findAccessibleSubmissionForPhoto } from '../utils/photo-retention.js';

export async function handlePhotos(request, env, user, path) {
  const method = request.method;

  if (method === 'GET') {
    if (!user?.familyCode) {
      return errorResponse('未登录', 401, env);
    }

    const key = path.replace('/api/photos/', '');
    if (!key || key === 'photos') return errorResponse('缺少图片Key', 400, env);
    if (!env.PHOTOS) return errorResponse('对象存储未配置', 501, env);

    const decodedKey = decodeURIComponent(key);
    const submission = await findAccessibleSubmissionForPhoto(env.DB, user.familyCode, decodedKey);
    if (!submission) {
      return errorResponse('图片不存在或无权访问', 404, env);
    }

    if (!canAccessSubmissionPhotos(submission)) {
      return errorResponse('审核照片仅限当天查看', 410, env);
    }

    const object = await env.PHOTOS.get(decodedKey);
    if (!object) return errorResponse('图片不存在', 404, env);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, { headers });
  }

  if (method === 'POST' && path === '/api/photos/upload') {
    if (user.role !== 'child') return errorResponse('只有学生可以上传照片', 403, env);
    if (!env.PHOTOS) return errorResponse('存储未配置', 501, env);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return errorResponse('没有文件', 400, env);
    if (!file.type.startsWith('image/')) return errorResponse('只能上传图片', 400, env);
    if (file.size > 5 * 1024 * 1024) return errorResponse('图片不能超过 5MB', 400, env);

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `f_${user.familyCode}/c_${user.id}_${uid()}.${ext}`;

    try {
      await env.PHOTOS.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
      });
      return jsonResponse({ key, url: `/api/photos/${encodeURIComponent(key)}` }, env, 201);
    } catch (error) {
      return errorResponse(`上传失败: ${error.message}`, 500, env);
    }
  }

  if (method === 'POST' && path === '/api/photos/upload-multi') {
    if (user.role !== 'child') return errorResponse('只有学生可以上传照片', 403, env);
    if (!env.PHOTOS) return errorResponse('存储未配置', 501, env);

    const formData = await request.formData();
    const keys = [];
    const errors = [];

    for (let index = 0; index < 4; index += 1) {
      const file = formData.get(`file${index}`);
      if (!file) continue;

      if (!file.type.startsWith('image/')) {
        errors.push(`文件${index + 1}不是图片`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors.push(`文件${index + 1}超过5MB`);
        continue;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const key = `f_${user.familyCode}/c_${user.id}_${uid()}.${ext}`;

      try {
        await env.PHOTOS.put(key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type || 'image/jpeg' },
        });
        keys.push(key);
      } catch {
        errors.push(`文件${index + 1}上传失败`);
      }
    }

    if (keys.length === 0) {
      return errorResponse(errors.length ? errors.join('; ') : '没有文件', 400, env);
    }

    return jsonResponse({ keys, errors: errors.length ? errors : undefined }, env, 201);
  }

  return errorResponse('Not Found', 404, env);
}
