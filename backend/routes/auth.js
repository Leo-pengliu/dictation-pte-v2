// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

// 生成 JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// 中间件：验证 Cookie 里的 token
function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: '未登录' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效或过期的登录状态' });
  }
}

// POST /api/auth/register  注册
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email 和 password 为必填' });
  }

  // 1. 查询是否已有用户
  db.get(`SELECT id FROM users WHERE email = ?`, [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ error: '该邮箱已注册' });

    try {
      const passwordHash = await bcrypt.hash(password, 10);

      const stmt = db.prepare(`
        INSERT INTO users (email, passwordHash, name, provider)
        VALUES (?, ?, ?, 'local')
      `);

      stmt.run([email, passwordHash, name || null], (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const user = { id: result.lastID, email, name: name || null };
        const token = signToken(user);

        // 设置 httpOnly Cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 3600 * 1000
        });

        res.json({ user });
      });

      stmt.finalize();
    } catch (hashErr) {
      res.status(500).json({ error: hashErr.message });
    }
  });
});

// POST /api/auth/login  登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // console.log('[LOGIN] attempt', email);

  if (!email || !password) {
    return res.status(400).json({ error: 'email 和 password 为必填' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    // console.log('[LOGIN] user from DB:', user); // 关键日志

    if (!user) return res.status(401).json({ error: '邮箱或密码错误' });

    try {
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ error: '邮箱或密码错误' });

      const safeUser = { id: user.id, email: user.email, name: user.name };
      const token = signToken(safeUser);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000
      });

      res.json({ user: safeUser });
    } catch (cmpErr) {
      res.status(500).json({ error: cmpErr.message });
    }
  });
});

// GET /api/auth/me  获取当前登录用户
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout  退出登录
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '已退出登录' });
});

/**
 * 预留：第三方登录入口（Google 为例）
 * 前端可以访问 /api/auth/google 重定向去 Google 登录
 * 这里先放占位，后面接入真正的 OAuth 逻辑
 */
router.get('/google', (req, res) => {
  // TODO: 实际使用 passport / 自己拼 OAuth URL
  res.status(501).json({ error: 'Google OAuth 尚未实现，只是预留接口' });
});

module.exports = { router, authMiddleware };
