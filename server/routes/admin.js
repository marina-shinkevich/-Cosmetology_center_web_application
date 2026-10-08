const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query, models } = require('../db');
const {
  User, Role, ServiceCategory, MainService, Medication,
  MainSpecialist, Reservation, MedicalRecord, PrescribeMedication, Review,
} = models;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const rows = await query(
      `SELECT u.UserID, u.LastName, u.FirstName, u.Login, u.Phone, u.Email, u.PasswordHash, r.RoleName
       FROM Users u JOIN Roles r ON u.RoleID=r.RoleID WHERE u.IsActive=1 ORDER BY u.LastName, u.FirstName`
    );
    res.json({ success: true, users: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.put('/users/update', async (req, res) => {
  const { UserID, LastName, FirstName, Login, Phone, Email, PasswordHash } = req.body;
  try {
    await User.update({ LastName, FirstName, Login, Phone: Phone||null, Email: Email||null, PasswordHash }, { where: { UserID } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/users/delete/:id', async (req, res) => {
  try {
    await User.update({ IsActive: false }, { where: { UserID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── SPECIALISTS ──────────────────────────────────────────────────────────────

router.get('/specialists', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ms.SpecialistID, u.LastName, u.FirstName, u.Phone, u.Email,
              ms.Experience, ms.Education, ms.SpecDescription, ms.UserID
       FROM MainSpecialists ms JOIN Users u ON ms.UserID=u.UserID
       WHERE u.IsActive=1 ORDER BY u.LastName, u.FirstName`
    );
    res.json({ success: true, specialists: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/roles', async (req, res) => {
  try {
    const rows = await query(`SELECT RoleID, RoleName FROM Roles ORDER BY RoleID`);
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

router.post('/specialists/add', upload.single('photo'), async (req, res) => {
  const { LastName, FirstName, Login, Phone, Email, PasswordHash, Experience, SpecDescription, Education } = req.body;
  const photo = req.file ? req.file.buffer : null;
  try {
    const roleRows = await query(`SELECT RoleID FROM Roles WHERE RoleName IN ('Специалист', 'Мастер', 'Master', 'Specialist')`);
    if (!roleRows || roleRows.length === 0)
      return res.status(500).json({ success: false, message: 'Роль специалиста не найдена' });
    const roleId = roleRows[0].RoleID;
    await query(
      `INSERT INTO Users (LastName, FirstName, Login, PasswordHash, Phone, Email, RoleID, Photo, IsActive) VALUES (?,?,?,?,?,?,?,?,1)`,
      [LastName, FirstName, Login, PasswordHash||'changeme', Phone||null, Email||null, roleId, photo]
    );
    const userRows = await query(`SELECT UserID FROM Users WHERE Login=?`, [Login]);
    const userId = userRows[0].UserID;
    await query(`INSERT INTO MainSpecialists (UserID, Experience, SpecDescription, Education) VALUES (?,?,?,?)`, [userId, Experience||null, SpecDescription||null, Education||null]);
    const specRows = await query(`SELECT SpecialistID FROM MainSpecialists WHERE UserID=?`, [userId]);
    const specId = specRows[0].SpecialistID;
    const defaultSchedule = [
      { day: 0, working: 1 }, { day: 1, working: 1 }, { day: 2, working: 1 },
      { day: 3, working: 1 }, { day: 4, working: 1 },
      { day: 5, working: 0 }, { day: 6, working: 0 },
    ];
    for (const s of defaultSchedule) {
      const startVal = s.working ? `'09:00:00'` : 'NULL';
      const endVal   = s.working ? `'18:00:00'` : 'NULL';
      await query(`INSERT INTO WorkingHours (SpecialistID, DayOfWeek, StartTime, EndTime, IsWorkingDay) VALUES (?, ?, ${startVal}, ${endVal}, ?)`, [specId, s.day, s.working]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/specialists/update', async (req, res) => {
  const { SpecialistID, LastName, FirstName, Phone, Email, Experience, SpecDescription, Education } = req.body;
  try {
    await query(`UPDATE Users SET LastName=?, FirstName=?, Phone=?, Email=? WHERE UserID=(SELECT UserID FROM MainSpecialists WHERE SpecialistID=?)`, [LastName, FirstName, Phone||null, Email||null, SpecialistID]);
    await query(`UPDATE MainSpecialists SET Experience=?, SpecDescription=?, Education=? WHERE SpecialistID=?`, [Experience||null, SpecDescription||null, Education||null, SpecialistID]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/specialists/delete/:id', async (req, res) => {
  try {
    const spec = await MainSpecialist.findOne({ where: { SpecialistID: req.params.id } });
    if (spec) await User.update({ IsActive: false }, { where: { UserID: spec.UserID } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── SERVICES ─────────────────────────────────────────────────────────────────

router.get('/services', async (req, res) => {
  try {
    const rows = await query(`SELECT ServiceID, ServiceName, Description, Category, Price, DurationMinutes FROM MainServices ORDER BY ServiceName`);
    res.json({ success: true, services: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/services-list', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ms.ServiceID, ms.ServiceName, ms.Description, ms.CategoryID, sc.CategoryName, ms.Price, ms.DurationMinutes, ms.IsActive
       FROM MainServices ms LEFT JOIN ServiceCategories sc ON ms.CategoryID=sc.CategoryID ORDER BY ms.ServiceName`
    );
    res.json({ success: true, services: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/services/add', upload.single('photo'), async (req, res) => {
  const { ServiceName, Description, CategoryID, Price, DurationMinutes, Indications, Effect } = req.body;
  const photo = req.file ? req.file.buffer : null;
  try {
    await query(
      `INSERT INTO MainServices (ServiceName, Description, CategoryID, Price, DurationMinutes, Indications, Effect, Photo, IsActive) VALUES (?,?,?,?,?,?,?,?,1)`,
      [ServiceName, Description||null, CategoryID||null, Price||0, DurationMinutes||0, Indications||null, Effect||null, photo]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/services/update', async (req, res) => {
  const { ServiceID, ServiceName, Description, CategoryID, Price, DurationMinutes, Indications, Effect } = req.body;
  try {
    await query(`UPDATE MainServices SET ServiceName=?, Description=?, CategoryID=?, Price=?, DurationMinutes=?, Indications=?, Effect=? WHERE ServiceID=?`, [ServiceName, Description||null, CategoryID||null, Price||0, DurationMinutes||0, Indications||null, Effect||null, ServiceID]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/services/delete/:id', async (req, res) => {
  try {
    await MainService.update({ IsActive: false }, { where: { ServiceID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.put('/services/activate/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT ms.CategoryID, sc.IsActive AS CategoryActive FROM MainServices ms LEFT JOIN ServiceCategories sc ON ms.CategoryID=sc.CategoryID WHERE ms.ServiceID=?`, [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Процедура не найдена' });
    const svc = rows[0];
    if (!svc.CategoryID) return res.status(400).json({ success: false, message: 'Нельзя активировать процедуру без категории' });
    const catActive = svc.CategoryActive === true || svc.CategoryActive === 1;
    if (!catActive) return res.status(400).json({ success: false, message: 'Нельзя активировать процедуру с неактивной категорией' });
    await MainService.update({ IsActive: true }, { where: { ServiceID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try {
    const rows = await ServiceCategory.findAll({ order: [['CategoryName', 'ASC']] });
    res.json({ success: true, categories: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/categories/add', async (req, res) => {
  const { CategoryName } = req.body;
  try {
    await ServiceCategory.create({ CategoryName, IsActive: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/categories/update', async (req, res) => {
  const { CategoryID, CategoryName } = req.body;
  try {
    await ServiceCategory.update({ CategoryName }, { where: { CategoryID } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.put('/categories/deactivate/:id', async (req, res) => {
  try {
    await ServiceCategory.update({ IsActive: false }, { where: { CategoryID: req.params.id } });
    await MainService.update({ IsActive: false }, { where: { CategoryID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.put('/categories/activate/:id', async (req, res) => {
  try {
    await ServiceCategory.update({ IsActive: true }, { where: { CategoryID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── MEDICATIONS ──────────────────────────────────────────────────────────────

router.get('/medications', async (req, res) => {
  try {
    const rows = await Medication.findAll({ attributes: ['MedID', 'MedName', 'Description'], order: [['MedName', 'ASC']] });
    res.json({ success: true, medications: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/medications/add', upload.single('photo'), async (req, res) => {
  const { MedName, Description } = req.body;
  const photo = req.file ? req.file.buffer : null;
  try {
    await Medication.create({ MedName, Description: Description||null, Photo: photo });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/medications/update', async (req, res) => {
  const { MedID, MedName, Description } = req.body;
  try {
    await Medication.update({ MedName, Description: Description||null }, { where: { MedID } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/medications/delete/:id', async (req, res) => {
  try {
    await Medication.destroy({ where: { MedID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── PROCMED ──────────────────────────────────────────────────────────────────

router.get('/procmed', async (req, res) => {
  try {
    const rows = await query(
      `SELECT pm.ProcID, pm.MedID, ms.ServiceName, m.MedName
       FROM ProcedureMedications pm
       JOIN MainServices ms ON pm.ProcID=ms.ServiceID
       JOIN Medications m ON pm.MedID=m.MedID
       ORDER BY ms.ServiceName, m.MedName`
    );
    res.json({ success: true, relations: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/procmed/add', async (req, res) => {
  const { ProcID, MedID } = req.body;
  try {
    await query(`INSERT INTO ProcedureMedications (ProcID, MedID) VALUES (?,?)`, [ProcID, MedID]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Связь уже существует' }); }
});

router.post('/procmed/delete', async (req, res) => {
  const { ProcID, MedID } = req.body;
  try {
    await query(`DELETE FROM ProcedureMedications WHERE ProcID=? AND MedID=?`, [ProcID, MedID]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── SPECPROC ─────────────────────────────────────────────────────────────────

router.get('/specproc', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ss.SpecID AS SpecialistID, ss.ServiceID,
              u.LastName + ' ' + u.FirstName AS SpecialistName, ms.ServiceName
       FROM SpecialistService ss
       JOIN MainSpecialists sp ON ss.SpecID=sp.SpecialistID
       JOIN Users u ON sp.UserID=u.UserID
       JOIN MainServices ms ON ss.ServiceID=ms.ServiceID
       ORDER BY u.LastName, ms.ServiceName`
    );
    res.json({ success: true, relations: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/specproc/add', async (req, res) => {
  const { SpecialistID, ServiceID } = req.body;
  try {
    await query(`INSERT INTO SpecialistService (SpecID, ServiceID) VALUES (?,?)`, [SpecialistID, ServiceID]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: 'Связь уже существует или ошибка' }); }
});

router.post('/specproc/delete', async (req, res) => {
  const { SpecialistID, ServiceID } = req.body;
  try {
    await query(`DELETE FROM SpecialistService WHERE SpecID=? AND ServiceID=?`, [SpecialistID, ServiceID]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

router.get('/reservations', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 50;
  const offset = (page - 1) * pageSize;
  try {
    const countRows = await query(`SELECT COUNT(*) AS total FROM Reservations`);
    const total = countRows[0].total;
    const rows = await query(
      `SELECT r.ReservID,
              r.UserID, u.LastName + ' ' + u.FirstName AS UserName,
              r.SpecialistID, su.LastName + ' ' + su.FirstName AS SpecialistName,
              r.ServiceID, ms.ServiceName,
              CONVERT(NVARCHAR(10), r.ReservDate, 23) AS ReservDate,
              CONVERT(NVARCHAR(8), r.ReservTime, 108) AS ReservTime,
              r.StatusID, rs.StatusName
       FROM Reservations r
       JOIN Users u ON r.UserID=u.UserID
       JOIN MainSpecialists sp ON r.SpecialistID=sp.SpecialistID
       JOIN Users su ON sp.UserID=su.UserID
       JOIN MainServices ms ON r.ServiceID=ms.ServiceID
       JOIN ReservationStatuses rs ON r.StatusID=rs.StatusID
       ORDER BY r.ReservDate DESC, r.ReservTime DESC
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      [offset, pageSize]
    );
    res.json({ success: true, reservations: rows, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.put('/reservations/update', async (req, res) => {
  const { ReservID, UserID, SpecialistID, ServiceID, ReservDate, ReservTime, StatusID } = req.body;
  try {
    await query(
      `UPDATE Reservations SET UserID=?, SpecialistID=?, ServiceID=?, ReservDate=?, ReservTime=?, StatusID=? WHERE ReservID=?`,
      [UserID, SpecialistID, ServiceID, ReservDate, ReservTime, StatusID, ReservID]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/reservations/status/:id', async (req, res) => {
  const { statusId } = req.body;
  try {
    await Reservation.update({ StatusID: statusId }, { where: { ReservID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/reservations/delete/:id', async (req, res) => {
  try {
    // Полное удаление записи из базы данных
    await Reservation.destroy({ where: { ReservID: req.params.id } });
    res.json({ success: true, message: 'Запись полностью удалена из базы данных' });
  } catch (err) { 
    console.error('[DELETE /api/admin/reservations/delete/:id]', err.message);
    res.status(500).json({ success: false, message: 'Ошибка при удалении записи' }); 
  }
});

// ─── MEDICAL RECORDS ──────────────────────────────────────────────────────────

router.get('/medical-records', async (req, res) => {
  try {
    const rows = await query(
      `SELECT mr.RecID, mr.ClientID, mr.SpecialistID, mr.Recommendations,
              uc.LastName + ' ' + uc.FirstName AS ClientName,
              us.LastName + ' ' + us.FirstName AS SpecialistName
       FROM MedicalRecords mr
       JOIN Users uc ON mr.ClientID=uc.UserID
       JOIN Users us ON mr.SpecialistID=us.UserID
       ORDER BY mr.RecID DESC`
    );
    res.json({ success: true, records: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/medical-records/add', async (req, res) => {
  const { ClientID, SpecialistID, Recommendations } = req.body;
  try {
    await MedicalRecord.create({ ClientID, SpecialistID, Recommendations: Recommendations||null });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/medical-records/update', async (req, res) => {
  const { RecID, Recommendations } = req.body;
  try {
    await MedicalRecord.update({ Recommendations }, { where: { RecID } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/medical-records/delete/:id', async (req, res) => {
  try {
    await MedicalRecord.destroy({ where: { RecID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── PRESCRIPTIONS ────────────────────────────────────────────────────────────

router.get('/prescriptions', async (req, res) => {
  try {
    const rows = await query(
      `SELECT pm.PrescID, pm.MedicationName, pm.IntakeFrequency, pm.CourseDuration,
              CONVERT(NVARCHAR,pm.PrescribedDate,23) AS PrescribedDate, pm.Instructions, pm.IsActive,
              pm.ClientID, pm.SpecialistID,
              uc.LastName + ' ' + uc.FirstName AS ClientName,
              us.LastName + ' ' + us.FirstName AS SpecialistName
       FROM PrescribeMedications pm
       LEFT JOIN Users uc ON pm.ClientID=uc.UserID
       LEFT JOIN MainSpecialists msp ON pm.SpecialistID=msp.SpecialistID
       LEFT JOIN Users us ON msp.UserID=us.UserID
       ORDER BY pm.PrescribedDate DESC`
    );
    res.json({ success: true, prescriptions: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/prescriptions/add', async (req, res) => {
  const { MedicationName, IntakeFrequency, CourseDuration, Instructions, ClientID, SpecialistID } = req.body;
  try {
    await query(
      `INSERT INTO PrescribeMedications (MedicationName, IntakeFrequency, CourseDuration, Instructions, ClientID, SpecialistID, PrescribedDate, IsActive)
       VALUES (?,?,?,?,?,?,GETDATE(),1)`,
      [MedicationName, IntakeFrequency||null, CourseDuration||null, Instructions||null, ClientID||null, SpecialistID||null]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/prescriptions/update', async (req, res) => {
  const { PrescID, MedicationName, IntakeFrequency, CourseDuration, Instructions, IsActive } = req.body;
  try {
    await PrescribeMedication.update({ MedicationName, IntakeFrequency: IntakeFrequency||null, CourseDuration: CourseDuration||null, Instructions: Instructions||null, IsActive: IsActive ? true : false }, { where: { PrescID } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/prescriptions/delete/:id', async (req, res) => {
  try {
    await PrescribeMedication.update({ IsActive: false }, { where: { PrescID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

router.delete('/reviews/delete/:id', async (req, res) => {
  try {
    await Review.destroy({ where: { RevID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
