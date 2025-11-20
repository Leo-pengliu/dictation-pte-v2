const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ⭐ 让 sentences.js 可以使用 authMiddleware
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

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email 和 password 为必填' });
  }

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

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email 和 password 为必填' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

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

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '已退出登录' });
});

module.exports = { router, authMiddleware };
