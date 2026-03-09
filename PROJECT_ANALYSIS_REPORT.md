# family-study 项目详细分析报告

> 生成时间: 2026-02-28
> 分析方法: Agent Team 并行分析 (4 个子 Agent)

---

## 一、项目概述

| 项目 | 说明 |
|------|------|
| **项目名称** | family-study (约约依可学习系统) |
| **项目类型** | 家庭学习积分监督系统 |
| **技术栈** | Vite + 原生 JavaScript SPA + Cloudflare Workers + Vercel |
| **架构** | 前后端分离，多平台部署 |
| **数据库** | Cloudflare D1 (SQLite) |
| **对象存储** | Cloudflare R2 (照片) |

---

## 二、技术架构

### 2.1 前端架构

| 组件 | 技术/实现 |
|------|----------|
| 框架 | 原生 JavaScript (无框架) |
| 构建工具 | Vite 7.3.1 |
| 路由 | Hash 路由 (`src/utils/router.js`) |
| 状态管理 | Store 类 + 发布订阅模式 |
| API 客户端 | ApiClient 类 |
| 认证 | JWT Token (localStorage) |
| 样式 | CSS 变量 + 组件化样式 |
| PWA | Service Worker + Manifest |

### 2.2 后端架构

| 组件 | 技术/实现 |
|------|----------|
| 运行时 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| 存储 | Cloudflare R2 |
| 认证 | JWT (HS256, 7天有效期) |
| 框架 | 原生 Workers API |
| 部署 | Vercel Serverless Functions |

### 2.3 部署架构

```
┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │ Cloudflare      │
│   (前端 SPA)     │     │ (后端 API)      │
│   port 3000     │     │ Workers + D1    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │  用户浏览器   │
              └─────────────┘
```

---

## 三、目录结构

```
├── src/                       # 前端源代码
│   ├── main.js               # 入口文件
│   ├── styles/index.css      # 全局样式
│   ├── utils/                # 工具函数
│   │   ├── router.js         # 路由系统
│   │   ├── store.js          # 状态管理
│   │   ├── api.js            # API 客户端
│   │   ├── auth.js           # 认证管理
│   │   ├── camera.js         # 拍照功能
│   │   ├── nav.js            # 底部导航
│   │   ├── notifications.js  # 通知
│   │   ├── icons.js          # SVG 图标
│   │   └── animations.js     # 动画
│   └── pages/                # 页面组件
│       ├── landing.js        # 首页
│       ├── login.js          # 登录/注册
│       ├── student/          # 学生端
│       │   ├── dashboard.js
│       │   ├── tasks.js
│       │   ├── shop.js
│       │   └── profile.js
│       └── parent/           # 家长端
│           ├── overview.js
│           ├── tasks.js
│           ├── products.js
│           ├── review.js
│           ├── settings.js
│           └── notify.js
│
├── worker/                   # Cloudflare Workers 后端
│   ├── index.js             # 入口/路由分发
│   ├── schema.sql           # 数据库结构
│   ├── routes/              # API 路由
│   │   ├── auth.js          # 认证
│   │   ├── tasks.js         # 任务
│   │   ├── submissions.js   # 提交审核
│   │   ├── products.js      # 商品
│   │   ├── redemptions.js   # 兑换
│   │   ├── photos.js        # 照片
│   │   ├── notifications.js # 通知
│   │   └── stats.js         # 统计
│   └── utils/
│       ├── jwt.js           # JWT 工具
│       └── response.js      # 响应工具
│
├── public/                   # 静态资源
│   ├── sw.js               # Service Worker
│   ├── manifest.json       # PWA 配置
│   └── logo.png
│
├── package.json             # 项目配置
├── wrangler.toml           # Workers 配置
├── vercel.json             # Vercel 配置
├── server.js               # Express 服务器
└── index.html              # 入口 HTML
```

---

## 四、数据库设计

### 表结构 (7 张表)

| 表名 | 用途 | 核心字段 |
|------|------|----------|
| `users` | 用户表 | id, username, password_hash, role, family_code, avatar, points |
| `tasks` | 任务表 | id, title, type, points, target_child_id, status |
| `submissions` | 提交记录 | id, task_id, child_id, status, photo_key, points |
| `products` | 商品表 | id, name, emoji, category, price, status |
| `redemptions` | 兑换记录 | id, product_id, child_id, price, status |
| `notifications` | 通知表 | id, parent_id, child_id, title, message, read_at |
| `activity_log` | 活动日志 | id, type, message, family_code, timestamp |

