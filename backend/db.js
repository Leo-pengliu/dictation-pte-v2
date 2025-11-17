// backend/db.js
const { createClient } = require('@libsql/client');
require('dotenv').config();

/**
 * 1. 检查环境变量
 */
if (!process.env.TURSO_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('Turso environment variables missing');
  console.error('TURSO_URL:', process.env.TURSO_URL);
  console.error('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'SET' : 'MISSING');
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

function toPlainNumber(v) {
  return typeof v === 'bigint' ? Number(v) : v;
}

/**
 * 2. 兼容 sqlite3 回调风格
 */
const db = {
  get(sql, params, callback) {
    client
      .execute({ sql, args: params || [] })
      .then((result) => callback(null, result.rows[0] || null))
      .catch((err) => callback(err));
  },

  all(sql, params, callback) {
    client
      .execute({ sql, args: params || [] })
      .then((result) => callback(null, result.rows))
      .catch((err) => callback(err, []));
  },

  run(sql, params, callback) {
    client
      .execute({ sql, args: params || [] })
      .then((result) =>
        callback(null, {
          changes: toPlainNumber(result.rowsAffected ?? 0),
          lastID: toPlainNumber(result.lastInsertRowid ?? 0),
        })
      )
      .catch((err) => callback(err));
  },

  prepare(sql) {
    return {
      run(params, callback) {
        client
          .execute({ sql, args: params || [] })
          .then((result) =>
            callback(null, {
              lastID: toPlainNumber(result.lastInsertRowid ?? 0),
            })
          )
          .catch((err) => callback(err));
      },
      finalize() {},
    };
  },
};


/**
 * 3. 初始化表结构
 */
(async () => {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sentences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original TEXT NOT NULL UNIQUE,
        translation TEXT NOT NULL,
        audioPath TEXT NOT NULL,
        explanation TEXT,
        difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 新增 users 表
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        name TEXT,
        provider TEXT DEFAULT 'local',        -- local / google / github ...
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[DB] Turso 表初始化成功');
  } catch (err) {
    console.error('[DB] 初始化失败:', err.message);
    process.exit(1);
  }
})();

module.exports = db;