const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query, models } = require('../db');
const { ServiceCategory, MainService } = models;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const rows = await ServiceCategory.findAll({
      where: { IsActive: true },
      attributes: ['CategoryID', 'CategoryName'],
      order: [['CategoryName', 'ASC']],
    });
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/services
router.get('/services', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ms.ServiceID AS id, ms.ServiceName AS name, ms.Description AS description,
              ms.Price AS price, ms.DurationMinutes AS duration,
              sc.CategoryName AS category, sc.CategoryID AS categoryId,
              ms.Effect AS effect, ms.Indications AS indications,
              CASE WHEN ms.Photo IS NOT NULL THEN 1 ELSE 0 END AS hasPhoto
       FROM MainServices ms
       LEFT JOIN ServiceCategories sc ON ms.CategoryID=sc.CategoryID
       WHERE ms.IsActive=1 ORDER BY ms.ServiceName`
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/services/search
router.get('/services/search', async (req, res) => {
  const { name } = req.query;
  try {
    const rows = await query(
      `SELECT ms.ServiceID AS id, ms.ServiceName AS name, ms.Description AS description,
              ms.Price AS price, ms.DurationMinutes AS duration, sc.CategoryName AS category
       FROM MainServices ms
       LEFT JOIN ServiceCategories sc ON ms.CategoryID=sc.CategoryID
       WHERE ms.IsActive=1 AND ms.ServiceName LIKE ?`,
      [`%${name}%`]
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/services/:id/photo
router.get('/services/:id/photo', async (req, res) => {
  try {
    const rows = await query(`SELECT Photo FROM MainServices WHERE ServiceID=?`, [req.params.id]);
    if (!rows || rows.length === 0 || !rows[0].Photo) return res.status(404).end();
    res.set('Content-Type', 'image/jpeg');
    res.send(rows[0].Photo);
  } catch (err) { res.status(500).end(); }
});

// GET /api/services/:id/detail
router.get('/services/:id/detail', async (req, res) => {
  try {
    const svcRows = await query(
      `SELECT ms.ServiceID AS id, ms.ServiceName AS name, ms.Description AS description,
              ms.Price AS price, ms.DurationMinutes AS duration, sc.CategoryName AS category,
              ms.Effect AS effect, ms.Indications AS indications,
              CASE WHEN ms.Photo IS NOT NULL THEN 1 ELSE 0 END AS hasPhoto
       FROM MainServices ms
       LEFT JOIN ServiceCategories sc ON ms.CategoryID=sc.CategoryID
       WHERE ms.ServiceID=? AND ms.IsActive=1`,
      [req.params.id]
    );
    if (!svcRows || svcRows.length === 0) return res.status(404).json({ message: 'Не найдено' });
    const svc = svcRows[0];
    const drugs = await query(
      `SELECT m.MedID AS id, m.MedName AS name, m.Description AS description,
              CASE WHEN m.Photo IS NOT NULL THEN 1 ELSE 0 END AS hasPhoto
       FROM Medications m
       JOIN ProcedureMedications pm ON m.MedID=pm.MedID
       WHERE pm.ProcID=?`,
      [req.params.id]
    );
    svc.drugs = drugs || [];
    res.json(svc);
  } catch (err) {
    console.error('[GET /api/services/:id/detail]', err.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/services/filter
router.post('/services/filter', async (req, res) => {
  const { ServiceType, MaxPrice, MaxDuration } = req.body;
  try {
    let sql = `SELECT ms.ServiceID AS id, ms.ServiceName AS name, ms.Description AS description,
                      ms.Price AS price, ms.DurationMinutes AS duration, sc.CategoryName AS category,
                      CASE WHEN ms.Photo IS NOT NULL THEN 1 ELSE 0 END AS hasPhoto
               FROM MainServices ms
               LEFT JOIN ServiceCategories sc ON ms.CategoryID=sc.CategoryID
               WHERE ms.IsActive=1`;
    const params = [];
    if (ServiceType) { sql += ` AND sc.CategoryName=?`; params.push(ServiceType); }
    if (MaxPrice)    { sql += ` AND ms.Price<=?`;        params.push(MaxPrice); }
    if (MaxDuration) { sql += ` AND ms.DurationMinutes<=?`; params.push(MaxDuration); }
    sql += ` ORDER BY ms.ServiceName`;
    res.json(await query(sql, params));
  } catch (err) { res.status(500).json([]); }
});

// DELETE /api/services/delete/:id
router.delete('/services/delete/:id', async (req, res) => {
  try {
    await MainService.update({ IsActive: false }, { where: { ServiceID: req.params.id } });
    res.json({ success: true, message: 'Процедура удалена' });
  } catch (err) { res.status(500).json({ success: false }); }
});

// GET /api/medications/:id/photo
router.get('/medications/:id/photo', async (req, res) => {
  try {
    const rows = await query(`SELECT Photo FROM Medications WHERE MedID=?`, [req.params.id]);
    if (!rows || rows.length === 0 || !rows[0].Photo) return res.status(404).end();
    res.set('Content-Type', 'image/jpeg');
    res.send(rows[0].Photo);
  } catch (err) { res.status(500).end(); }
});

module.exports = router;
