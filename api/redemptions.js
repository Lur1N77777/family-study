// ========================================
// 兑换 API — /api/redemptions
// ========================================

import { uid } from './jwt.js';

export async function handleRedemptions(req, res, user, path) {
    const { kv } = await import('@vercel/kv');

    if (path === '/api/redemptions' && req.method === 'GET') {
        const redemptionsData = await kv.lrange(`family:${user.familyCode}:redemptions`, 0, -1);
        let redemptions = redemptionsData || [];

        if (user.role === 'child') {
            redemptions = redemptions.filter(r => r.childId === user.id);
        }

        return res.json(redemptions.reverse());
    }

    if (path === '/api/redemptions' && req.method === 'POST') {
        if (user.role !== 'child') {
            return res.status(403).json({ error: '只有孩子可以兑换' });
        }

        const { productId } = req.body || {};
        if (!productId) {
            return res.status(400).json({ error: '请选择商品' });
        }

        const product = await kv.hget(`family:${user.familyCode}:products`, productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({ error: '商品不存在' });
        }

        if (user.points < product.price) {
            return res.status(400).json({ error: '积分不足' });
        }

        // 扣除积分
        user.points -= product.price;
        await kv.set(`user:${user.username}`, user);
        await kv.hset(`family:${user.familyCode}:users`, { [user.id]: user });

        const id = uid();
        const redemption = {
            id,
            productId,
            childId: user.id,
            childName: user.username,
            productName: product.name,
            productEmoji: product.emoji,
            price: product.price,
            status: 'pending',
            createdAt: Date.now()
        };

        await kv.lpush(`family:${user.familyCode}:redemptions`, redemption);

        // 记录活动
        await kv.lpush(`family:${user.familyCode}:activity`, {
            type: 'redemption',
            message: `${user.username} 兑换了: ${product.emoji} ${product.name}`,
            timestamp: Date.now()
        });

        return res.json(redemption);
    }

    if (path.startsWith('/api/redemptions/') && req.method === 'PUT') {
        if (user.role !== 'parent') {
            return res.status(403).json({ error: '只有家长可以确认兑换' });
        }

        const redemptionId = path.split('/')[3];
        const { status } = req.body || {};

        const redemptionsData = await kv.lrange(`family:${user.familyCode}:redemptions`, 0, -1);
        const redemptions = redemptionsData || [];
        const idx = redemptions.findIndex(r => r.id === redemptionId);

        if (idx === -1) {
            return res.status(404).json({ error: '兑换记录不存在' });
        }

        redemptions[idx].status = status;

        // 更新
        await kv.del(`family:${user.familyCode}:redemptions`);
        for (const r of redemptions.reverse()) {
            await kv.lpush(`family:${user.familyCode}:redemptions`, r);
        }

        return res.json(redemptions[idx]);
    }

    return res.status(404).json({ error: '接口不存在' });
}
