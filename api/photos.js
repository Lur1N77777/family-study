// ========================================
// 照片 API — /api/photos
// ========================================

import { uid } from './jwt.js';

export async function handlePhotos(req, res, user, path) {
    const { kv } = await import('@vercel/kv');

    // 解析multipart form data
    if (path === '/api/photos/upload' && req.method === 'POST') {
        // Vercel使用不同的上传方式，这里简化为接收base64
        const { image, filename } = req.body || {};
        if (!image) {
            return res.status(400).json({ error: '请上传图片' });
        }

        const id = uid();
        const key = `photo_${id}`;

        // 存储到KV (小图片可以，大图片建议用Vercel Blob)
        await kv.set(`photo:${key}`, {
            data: image,
            filename: filename || 'photo.jpg',
            userId: user.id,
            createdAt: Date.now()
        });

        return res.json({ key, url: `/api/photos/${key}` });
    }

    if (path.startsWith('/api/photos/') && req.method === 'GET') {
        const key = path.split('/')[3];
        const photo = await kv.get(`photo:${key}`);

        if (!photo) {
            return res.status(404).json({ error: '照片不存在' });
        }

        // 返回base64图片
        return res.json(photo);
    }

    return res.status(404).json({ error: '接口不存在' });
}
