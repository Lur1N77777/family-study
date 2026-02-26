// ========================================
// 照片存储路由 — /api/photos
// ========================================
// 接入 Cloudflare R2

import { jsonResponse, errorResponse } from '../utils/response.js';

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function handlePhotos(request, env, user, path) {
    const method = request.method;

    // GET /api/photos/:key — 获取图片
    if (method === 'GET') {
        const key = path.split('/').pop();
        if (!key || key === 'photos') return errorResponse('缺少图片Key', 400, env);

        if (!env.PHOTOS) {
            // 如果未绑定 R2 (如本地开发环境)，返回一个错误，或者占位
            return errorResponse('对象存储未配置', 501, env);
        }

        const object = await env.PHOTOS.get(key);
        if (!object) return errorResponse('图片不存在', 404, env);

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000'); // 强制缓存一年

        return new Response(object.body, { headers });
    }

    // POST /api/photos/upload — 上传图片
    if (method === 'POST' && path === '/api/photos/upload') {
        if (user.role !== 'child') return errorResponse('只有学生可上传照片', 403, env);
        if (!env.PHOTOS) return errorResponse('存储未配置', 501, env);

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return errorResponse('没有文件', 400, env);

        // 简单校验格式和大小
        if (!file.type.startsWith('image/')) return errorResponse('只能上传图片', 400, env);
        if (file.size > 5 * 1024 * 1024) return errorResponse('图片不能超过 5MB', 400, env); // 限制5MB

        const ext = file.name.split('.').pop() || 'jpg';
        const key = `f_${user.familyCode}/c_${user.id}_${uid()}.${ext}`;

        await env.PHOTOS.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type || 'image/jpeg' },
        });

        return jsonResponse({ key, url: `/api/photos/${encodeURIComponent(key)}` }, env, 201);
    }

    return errorResponse('Not Found', 404, env);
}
