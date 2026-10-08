const express = require('express');
const router = express.Router();
const { query, models } = require('../db');
const { Review } = models;

// GET /api/reviews
router.get('/reviews', async (req, res) => {
  try {
    const rows = await query(
      `SELECT r.RevID, r.UserID, r.Text,
              u.FirstName + ' ' + u.LastName AS UserName
       FROM Reviews r
       JOIN Users u ON r.UserID=u.UserID
       ORDER BY r.RevID DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/reviews]', err.message);
    res.status(500).json([]);
  }
});

// POST /api/reviews
router.post('/reviews', async (req, res) => {
  const { userId, text } = req.body;
  if (!userId || !text?.trim())
    return res.status(400).json({ success: false, message: 'userId и text обязательны' });
  try {
    await Review.create({ UserID: userId, Text: text.trim() });
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/reviews]', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
