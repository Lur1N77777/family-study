// ========================================
// 拍照上传模块
// ========================================

import { api } from './api.js';

const DB_NAME = 'family_study_photos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// 保存图片到 IndexedDB
export async function savePhoto(id, dataUrl) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ id, dataUrl, createdAt: Date.now() });
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
    });
}

// 获取图片 - 先尝试从 R2 获取，失败则尝试本地
export async function getPhoto(id) {
    // 如果是 R2 key 格式 (以 f_ 开头)
    if (id && id.startsWith('f_')) {
        try {
            const url = `/api/photos/${encodeURIComponent(id)}`;
            const headers = api.token ? { Authorization: `Bearer ${api.token}` } : {};
            const response = await fetch(url, {
                headers,
                cache: 'no-store',
            });
            if (response.ok) {
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                // 设置自动回收：5 分钟后释放 ObjectURL
                setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
                return objectUrl;
            }
        } catch (e) {
            console.error('R2 获取失败:', e);
        }
    }

    // 降级到本地 IndexedDB
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result?.dataUrl || null);
        req.onerror = () => reject(req.error);
    });
}

// 压缩图片 — 返回压缩后的 File 对象
export function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        const compressed = new File([blob], file.name || 'photo.jpg', {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressed);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 压缩图片为 dataUrl（保留向后兼容）
function compressImageToDataUrl(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 调用摄像头拍照（或选择图片）— 保持原有接口
export function capturePhoto() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // 后置摄像头
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                reject(new Error('未选择图片'));
                return;
            }
            try {
                const dataUrl = await compressImageToDataUrl(file);
                const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
                await savePhoto(id, dataUrl);
                resolve({ id, dataUrl });
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(input);
            }
        };

        input.oncancel = () => {
            document.body.removeChild(input);
            reject(new Error('取消拍照'));
        };

        input.click();
    });
}

// 选择多张照片（从相册），返回压缩后的 File 数组和预览 URL 数组
export function selectMultiplePhotos(maxCount = 4) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = async (e) => {
            try {
                let files = Array.from(e.target.files);
                if (files.length === 0) {
                    reject(new Error('未选择图片'));
                    return;
                }
                // 限制最大数量
                if (files.length > maxCount) {
                    files = files.slice(0, maxCount);
                }
                // 逐个压缩
                const results = [];
                for (const file of files) {
                    const compressed = await compressImage(file);
                    const previewUrl = URL.createObjectURL(compressed);
                    results.push({ file: compressed, previewUrl });
                }
                resolve(results);
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(input);
            }
        };

        input.oncancel = () => {
            document.body.removeChild(input);
            reject(new Error('取消选择'));
        };

        input.click();
    });
}

// 拍照并返回压缩后的 File + previewUrl（用于多图提交场景）
export function capturePhotoAsFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                reject(new Error('未选择图片'));
                return;
            }
            try {
                const compressed = await compressImage(file);
                const previewUrl = URL.createObjectURL(compressed);
                resolve({ file: compressed, previewUrl });
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(input);
            }
        };

        input.oncancel = () => {
            document.body.removeChild(input);
            reject(new Error('取消拍照'));
        };

        input.click();
    });
}

// 解析 photo_key 字段：兼容旧单 key 和新 JSON 数组
export function parsePhotoKeys(photoKeyField) {
    if (!photoKeyField) return [];
    try {
        const parsed = JSON.parse(photoKeyField);
        if (Array.isArray(parsed)) return parsed;
        return [photoKeyField];
    } catch {
        return [photoKeyField];
    }
}
