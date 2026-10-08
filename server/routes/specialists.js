const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/specialists
router.get('/specialists', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ms.SpecialistID AS id, u.FirstName AS firstName, u.LastName AS lastName,
              ms.Experience AS experience, ms.SpecDescription AS description,
              CASE WHEN u.Photo IS NOT NULL THEN 1 ELSE 0 END AS hasPhoto
       FROM MainSpecialists ms JOIN Users u ON ms.UserID=u.UserID
       WHERE u.IsActive=1 ORDER BY u.LastName, u.FirstName`
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/specialists/search
router.get('/specialists/search', async (req, res) => {
  const { name } = req.query;
  try {
    const rows = await query(
      `SELECT DISTINCT ms.SpecialistID AS id, u.FirstName AS firstName, u.LastName AS lastName,
              ms.Experience AS experience, ms.SpecDescription AS description,
              CASE WHEN u.Photo IS NOT NULL THEN 1 ELSE 0 END AS hasPhoto
       FROM MainSpecialists ms
       JOIN Users u ON ms.UserID=u.UserID
       JOIN SpecialistService ss ON ms.SpecialistID=ss.SpecID
       JOIN MainServices svc ON ss.ServiceID=svc.ServiceID
       WHERE u.IsActive=1 AND svc.ServiceName LIKE ?
       ORDER BY u.LastName, u.FirstName`,
      [`%${name}%`]
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/specialists/by-service/:serviceId
router.get('/specialists/by-service/:serviceId', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ms.SpecialistID AS id, u.LastName + ' ' + u.FirstName AS fullName
       FROM MainSpecialists ms
       JOIN Users u ON ms.UserID=u.UserID
       JOIN SpecialistService ss ON ms.SpecialistID=ss.SpecID
       WHERE ss.ServiceID=? AND u.IsActive=1`,
      [req.params.serviceId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/specialists/:id/photo
router.get('/specialists/:id/photo', async (req, res) => {
  try {
    const rows = await query(
      `SELECT u.Photo FROM MainSpecialists ms JOIN Users u ON ms.UserID=u.UserID WHERE ms.SpecialistID=?`,
      [req.params.id]
    );
    if (!rows || rows.length === 0 || !rows[0].Photo) return res.status(404).end();
    res.set('Content-Type', 'image/jpeg');
    res.send(rows[0].Photo);
  } catch (err) { res.status(500).end(); }
});

// GET /api/specialistsAdm
router.get('/specialistsAdm', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ms.SpecialistID, u.FirstName AS SpFirstName, u.LastName AS SpLastName,
              ms.Experience AS ExperienceYears, ms.SpecDescription, u.Phone, u.Email, ms.UserID
       FROM MainSpecialists ms JOIN Users u ON ms.UserID=u.UserID ORDER BY u.LastName`
    );
    res.json({ success: true, specialists: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

// DELETE /api/specialists/delete/:id
router.delete('/specialists/delete/:id', async (req, res) => {
  try {
    const { models } = require('../db');
    const { User, MainSpecialist } = models;
    const spec = await MainSpecialist.findOne({ where: { SpecialistID: req.params.id } });
    if (spec) await User.update({ IsActive: false }, { where: { UserID: spec.UserID } });
    res.json({ success: true, message: 'Специалист деактивирован' });
  } catch (err) { res.status(500).json({ success: false }); }
});

// GET /api/specialistServices
router.get('/specialistServices', async (req, res) => {
  try {
    const rows = await query(`SELECT SpecID AS SpecialistID, ServiceID FROM SpecialistService ORDER BY SpecID`);
    res.json({ specialistServices: rows });
  } catch (err) { res.status(500).json({ specialistServices: [] }); }
});

// GET /api/service-names/:specialistId
router.get('/service-names/:specialistId', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ms.ServiceID AS id, ms.ServiceName AS name
       FROM MainServices ms JOIN SpecialistService ss ON ms.ServiceID=ss.ServiceID
       WHERE ss.SpecID=? AND ms.IsActive=1`,
      [req.params.specialistId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// POST /api/specialistServices/add
router.post('/specialistServices/add', async (req, res) => {
  const { SpecialistID, ServiceID } = req.body;
  try {
    await query(`INSERT INTO SpecialistService (SpecID, ServiceID) VALUES (?,?)`, [SpecialistID, ServiceID]);
    res.json({ success: true, message: 'Связь добавлена' });
  } catch (err) { res.status(500).json({ success: false, message: 'Ошибка или связь уже существует' }); }
});

// DELETE /api/specialistServices/delete
router.delete('/specialistServices/delete', async (req, res) => {
  const { SpecialistID, ServiceID } = req.body;
  try {
    await query(`DELETE FROM SpecialistService WHERE SpecID=? AND ServiceID=?`, [SpecialistID, ServiceID]);
    res.json({ success: true, message: 'Связь удалена' });
  } catch (err) { res.status(500).json({ success: false }); }
});

// PUT /api/specialistServices/update
router.put('/specialistServices/update', async (req, res) => {
  const { oldSpecialistID, oldServiceID, newSpecialistID, newServiceID } = req.body;
  try {
    await query(`DELETE FROM SpecialistService WHERE SpecID=? AND ServiceID=?`, [oldSpecialistID, oldServiceID]);
    await query(`INSERT INTO SpecialistService (SpecID, ServiceID) VALUES (?,?)`, [newSpecialistID, newServiceID]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Ошибка обновления' }); }
});

module.exports = router;
