// backend/routes/sentences.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // ← Turso 兼容的 db
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// POST: 上传句子 + 查重 + 支持 difficulty
router.post('/', upload.single('audio'), (req, res) => {
  const { original, translation, explanation, difficulty = 'medium' } = req.body;
  const audioPath = `/uploads/${req.file.filename}`;

  // 验证必填字段
  if (!original || !translation || !req.file) {
    return res.status(400).json({ error: '缺少必要字段：original, translation, audio' });
  }

  // 验证 difficulty 合法值
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (difficulty && !validDifficulties.includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty 必须是 easy, medium 或 hard' });
  }

  // 1. 查询是否已存在相同 original
  db.get(`SELECT id FROM sentences WHERE original = ?`, [original], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      // 已存在 → 删除刚上传的音频 + 返回提示
      const filePath = path.join(uploadDir, req.file.filename);
      fs.unlink(filePath, () => {}); // 异步删除
      return res.status(409).json({ error: '该句子已存在，请添加其他句子' });
    }

    // 2. 不存在 → 插入新记录（含 difficulty）
    const stmt = db.prepare(`
      INSERT INTO sentences (original, translation, audioPath, explanation, difficulty)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      [original, translation, audioPath, explanation || null, difficulty],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: '上传成功' });
      }
    );
    stmt.finalize();
  });
});

// GET: 分页获取句子（返回 difficulty）
router.get('/', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1;
  const offset = (page - 1) * limit;

  // 获取总数
  db.get(`SELECT COUNT(*) as total FROM sentences`, [], (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = countRow?.total || 0;

    // 获取数据（含 difficulty）
    db.all(
      `SELECT id, original, translation, audioPath, explanation, difficulty 
       FROM sentences 
       ORDER BY id 
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          data: rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
          }
        });
      }
    );
  });
});

// GET /:id - 获取单个句子（含 difficulty）
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: '无效 ID' });

  db.get(
    `SELECT id, original, translation, audioPath, explanation, difficulty 
     FROM sentences WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: '未找到句子' });
      res.json({ data: row });
    }
  );
});

// PATCH /:id - 更新字段（支持 difficulty）
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates);

  if (!fields.length) return res.status(400).json({ error: '无更新字段' });

  // 验证 difficulty 合法性
  if (updates.difficulty) {
    const valid = ['easy', 'medium', 'hard'];
    if (!valid.includes(updates.difficulty)) {
      return res.status(400).json({ error: 'difficulty 必须是 easy, medium 或 hard' });
    }
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  db.run(
    `UPDATE sentences SET ${setClause} WHERE id = ?`,
    [...values, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: '未找到句子' });
      res.json({ message: '更新成功' });
    }
  );
});

module.exports = router;