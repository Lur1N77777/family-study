// ========================================
// 拍照上传模块
// ========================================

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

// 获取图片
export async function getPhoto(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result?.dataUrl || null);
        req.onerror = () => reject(req.error);
    });
}

// 压缩图片
function compressImage(file, maxWidth = 1200, quality = 0.7) {
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

// 调用摄像头拍照（或选择图片）
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
                const dataUrl = await compressImage(file);
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
