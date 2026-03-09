// ========================================
// 通知服务 - 孩子端轮询接收通知
// ========================================

import { store } from '../utils/store.js';
import { toast } from '../utils/notification.js';

let pollInterval = null;
let lastCheckTime = 0;

// 启动通知轮询
export function startNotificationPolling(intervalMs = 5000) {
  // 如果已经在轮询，先停止
  stopNotificationPolling();

  lastCheckTime = Date.now();

  // 立即检查一次
  checkNotifications();

  // 设置定时轮询
  pollInterval = setInterval(() => {
    checkNotifications();
  }, intervalMs);
}

// 停止通知轮询
export function stopNotificationPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// 检查新通知
async function checkNotifications() {
  try {
    const notifications = await store.getNotifications(lastCheckTime);

    if (notifications && notifications.length > 0) {
      // 显示系统通知（如果用户授权了）
      await showSystemNotification(notifications[0]);

      // 标记已读
      await store.markNotificationRead(notifications[0].id);

      // 更新轮询时间
      lastCheckTime = Date.now();
    }
  } catch (e) {
    console.error('检查通知失败:', e);
  }
}

// 显示系统通知
async function showSystemNotification(notif) {
  // 检查浏览器是否支持 Notification API
  if (!('Notification' in window)) {
    return;
  }

  // 如果已经授权，直接显示
  if (Notification.permission === 'granted') {
    new Notification(notif.title || '学习提醒', {
      body: notif.message,
      icon: '/logo.png',
      tag: notif.id,
      requireInteraction: true
    });
    return;
  }

  // 如果未授权，尝试请求授权
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      new Notification(notif.title || '学习提醒', {
        body: notif.message,
        icon: '/logo.png',
        tag: notif.id,
        requireInteraction: true
      });
    }
  }

  // 同时显示应用内 toast 通知
  toast(notif.message, 'info', 5000);
}

// 请求通知权限
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// 检查通知权限状态
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
