const express = require('express');
const router = express.Router();
const { query, models } = require('../db');
const { Reservation } = models;

// GET /api/reservations
router.get('/reservations', async (req, res) => {
  const page     = parseInt(req.query.page)     || 1;
  const pageSize = parseInt(req.query.pageSize) || 50;
  const offset   = (page - 1) * pageSize;
  try {
    const countRows = await query(`SELECT COUNT(*) AS total FROM Reservations`);
    const total = countRows[0].total;
    const rows = await query(
      `SELECT r.ReservID, r.UserID, r.SpecialistID, r.ServiceID,
              CONVERT(NVARCHAR, r.ReservDate, 23) AS ReservDate,
              CONVERT(NVARCHAR, r.ReservTime, 108) AS ReservTime,
              rs.StatusName AS Status
       FROM Reservations r JOIN ReservationStatuses rs ON r.StatusID=rs.StatusID
       ORDER BY r.ReservDate DESC, r.ReservTime DESC
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      [offset, pageSize]
    );
    res.json({ success: true, reservations: rows, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error('[GET /api/reservations]', err.message);
    res.status(500).json({ success: false });
  }
});

// POST /api/reservations
router.post('/reservations', async (req, res) => {
  const { userId, serviceId, specialistId, date, time } = req.body;
  try {
    const now = new Date();
    const bookingDateTime = new Date(`${date}T${time}:00`);
    if (bookingDateTime <= now)
      return res.status(400).json({ success: false, message: 'Нельзя записаться на прошедшую дату и время' });
    await Reservation.create({ UserID: userId, SpecialistID: specialistId, ServiceID: serviceId, ReservDate: date, ReservTime: time, StatusID: 3 });
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/reservations]', err.message);
    res.status(500).json({ success: false, message: 'Ошибка создания записи' });
  }
});

// PUT /api/reservations/update
router.put('/reservations/update', async (req, res) => {
  const { updatedReservations } = req.body;
  const results = [];
  try {
    for (const r of updatedReservations) {
      await query(
        `UPDATE Reservations SET UserID=?, SpecialistID=?, ServiceID=?, ReservDate=?, ReservTime=? WHERE ReservID=?`,
        [r.UserID, r.SpecialistID, r.ServiceID, r.ReservDate, r.ReservTime, r.ReservID]
      );
      results.push({ ReservID: r.ReservID, success: true });
    }
    res.json({ success: true, results });
  } catch (err) { res.status(500).json({ success: false, results }); }
});

// DELETE /api/reservations/delete/:id
router.delete('/reservations/delete/:id', async (req, res) => {
  try {
    await Reservation.update({ StatusID: 1 }, { where: { ReservID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// PUT /api/reservations/cancel/:id
router.put('/reservations/cancel/:id', async (req, res) => {
  try {
    await Reservation.update({ StatusID: 1 }, { where: { ReservID: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// GET /api/userReservations/:userId
router.get('/userReservations/:userId', async (req, res) => {
  try {
    const rows = await query(
      `SELECT r.ReservID AS id, ms.ServiceName AS procedure_name,
              CONVERT(NVARCHAR, r.ReservDate, 23) AS appointment_date,
              CONVERT(NVARCHAR, r.ReservTime, 108) AS appointment_time,
              CAST(ms.Price AS NVARCHAR) + ' BYN' AS price,
              rs.StatusName AS status, rs.StatusID
       FROM Reservations r
       JOIN MainServices ms ON r.ServiceID=ms.ServiceID
       JOIN ReservationStatuses rs ON r.StatusID=rs.StatusID
       WHERE r.UserID=? AND (
         rs.StatusID IN (1, 2) OR  -- Отменена или Подтверждена - показываем все
         (rs.StatusID = 3 AND (r.ReservDate > CAST(GETDATE() AS DATE) OR 
                              (r.ReservDate = CAST(GETDATE() AS DATE) AND r.ReservTime > CONVERT(TIME, GETDATE())))
         )  -- Ожидает подтверждения, но только будущие
       )
       ORDER BY r.ReservDate DESC`,
      [req.params.userId]
    );
    // Убираем StatusID из результата, чтобы не ломать интерфейс
    const result = rows.map(row => {
      const { StatusID, ...rest } = row;
      return rest;
    });
    res.json(result);
  } catch (err) { 
    console.error('[GET /api/userReservations/:userId]', err.message);
    res.status(500).json([]); 
  }
});

// GET /api/reservation-statuses
router.get('/reservation-statuses', async (req, res) => {
  try {
    const rows = await query(`SELECT StatusID, StatusName FROM ReservationStatuses ORDER BY StatusID`);
    res.json(rows);
  } catch (err) { res.status(500).json([]); }
});

module.exports = router;
