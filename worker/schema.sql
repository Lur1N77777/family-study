-- ========================================
-- D1 数据库初始化
-- ========================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('parent', 'child')),
  family_code TEXT NOT NULL,
  avatar TEXT DEFAULT '👦',
  points INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_users_family ON users(family_code);
CREATE INDEX idx_users_username ON users(username);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK(type IN ('daily', 'weekly', 'once', 'semester')),
  points INTEGER NOT NULL DEFAULT 0,
  creator_id TEXT NOT NULL,
  family_code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE INDEX idx_tasks_family ON tasks(family_code, status);

-- 任务提交表
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  photo_key TEXT,
  points INTEGER DEFAULT 0,
  reject_reason TEXT,
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (child_id) REFERENCES users(id)
);

CREATE INDEX idx_submissions_child ON submissions(child_id, status);
CREATE INDEX idx_submissions_family ON submissions(child_id);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '🎁',
  category TEXT DEFAULT 'virtual' CHECK(category IN ('virtual', 'physical')),
  price INTEGER NOT NULL DEFAULT 0,
  creator_id TEXT NOT NULL,
  family_code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE INDEX idx_products_family ON products(family_code, status);

-- 兑换记录表
CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_emoji TEXT DEFAULT '🎁',
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (child_id) REFERENCES users(id)
);

CREATE INDEX idx_redemptions_child ON redemptions(child_id, status);

-- 活动日志表
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  family_code TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_activity_family ON activity_log(family_code, timestamp);

-- 演示数据
INSERT OR IGNORE INTO users (id, username, password_hash, role, family_code, avatar, points, created_at)
VALUES
  ('parent_1', '爸爸', 'dad123', 'parent', '888666', '👨', 0, 1709000000000),
  ('parent_2', '妈妈', 'mom123', 'parent', '888666', '👩', 0, 1709000000000),
  ('child_1', '小明', '123456', 'child', '888666', '👦', 280, 1709000000000),
  ('child_2', '小红', '654321', 'child', '888666', '👧', 120, 1709000000000);
