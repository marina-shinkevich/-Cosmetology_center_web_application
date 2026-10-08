const express = require('express');
const router = express.Router();
const { query, models } = require('../db');
const { MedicalRecord, PrescribeMedication } = models;

// GET /api/master/:specialistId/clients
router.get('/master/:specialistId/clients', async (req, res) => {
  try {
    const rows = await query(
      `SELECT DISTINCT u.UserID, u.FirstName, u.LastName, u.Phone, u.Email,
              CASE WHEN u.Photo IS NOT NULL THEN 1 ELSE 0 END AS hasPhoto
       FROM Users u
       JOIN Reservations r ON u.UserID=r.UserID
       WHERE r.SpecialistID=? AND u.IsActive=1
       ORDER BY u.LastName, u.FirstName`,
      [req.params.specialistId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/master/client/:clientId
router.get('/master/client/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const { specialistId } = req.query;
  try {
    const profile = await query(`SELECT * FROM Profiles WHERE UserID=?`, [clientId]);
    const recs = await query(
      `SELECT mr.RecID, mr.Recommendations, mr.SpecialistID,
              u.LastName + ' ' + u.FirstName AS SpecialistName
       FROM MedicalRecords mr
       JOIN Users u ON mr.SpecialistID=u.UserID
       WHERE mr.ClientID=? ORDER BY mr.RecID DESC`,
      [clientId]
    );
    const procedures = await query(
      `SELECT r.ReservID, ms.ServiceName, ms.DurationMinutes,
              CONVERT(NVARCHAR(10), r.ReservDate, 23) AS ReservDate,
              CONVERT(NVARCHAR(8), r.ReservTime, 108) AS ReservTime,
              rs.StatusName
       FROM Reservations r
       JOIN MainServices ms ON r.ServiceID=ms.ServiceID
       JOIN ReservationStatuses rs ON r.StatusID=rs.StatusID
       WHERE r.UserID=? AND r.SpecialistID=?
       ORDER BY r.ReservDate DESC, r.ReservTime DESC`,
      [clientId, specialistId || 0]
    );
    const drugs = await query(
      `SELECT pm.PrescID, pm.MedicationName, pm.IntakeFrequency, pm.CourseDuration,
              CONVERT(NVARCHAR(10), pm.PrescribedDate, 23) AS PrescribedDate,
              pm.Instructions, pm.IsActive,
              u.LastName + ' ' + u.FirstName AS SpecialistName
       FROM PrescribeMedications pm
       LEFT JOIN MainSpecialists ms ON pm.SpecialistID=ms.SpecialistID
       LEFT JOIN Users u ON ms.UserID=u.UserID
       WHERE pm.ClientID=? AND pm.IsActive=1
       ORDER BY pm.PrescribedDate DESC`,
      [clientId]
    );
    res.json({ profile: profile[0] || null, recommendations: recs || [], procedures: procedures || [], prescriptions: drugs || [] });
  } catch (err) {
    console.error('[GET /api/master/client]', err.message);
    res.status(500).json({ profile: null, recommendations: [], procedures: [], prescriptions: [] });
  }
});

// GET /api/master/:specialistId/schedule
router.get('/master/:specialistId/schedule', async (req, res) => {
  const { specialistId } = req.params;
  const { from, to } = req.query;
  try {
    // Сначала проверим, какие статусы вообще есть в системе
    const statusCheck = await query(
      `SELECT StatusID, StatusName FROM ReservationStatuses ORDER BY StatusID`
    );
    console.log('[DEBUG] Available statuses:', statusCheck);
    
    const rows = await query(
      `SELECT r.ReservID, r.UserID, r.StatusID,
              u.LastName + ' ' + u.FirstName AS ClientName, u.Phone AS ClientPhone,
              ms.ServiceName,
              CONVERT(NVARCHAR(10), r.ReservDate, 23) AS ReservDate,
              CONVERT(NVARCHAR(8), r.ReservTime, 108) AS ReservTime,
              rs.StatusName AS Status
       FROM Reservations r
       JOIN Users u ON r.UserID=u.UserID
       JOIN MainServices ms ON r.ServiceID=ms.ServiceID
       JOIN ReservationStatuses rs ON r.StatusID=rs.StatusID
       WHERE r.SpecialistID=? AND r.ReservDate >= ? AND r.ReservDate <= ? 
             AND r.StatusID!=1  -- Исключаем отмененные и другие неактивные статусы
       ORDER BY r.ReservDate, r.ReservTime`,
      [specialistId, from || '2000-01-01', to || '2099-12-31']
    );
    
    console.log(`[DEBUG] Found ${rows.length} records for specialist ${specialistId} from ${from} to ${to}`);
    
    // Логируем все записи с их статусами для отладки
    rows.forEach((row, index) => {
      console.log(`[DEBUG] Record ${index + 1}: ID=${row.ReservID}, Date=${row.ReservDate}, Status="${row.Status}", StatusID=${row.StatusID}`);
    });
    
    res.json(rows);
  } catch (err) { 
    console.error('[GET /api/master/:specialistId/schedule]', err.message);
    res.status(500).json([]); 
  }
});

// GET /api/master/recommendations/:userId (для ProfilePage)
router.get('/master/recommendations/:userId', async (req, res) => {
  try {
    const rows = await query(
      `SELECT mr.Recommendations FROM MedicalRecords mr WHERE mr.ClientID=? ORDER BY mr.RecID DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// POST /api/master/recommendations
router.post('/master/recommendations', async (req, res) => {
  const { clientId, specialistId, text } = req.body;
  try {
    await MedicalRecord.create({ ClientID: clientId, SpecialistID: specialistId, Recommendations: text });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// PUT /api/master/recommendations/:id
router.put('/master/recommendations/:id', async (req, res) => {
  const { text } = req.body;
  try {
    await MedicalRecord.update({ Recommendations: text }, { where: { RecID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// DELETE /api/master/recommendations/:id
router.delete('/master/recommendations/:id', async (req, res) => {
  try {
    await MedicalRecord.destroy({ where: { RecID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// POST /api/master/prescriptions
router.post('/master/prescriptions', async (req, res) => {
  const { drugName, frequency, duration, instructions, clientId, specialistId } = req.body;
  try {
    await query(
      `INSERT INTO PrescribeMedications (MedicationName, IntakeFrequency, CourseDuration, Instructions, ClientID, SpecialistID, PrescribedDate, IsActive)
       VALUES (?,?,?,?,?,?,GETDATE(),1)`,
      [drugName, frequency || null, duration || null, instructions || null, clientId || null, specialistId || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /master/prescriptions]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/master/prescribed-drugs/:clientId
router.get('/master/prescribed-drugs/:clientId', async (req, res) => {
  try {
    const rows = await query(
      `SELECT pm.PrescID AS id, pm.MedicationName AS drugName, pm.IntakeFrequency AS frequency,
              pm.CourseDuration AS duration, pm.PrescribedDate AS prescribedAt, pm.Instructions AS instructions,
              u.LastName + ' ' + u.FirstName AS specialistName
       FROM PrescribeMedications pm
       LEFT JOIN MainSpecialists ms ON pm.SpecialistID=ms.SpecialistID
       LEFT JOIN Users u ON ms.UserID=u.UserID
       WHERE pm.ClientID=? AND pm.IsActive=1 ORDER BY pm.PrescribedDate DESC`,
      [req.params.clientId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// GET /api/master/drug-references
router.get('/master/drug-references', async (req, res) => {
  try {
    const rows = await query(`SELECT MedID AS id, MedName AS name, Description FROM Medications ORDER BY MedName`);
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

// PUT /api/master/prescriptions/:id
router.put('/master/prescriptions/:id', async (req, res) => {
  const { drugName, frequency, duration, instructions } = req.body;
  try {
    await query(
      `UPDATE PrescribeMedications 
       SET MedicationName=?, IntakeFrequency=?, CourseDuration=?, Instructions=?
       WHERE PrescID=?`,
      [drugName, frequency || null, duration || null, instructions || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[PUT /master/prescriptions/:id]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/master/prescriptions/:id
router.delete('/master/prescriptions/:id', async (req, res) => {
  try {
    // Вместо удаления помечаем как неактивный (soft delete)
    await query(`UPDATE PrescribeMedications SET IsActive=0 WHERE PrescID=?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /master/prescriptions/:id]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/user/prescriptions/:userId
router.get('/user/prescriptions/:userId', async (req, res) => {
  try {
    const rows = await query(
      `SELECT pm.PrescID AS id, pm.MedicationName AS drugName, pm.IntakeFrequency AS frequency,
              pm.CourseDuration AS duration, CONVERT(NVARCHAR(10), pm.PrescribedDate, 23) AS prescribedAt,
              pm.Instructions AS instructions, u.LastName + ' ' + u.FirstName AS specialistName
       FROM PrescribeMedications pm
       LEFT JOIN MainSpecialists ms ON pm.SpecialistID=ms.SpecialistID
       LEFT JOIN Users u ON ms.UserID=u.UserID
       WHERE pm.ClientID=? AND pm.IsActive=1
       ORDER BY pm.PrescribedDate DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /user/prescriptions/:userId]', err.message);
    res.status(500).json([]);
  }
});

module.exports = router;
