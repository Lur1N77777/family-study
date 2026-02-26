// ========================================
// 商品 API — /api/products
// ========================================

import { uid } from './jwt.js';

export async function handleProducts(req, res, user, path) {
    const { kv } = await import('@vercel/kv');

    if (path === '/api/products' && req.method === 'GET') {
        const productsData = await kv.hgetall(`family:${user.familyCode}:products`) || {};
        const products = Object.values(productsData).filter(p => p.status === 'active');
        return res.json(products);
    }

    if (path === '/api/products' && req.method === 'POST') {
        if (user.role !== 'parent') {
            return res.status(403).json({ error: '只有家长可以添加商品' });
        }

        const { name, description, emoji, category, price } = req.body || {};
        if (!name || !price) {
            return res.status(400).json({ error: '请填写商品名称和价格' });
        }

        const id = uid();
        const product = {
            id,
            name,
            description: description || '',
            emoji: emoji || '🎁',
            category: category || 'virtual',
            price: parseInt(price),
            creatorId: user.id,
            familyCode: user.familyCode,
            status: 'active',
            createdAt: Date.now()
        };

        await kv.hset(`family:${user.familyCode}:products`, { [id]: product });

        return res.json(product);
    }

    if (path.startsWith('/api/products/') && req.method === 'DELETE') {
        if (user.role !== 'parent') {
            return res.status(403).json({ error: '只有家长可以删除商品' });
        }

        const productId = path.split('/')[3];
        const productData = await kv.hget(`family:${user.familyCode}:products`, productId);

        if (!productData) {
            return res.status(404).json({ error: '商品不存在' });
        }

        productData.status = 'deleted';
        await kv.hset(`family:${user.familyCode}:products`, { [productId]: productData });

        return res.json({ success: true });
    }

    return res.status(404).json({ error: '接口不存在' });
}