---

## 五、API 端点汇总

### 认证模块 `/api/auth`
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |

### 任务模块 `/api/tasks`
| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/tasks` | GET | 家长/孩子 | 获取任务列表 |
| `/api/tasks` | POST | 家长 | 创建任务 |
| `/api/tasks/:id` | PATCH | 家长 | 更新任务 |
| `/api/tasks/:id` | DELETE | 家长 | 删除任务 |

### 提交审核 `/api/submissions`
| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/submissions` | GET | 家长 | 获取提交列表 |
| `/api/submissions` | POST | 孩子 | 提交任务 |
| `/api/submissions/:id` | PATCH | 家长 | 审核 |

### 商品模块 `/api/products`
| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/products` | GET | 家长/孩子 | 商品列表 |
| `/api/products` | POST | 家长 | 上架商品 |
| `/api/products/:id` | PATCH | 家长 | 更新商品 |
| `/api/products/:id` | DELETE | 家长 | 下架商品 |

### 兑换模块 `/api/redemptions`
| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/redemptions` | GET | 家长/孩子 | 兑换记录 |
| `/api/redemptions` | POST | 孩子 | 发起兑换 |
| `/api/redemptions/:id` | PATCH | 家长 | 确认兑现 |

### 通知模块 `/api/notifications`
| 端点 | 方法 | 权限 | 说明 |
|------|------|------|------|
| `/api/notifications` | GET | 孩子 | 获取通知 |
| `/api/notifications` | POST | 家长 | 发送通知 |
| `/api/notifications/broadcast` | POST | 家长 | 广播通知 |

### 其他端点
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/photos/:key` | GET | 获取照片 |
| `/api/photos/upload` | POST | 上传照片 |
| `/api/stats` | GET | 统计数据 |
| `/api/users/family` | GET | 家庭成员 |
| `/api/activity` | GET | 活动日志 |

---

## 六、核心业务流程

### 6.1 任务流程

```
家长发布任务 → 学生查看任务 → 拍照提交 → 家长审核 → 积分发放
```

### 6.2 积分商城流程

```
家长上架商品 → 学生浏览 → 积分兑换 → 家长确认 → 发放权益
```

### 6.3 通知流程

```
家长发送通知 → 学生端轮询 → 系统通知/Toast 提醒
```

---

## 七、功能完整性

### 已实现功能

| 功能 | 状态 |
|------|------|
| 用户注册/登录 | ✅ 完整 |
| 家庭系统 | ✅ 完整 |
| 任务发布/管理 | ✅ 完整 |
| 任务提交/审核 | ✅ 完整 |
| 积分商城 | ✅ 完整 |
| 积分兑换 | ✅ 完整 |
| 照片上传/存储 | ✅ 完整 |
| 通知推送 | ✅ 完整 |
| 统计数据 | ✅ 完整 |
| PWA 支持 | ✅ 完整 |
| 主题切换 | ✅ 完整 |

### 需要改进

| 问题 | 说明 |
|------|------|
| 密码明文存储 | 建议使用 bcrypt 哈希 |
| JWT 密钥硬编码 | 应使用环境变量 |
| 缺少密码修改 | 功能缺失 |
| 缺少数据导出 | 功能缺失 |

---

## 八、测试账号

| 角色 | 用户名 | 密码 | 家庭码 |
|------|--------|------|--------|
| 家长 | dad123 | dad123 | 888666 |
| 家长 | mom123 | mom123 | 888666 |
| 孩子 | 123456 | 123456 | 888666 |
| 孩子 | 654321 | 654321 | 888666 |

---

## 九、运行命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 生产
npm run start
```

---

## 十、总结

这是一个功能完整的**家庭学习积分监督系统**，技术选型合理：

**优点**:
- 轻量级前端，无框架依赖
- 多平台部署 (Vercel + Cloudflare)
- 完整的用户角色系统
- 清晰的业务流程

**缺点**:
- 密码安全性不足
- 部分边界功能缺失
- 缺少测试代码

---

*报告由 Agent Team 并行分析生成*
