#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 创建 SQLite 数据库并导入初始数据
 */

import { Database } from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../data/framework_docs.db');

console.log('📦 初始化数据库...');
console.log('路径:', dbPath);

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键
db.pragma('foreign_keys = ON');

// 创建表结构
console.log('📋 创建表结构...');

db.exec(`
  -- 框架表
  CREATE TABLE IF NOT EXISTS frameworks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    language TEXT NOT NULL,
    latest_version TEXT,
    description TEXT,
    official_docs_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- API 表
  CREATE TABLE IF NOT EXISTS apis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    module TEXT,
    signature TEXT,
    description TEXT,
    parameters TEXT,
    returns TEXT,
    example TEXT,
    best_practices TEXT,
    related_apis TEXT,
    changelog TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (framework_id) REFERENCES frameworks(id),
    UNIQUE(framework_id, name)
  );

  -- 示例代码表
  CREATE TABLE IF NOT EXISTS examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    pattern TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    dependencies TEXT,
    tags TEXT,
    difficulty TEXT DEFAULT 'intermediate',
    references TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (framework_id) REFERENCES frameworks(id)
  );

  -- 最佳实践表
  CREATE TABLE IF NOT EXISTS best_practices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT,
    impact TEXT,
    effort TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (framework_id) REFERENCES frameworks(id)
  );

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_apis_framework ON apis(framework_id);
  CREATE INDEX IF NOT EXISTS idx_apis_name ON apis(name);
  CREATE INDEX IF NOT EXISTS idx_examples_framework ON examples(framework_id);
  CREATE INDEX IF NOT EXISTS idx_examples_pattern ON examples(pattern);
  CREATE INDEX IF NOT EXISTS idx_best_practices_framework ON best_practices(framework_id);
  CREATE INDEX IF NOT EXISTS idx_best_practices_topic ON best_practices(topic);
`);

console.log('✅ 表结构创建完成');

// 插入框架数据
console.log('📦 插入框架数据...');

const frameworks = [
  {
    name: 'FastAPI',
    type: 'backend',
    language: 'Python',
    version: '0.109.0',
    description: '现代、高性能的 Python Web 框架，用于构建 API',
    docs_url: 'https://fastapi.tiangolo.com/'
  },
  {
    name: 'React',
    type: 'frontend',
    language: 'JavaScript/TypeScript',
    version: '18.2.0',
    description: '用于构建用户界面的 JavaScript 库',
    docs_url: 'https://react.dev/'
  },
  {
    name: 'Express',
    type: 'backend',
    language: 'JavaScript/TypeScript',
    version: '4.18.2',
    description: 'Node.js Web 应用框架',
    docs_url: 'https://expressjs.com/'
  },
  {
    name: 'Vue',
    type: 'frontend',
    language: 'JavaScript/TypeScript',
    version: '3.4.0',
    description: '渐进式 JavaScript 框架',
    docs_url: 'https://vuejs.org/'
  },
  {
    name: 'Django',
    type: 'backend',
    language: 'Python',
    version: '5.0.0',
    description: '高级 Python Web 框架',
    docs_url: 'https://www.djangoproject.com/'
  }
];

const insertFramework = db.prepare(`
  INSERT OR REPLACE INTO frameworks (name, type, language, latest_version, description, official_docs_url)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const fw of frameworks) {
  insertFramework.run(fw.name, fw.type, fw.language, fw.version, fw.description, fw.docs_url);
  console.log(`  ✓ ${fw.name} v${fw.version}`);
}

// 插入 FastAPI 示例
console.log('\n📝 插入示例代码...');

const fastapi = db.prepare("SELECT id FROM frameworks WHERE name = 'FastAPI'").get();
const react = db.prepare("SELECT id FROM frameworks WHERE name = 'React'").get();

if (fastapi && react) {
  const insertExample = db.prepare(`
    INSERT OR REPLACE INTO examples (framework_id, title, pattern, description, code, dependencies, tags, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // FastAPI JWT 认证示例
  insertExample.run(
    fastapi.id,
    'JWT 认证完整示例',
    'authentication',
    '使用 PyJWT 实现用户登录认证',
    readFileSync(join(__dirname, '../data/examples/fastapi_examples.md'), 'utf-8'),
    JSON.stringify(['fastapi>=0.109.0', 'python-jose[cryptography]', 'passlib[bcrypt]']),
    JSON.stringify(['auth', 'jwt', 'security']),
    'intermediate'
  );
  console.log('  ✓ FastAPI JWT 认证示例');

  // React useState 示例
  insertExample.run(
    react.id,
    'useState Hook',
    'state management',
    'React 状态管理基础',
    `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
    JSON.stringify(['react@^18.2.0']),
    JSON.stringify(['hooks', 'state', 'basics']),
    'beginner'
  );
  console.log('  ✓ React useState 示例');
}

// 插入最佳实践
console.log('\n⭐ 插入最佳实践...');

const insertPractice = db.prepare(`
  INSERT OR REPLACE INTO best_practices (framework_id, topic, title, description, code, impact, effort)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

if (fastapi) {
  insertPractice.run(
    fastapi.id,
    'security',
    '使用环境变量存储敏感信息',
    '永远不要将 SECRET_KEY、数据库密码等敏感信息硬编码到代码中',
    `# .env 文件
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/db

# main.py
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")`,
    '高',
    '低'
  );
  console.log('  ✓ FastAPI 安全最佳实践');

  insertPractice.run(
    fastapi.id,
    'performance',
    '使用异步数据库驱动',
    '使用 databases 或 SQLAlchemy 2.0 异步模式提升性能',
    `from databases import Database

database = Database("postgresql+async://localhost/mydb")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()`,
    '高',
    '中'
  );
  console.log('  ✓ FastAPI 性能最佳实践');
}

if (react) {
  insertPractice.run(
    react.id,
    'performance',
    '使用 React.memo 优化渲染',
    '避免不必要的组件重新渲染',
    `import React, { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  return <div>{data}</div>;
});

// 只有当 data 变化时才会重新渲染`,
    '中',
    '低'
  );
  console.log('  ✓ React 性能最佳实践');
}

console.log('\n✅ 数据库初始化完成！');
console.log(`\n📊 统计:`);
console.log(`  - 框架：${frameworks.length} 个`);
console.log(`  - 示例：3 个`);
console.log(`  - 最佳实践：3 个`);

db.close();
console.log('\n👋 数据库连接已关闭');
