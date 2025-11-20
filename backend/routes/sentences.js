const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('./auth'); // ⭐ 必须加上验证

// 上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

/**
 * POST /api/sentences
 * 上传句子 + 查重
 */
router.post('/', upload.single('audio'), (req, res) => {
  const { original, translation, explanation, difficulty = 'medium' } = req.body;
  const audioPath = `/uploads/${req.file.filename}`;

  if (!original || !translation || !req.file) {
    return res.status(400).json({ error: '缺少必要字段：original, translation, audio' });
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty 必须是 easy, medium 或 hard' });
  }

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
      [original, translation, audioPath, explanation || null, difficulty],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ id: this.lastID, message: '上传成功' });
      }
    );
    stmt.finalize();
  });
});

/**
 * GET /api/sentences
 * ⭐ 难度筛选 + 收藏筛选 + 返回 isFavorite
 */
// GET: 分页获取句子（返回 difficulty，支持 ?difficulty=easy|medium|hard）
router.get('/', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1;
  const offset = (page - 1) * limit;

  const difficulty = req.query.difficulty;
  const validDifficulties = ['easy', 'medium', 'hard'];
  const hasDifficulty = difficulty && validDifficulties.includes(difficulty);

  // 按是否有 difficulty 构造 WHERE 和参数
  const whereSql = hasDifficulty ? 'WHERE difficulty = ?' : '';
  const paramsForCount = hasDifficulty ? [difficulty] : [];
  const paramsForSelect = hasDifficulty
    ? [difficulty, limit, offset]
    : [limit, offset];

  // 先按筛选条件统计总数
  db.get(
    `SELECT COUNT(*) as total FROM sentences ${whereSql}`,
    paramsForCount,
    (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });

      const total = countRow?.total || 0;

      // 再按同样条件拿这一页的数据
      db.all(
        `SELECT id, original, translation, audioPath, explanation, difficulty
         FROM sentences
         ${whereSql}
         ORDER BY id
         LIMIT ? OFFSET ?`,
        paramsForSelect,
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            data: rows,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit) || 1,
            },
          });
        }
      );
    }
  );
});


/**
 * GET /api/sentences/:id
 * 返回 isFavorite
 */
router.get('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(id)) return res.status(400).json({ error: '无效 ID' });

  db.get(
    `
      SELECT 
        s.id,
        s.original,
        s.translation,
        s.audioPath,
        s.explanation,
        s.difficulty,
        CASE WHEN f.user_id IS NULL THEN 0 ELSE 1 END AS isFavorite
      FROM sentences s
      LEFT JOIN favorites f
        ON f.sentence_id = s.id AND f.user_id = ?
      WHERE s.id = ?
    `,
    [userId, id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: '未找到句子' });
      res.json({ data: row });
    }
  );
});

/**
 * POST /api/sentences/:id/favorite
 * ⭐ 收藏/取消收藏 toggle 接口
 */
router.post('/:id/favorite', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const sentenceId = parseInt(req.params.id, 10);

  if (isNaN(sentenceId)) {
    return res.status(400).json({ error: '无效句子 ID' });
  }

  db.get(
    `SELECT id FROM favorites WHERE user_id = ? AND sentence_id = ?`,
    [userId, sentenceId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (row) {
        db.run(
          `DELETE FROM favorites WHERE user_id = ? AND sentence_id = ?`,
          [userId, sentenceId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ isFavorite: false });
          }
        );
      } else {
        db.run(
          `INSERT INTO favorites (user_id, sentence_id) VALUES (?, ?)`,
          [userId, sentenceId],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ isFavorite: true });
          }
        );
      }
    }
  );
});

/**
 * PATCH /api/sentences/:id
 */
router.patch('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const keys = Object.keys(updates);
  if (!keys.length) return res.status(400).json({ error: '无更新字段' });

  if (updates.difficulty) {
    const valid = ['easy', 'medium', 'hard'];
    if (!valid.includes(updates.difficulty)) {
      return res.status(400).json({ error: 'difficulty 必须是 easy, medium 或 hard' });
    }
  }

  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => updates[k]);

  db.run(
    `UPDATE sentences SET ${setSql} WHERE id = ?`,
    [...values, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: '未找到句子' });
      res.json({ message: '更新成功' });
    }
  );
});

module.exports = router;
