# 约约依可学习系统

家庭积分管理 Web 应用，帮助家长监督孩子学习。

## 在线地址

- **正式站**: https://familystudy.lmhzeq.fun
- **测试站**: https://dev.family-study.pages.dev

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | 原生 JavaScript (无框架) + Vite |
| 后端 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| 对象存储 | Cloudflare R2 |
| 部署 | Cloudflare Pages + Workers |

## 项目结构

```
a3/
├── public/                 # 静态资源
│   ├── logo.png          # 网站 Logo
│   ├── sw.js             # Service Worker (PWA 缓存)
│   └── manifest.json      # PWA 配置
├── src/
│   ├── main.js           # 应用入口
│   ├── styles/           # 样式文件
│   │   ├── index.css
│   │   ├── animations.css
│   │   ├── tokens.css
│   │   └── reset.css
│   ├── pages/            # 页面组件
│   │   ├── landing.js     # 首页
│   │   ├── login.js      # 登录/注册
│   │   ├── student/       # 学生端
│   │   │   ├── dashboard.js
│   │   │   ├── tasks.js
│   │   │   ├── shop.js
│   │   │   └── profile.js
│   │   └── parent/       # 家长端
│   │       ├── overview.js
│   │       ├── review.js
│   │       ├── tasks.js
│   │       ├── products.js
│   │       └── settings.js
│   └── utils/            # 工具函数
│       ├── api.js         # API 客户端
│       ├── auth.js       # 认证管理
│       ├── store.js      # 状态管理
│       ├── router.js     # 路由
│       ├── nav.js        # 底部导航
│       ├── camera.js     # 拍照/压缩
│       └── notifications.js
├── worker/                # Cloudflare Worker 后端
│   ├── index.js          # 入口
│   ├── schema.sql        # 数据库结构
│   ├── routes/           # API 路由
│   │   ├── auth.js       # 登录/注册
│   │   ├── tasks.js      # 任务
│   │   ├── submissions.js # 提交审核
│   │   ├── products.js   # 商品
│   │   ├── redemptions.js# 兑换
│   │   ├── photos.js     # 照片上传
│   │   └── stats.js      # 统计
│   └── utils/
│       ├── jwt.js        # JWT 认证
│       └── response.js   # 响应封装
├── wrangler.toml         # Cloudflare 配置
├── package.json
└── vite.config.js
```

## 功能说明

### 家长端

| 功能 | 说明 |
|------|------|
| 看板 | 查看家庭概览、统计、家庭成员 |
| 审核 | 审核孩子提交的任务、兑换申请 |
| 任务 | 发布/管理学习任务 |
| 商品 | 添加/管理可兑换的商品 |
| 设置 | 主题切换、登出 |

### 学生端

| 功能 | 说明 |
|------|------|
| 首页 | 查看积分、任务、热门商品 |
| 任务 | 领取并提交任务 |
| 商城 | 兑换商品 |
| 我的 | 查看积分记录 |

## 数据库表结构

### users (用户表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| username | TEXT | 用户名 (唯一) |
| password_hash | TEXT | 密码 (明文存储，生产环境需加密) |
| role | TEXT | 角色: parent / child |
| family_code | TEXT | 家庭码 (6位数字) |
| avatar | TEXT | 头像 Emoji |
| points | INTEGER | 积分 |
| created_at | INTEGER | 创建时间戳 |

### tasks (任务表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| title | TEXT | 任务标题 |
| description | TEXT | 任务描述 |
| type | TEXT | 类型: daily / weekly / once / semester |
| points | INTEGER | 积分 |
| creator_id | TEXT | 创建者 ID |
| family_code | TEXT | 家庭码 |
| target_child_id | TEXT | 指定孩子 (可选) |
| status | TEXT | 状态: active / archived |

### submissions (提交表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| task_id | TEXT | 任务 ID |
| child_id | TEXT | 孩子 ID |
| status | TEXT | 状态: pending / approved / rejected |
| photo_key | TEXT | R2 照片路径 |
| points | INTEGER | 获得的积分 |
| reject_reason | TEXT | 驳回原因 |
| created_at | INTEGER | 提交时间 |
| reviewed_at | INTEGER | 审核时间 |

### products (商品表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 商品名称 |
| description | TEXT | 描述 |
| emoji | TEXT | Emoji 图标 |
| category | TEXT | 类别: virtual / physical |
| price | INTEGER | 价格 (积分) |
| creator_id | TEXT | 创建者 ID |
| family_code | TEXT | 家庭码 |
| status | TEXT | 状态: active / archived |

### redemptions (兑换表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| product_id | TEXT | 商品 ID |
| child_id | TEXT | 孩子 ID |
| product_name | TEXT | 商品名称 |
| product_emoji | TEXT | 商品 Emoji |
| price | INTEGER | 消耗积分 |
| status | TEXT | 状态: pending / confirmed |
| created_at | INTEGER | 兑换时间 |

### activity_log (活动日志)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| type | TEXT | 类型 |
| message | TEXT | 消息内容 |
| family_code | TEXT | 家庭码 |
| timestamp | INTEGER | 时间戳 |

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 任务
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PATCH /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

### 提交审核
- `GET /api/submissions` - 获取提交列表
- `POST /api/submissions` - 提交任务
- `PATCH /api/submissions/:id` - 审核 (approve/reject)

### 商品
- `GET /api/products` - 获取商品列表
- `POST /api/products` - 创建商品
- `PATCH /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品

### 兑换
- `GET /api/redemptions` - 获取兑换列表
- `POST /api/redemptions` - 申请兑换
- `PATCH /api/redemptions/:id` - 确认兑换

### 照片
- `GET /api/photos/:key` - 获取照片
- `POST /api/photos/upload` - 上传照片

### 家庭
- `GET /api/users/family` - 获取家庭成员

### 统计
- `GET /api/stats` - 获取统计数据

## 部署指南

### 前置要求
- Node.js 18+
- Cloudflare 账户

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 部署

#### 1. 部署前端 (Pages)
```bash
npx wrangler pages deploy ./dist --project-name=family-study
```

#### 2. 部署后端 (Workers)
```bash
npx wrangler deploy
```

#### 3. 初始化数据库
```bash
npx wrangler d1 execute family-study-db --remote --file=./worker/schema.sql
```

### 环境变量

在 `wrangler.toml` 中配置：
- `JWT_SECRET` - JWT 密钥 (生产环境需修改)
- `CORS_ORIGIN` - 允许的跨域来源

## 优化记录

| 日期 | 优化项 | 效果 |
|------|--------|------|
| 2026-02-27 | Logo 压缩 | 339KB → 90KB |
| 2026-02-27 | 代码分割 | 主 JS 111KB → 28KB |
| 2026-02-27 | 审核通过删照片 | 释放 R2 存储空间 |
| 2026-02-27 | PWA 缓存 | 第二次访问秒开 |
| 2026-02-27 | 页面切换动画 | 滑动转场效果 |

## 注意事项

1. **密码安全**: 当前密码以明文存储，生产环境建议加密
2. **iOS 通知**: Web Push 通知在 iOS 上有限制
3. **存储限额**: D1 免费 5MB，R2 免费 1GB
4. **Service Worker**: 首次加载后生效，刷新页面后可体验缓存效果

## 许可证

MIT
