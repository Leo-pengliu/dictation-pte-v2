// backend/routes/sentences.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

//==============================
// 统一难度转换（中文/英文 → 英文）
//==============================
function normalizeDifficulty(diff) {
  if (!diff) return 'medium';

  const map = {
    // 中文
    '简单': 'easy',
    '中等': 'medium',
    '困难': 'hard',
    // 英文
    'easy': 'easy',
    'medium': 'medium',
    'hard': 'hard'
  };

  return map[diff] || 'medium';
}

//==============================
// 图片/音频上传配置
//==============================
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });


// =============================
// POST /api/sentences 上传句子
// =============================
router.post('/', upload.single('audio'), (req, res) => {
  const { original, translation, explanation, difficulty } = req.body;
  const audioPath = `/uploads/${req.file.filename}`;

  if (!original || !translation || !req.file) {
    return res.status(400).json({ error: '缺少必要字段 original / translation / audio' });
  }

  const normalized = normalizeDifficulty(difficulty);

  // 查重
  db.get(`SELECT id FROM sentences WHERE original = ?`, [original], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      fs.unlink(path.join(uploadDir, req.file.filename), () => {});
      return res.status(409).json({ error: '该句子已存在' });
    }

    const stmt = db.prepare(`
      INSERT INTO sentences (original, translation, audioPath, explanation, difficulty)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      [original, translation, audioPath, explanation || null, normalized],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          id: this.lastID,
          message: '上传成功'
        });
      }
    );

    stmt.finalize();
  });
});


// ===============================
// GET /api/sentences  分页 + 难度 + 收藏过滤
// ===============================
router.get('/', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1;
  const offset = (page - 1) * limit;
  const difficulty = req.query.difficulty; // 可选参数，可能是 easy / medium / hard / 简单 / 中等 / 困难
  const favoriteFlag = req.query.favorite; // '1' 表示只看收藏

  // 小日志方便你在后端看请求参数
  console.log('[GET /api/sentences] query =>', req.query);

  // 难度：中文/英文 → 英文枚举
  const normalized = difficulty ? normalizeDifficulty(difficulty) : null;

  // 中文 + 英文映射，用于 SQL IN 查询
  const diffMap = {
    easy: ['easy', '简单'],
    medium: ['medium', '中等'],
    hard: ['hard', '困难'],
  };

  const diffValues = normalized ? diffMap[normalized] : null;

  // 收藏筛选：favorite=1 才视为 true
  const favoriteOnly = favoriteFlag === '1';

  // ======= 动态拼 WHERE 子句 =======
  const whereParts = [];
  const params = [];

  if (diffValues) {
    whereParts.push('difficulty IN (?, ?)');
    params.push(...diffValues);
  }

  if (favoriteOnly) {
    whereParts.push('isFavorite = 1');
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  // ======= 1. 查询总数 =======
  const countSQL = `SELECT COUNT(*) AS total FROM sentences ${whereClause}`;

  db.get(countSQL, params, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = countRow?.total || 0;

    // ======= 2. 查询数据 =======
    const dataSQL = `
      SELECT *
      FROM sentences
      ${whereClause}
      ORDER BY id
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limit, offset];

    db.all(dataSQL, dataParams, (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // ⭐ 统一 difficulty（老数据中文也会被转成 easy/medium/hard）
      const normalizedRows = rows.map(r => ({
        ...r,
        difficulty: normalizeDifficulty(r.difficulty),
      }));

      res.json({
        data: normalizedRows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    });
  });
});

// ===============================
// GET /api/sentences/:id  单句
// ===============================
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  db.get(`SELECT * FROM sentences WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: '未找到句子' });

    row.difficulty = normalizeDifficulty(row.difficulty);
    res.json({ data: row });
  });
});


// ===============================
// PATCH /api/sentences/:id 更新某个字段
// ===============================
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // 若有 difficulty，统一转换
  if (updates.difficulty) {
    updates.difficulty = normalizeDifficulty(updates.difficulty);
  }

  const fields = Object.keys(updates);
  if (!fields.length) return res.status(400).json({ error: '无更新字段' });

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
