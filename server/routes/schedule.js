const express = require('express');
const router = express.Router();
const { query } = require('../db');

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}
function toSqlWeekday(day) {
  return day === 6 ? 1 : day + 2;
}
const toTimeStr = (val) => {
  if (!val) return '00:00';
  const s = typeof val === 'string' ? val : JSON.stringify(val).replace(/"/g, '');
  if (s.includes('T')) return s.split('T')[1].substring(0, 5);
  return s.substring(0, 5);
};

// GET /api/slots
router.get('/slots', async (req, res) => {
  const { specialistId, serviceId, date } = req.query;
  if (!specialistId || !serviceId || !date)
    return res.status(400).json({ success: false, message: 'specialistId, serviceId, date обязательны' });
  try {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    const whRows = await query(
      `SELECT StartTime, EndTime, IsWorkingDay FROM WorkingHours WHERE SpecialistID=? AND DayOfWeek=?`,
      [specialistId, dayOfWeek]
    );
    if (!whRows || whRows.length === 0 || !whRows[0].IsWorkingDay)
      return res.json({ success: true, slots: [], reason: 'Выходной день или нет расписания' });

    const wh = whRows[0];
    if (!wh.StartTime || !wh.EndTime)
      return res.json({ success: true, slots: [], reason: 'Время работы не задано' });

    const startStr = toTimeStr(wh.StartTime);
    const endStr   = toTimeStr(wh.EndTime);

    const breakRows = await query(
      `SELECT BreakStart, BreakEnd FROM BreakSlots WHERE SpecID=? AND DayOfWeek=?`,
      [specialistId, dayOfWeek]
    );
    const breaks = (breakRows || []).map(b => ({
      start: timeToMinutes(toTimeStr(b.BreakStart)),
      end:   timeToMinutes(toTimeStr(b.BreakEnd)),
    }));

    const svcRows = await query(`SELECT DurationMinutes FROM MainServices WHERE ServiceID=?`, [serviceId]);
    if (!svcRows || svcRows.length === 0)
      return res.status(404).json({ success: false, message: 'Процедура не найдена' });
    const duration = svcRows[0].DurationMinutes || 60;

    const bookedRows = await query(
      `SELECT r.ReservTime, ms.DurationMinutes
       FROM Reservations r JOIN MainServices ms ON r.ServiceID=ms.ServiceID
       WHERE r.SpecialistID=? AND r.ReservDate=? AND r.StatusID NOT IN (1,2)`,
      [specialistId, date]
    );
    const booked = (bookedRows || []).map(b => ({
      start: timeToMinutes(toTimeStr(b.ReservTime)),
      end:   timeToMinutes(toTimeStr(b.ReservTime)) + (b.DurationMinutes || 60),
    }));

    const slots = [];
    let current = timeToMinutes(startStr);
    const workEnd = timeToMinutes(endStr);
    const today = new Date();
    const isToday = date === today.toISOString().split('T')[0];
    const nowMinutes = isToday ? today.getHours() * 60 + today.getMinutes() : 0;

    while (current + duration <= workEnd) {
      const slotEnd = current + duration;
      const inBreak  = breaks.some(b => current < b.end && slotEnd > b.start);
      const isBooked = booked.some(b => current < b.end && slotEnd > b.start);
      const isPast   = isToday && current <= nowMinutes;
      if (!inBreak && !isBooked && !isPast) slots.push(minutesToTime(current));
      current += duration;
    }
    res.json({ success: true, slots });
  } catch (err) {
    console.error('[GET /api/slots]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/schedule/working-hours/:specialistId
router.get('/schedule/working-hours/:specialistId', async (req, res) => {
  try {
    const wh = await query(
      `SELECT DayOfWeek, StartTime, EndTime, IsWorkingDay FROM WorkingHours WHERE SpecialistID=? ORDER BY DayOfWeek`,
      [req.params.specialistId]
    );
    const br = await query(
      `SELECT DayOfWeek, BreakStart, BreakEnd FROM BreakSlots WHERE SpecID=? ORDER BY DayOfWeek, BreakStart`,
      [req.params.specialistId]
    );
    res.json({ workingHours: wh, breakSlots: br });
  } catch (err) { res.status(500).json({ workingHours: [], breakSlots: [] }); }
});

// PUT /api/schedule/working-hours
router.put('/schedule/working-hours', async (req, res) => {
  const { specialistId, workingHours, breakSlots } = req.body;
  try {
    const conflicts = [];
    for (const wh of workingHours) {
      const startTime = wh.isWorkingDay && wh.startTime ? wh.startTime.substring(0,5) : null;
      const endTime   = wh.isWorkingDay && wh.endTime   ? wh.endTime.substring(0,5)   : null;
      const bookedRows = await query(
        `SELECT r.ReservID, r.UserID, CONVERT(NVARCHAR, r.ReservDate, 23) AS ReservDate,
                CONVERT(NVARCHAR, r.ReservTime, 108) AS ReservTime,
                u.LastName + ' ' + u.FirstName AS ClientName,
                ms.ServiceName, ms.DurationMinutes
         FROM Reservations r
         JOIN Users u ON r.UserID=u.UserID
         JOIN MainServices ms ON r.ServiceID=ms.ServiceID
         WHERE r.SpecialistID=? AND r.ReservDate >= CAST(GETDATE() AS DATE)
           AND DATEPART(WEEKDAY, r.ReservDate) = ? AND r.StatusID NOT IN (1,2)`,
        [specialistId, toSqlWeekday(wh.dayOfWeek)]
      );
      for (const booking of (bookedRows || [])) {
        const bookTimeStr = booking.ReservTime instanceof Date
          ? `${String(booking.ReservTime.getUTCHours()).padStart(2,'0')}:${String(booking.ReservTime.getUTCMinutes()).padStart(2,'0')}`
          : String(booking.ReservTime).substring(0, 5);
        const bookTime = timeToMinutes(bookTimeStr);
        const bookEnd  = bookTime + (booking.DurationMinutes || 60);
        let isConflict = false;
        if (!wh.isWorkingDay) {
          isConflict = true;
        } else {
          const newStart = timeToMinutes(startTime);
          const newEnd   = timeToMinutes(endTime);
          if (bookTime < newStart || bookEnd > newEnd) isConflict = true;
          const dayBreaks = (breakSlots || []).filter(b => b.dayOfWeek === wh.dayOfWeek);
          for (const br of dayBreaks) {
            const brStart = timeToMinutes(br.breakStart.substring(0,5));
            const brEnd   = timeToMinutes(br.breakEnd.substring(0,5));
            if (bookTime < brEnd && bookEnd > brStart) { isConflict = true; break; }
          }
        }
        if (isConflict) conflicts.push({ ReservID: booking.ReservID, ClientName: booking.ClientName, ReservDate: booking.ReservDate, ReservTime: booking.ReservTime, ServiceName: booking.ServiceName });
      }
    }
    for (const wh of workingHours) {
      const isWorking = wh.isWorkingDay ? 1 : 0;
      const startVal = wh.isWorkingDay && wh.startTime ? `'${wh.startTime.substring(0,5)}:00'` : 'NULL';
      const endVal   = wh.isWorkingDay && wh.endTime   ? `'${wh.endTime.substring(0,5)}:00'`   : 'NULL';
      const exists = await query(`SELECT WorkHID FROM WorkingHours WHERE SpecialistID=? AND DayOfWeek=?`, [specialistId, wh.dayOfWeek]);
      if (exists && exists.length > 0) {
        await query(`UPDATE WorkingHours SET StartTime=${startVal}, EndTime=${endVal}, IsWorkingDay=? WHERE SpecialistID=? AND DayOfWeek=?`, [isWorking, specialistId, wh.dayOfWeek]);
      } else {
        await query(`INSERT INTO WorkingHours (SpecialistID, DayOfWeek, StartTime, EndTime, IsWorkingDay) VALUES (?, ?, ${startVal}, ${endVal}, ?)`, [specialistId, wh.dayOfWeek, isWorking]);
      }
    }
    await query(`DELETE FROM BreakSlots WHERE SpecID=?`, [specialistId]);
    for (const b of (breakSlots || [])) {
      if (!b.breakStart || !b.breakEnd) continue;
      const bs = `'${b.breakStart.substring(0,5)}:00'`;
      const be = `'${b.breakEnd.substring(0,5)}:00'`;
      await query(`INSERT INTO BreakSlots (SpecID, DayOfWeek, BreakStart, BreakEnd) VALUES (?, ?, ${bs}, ${be})`, [specialistId, b.dayOfWeek]);
    }
    res.json({ success: true, conflicts });
  } catch (err) {
    console.error('[PUT /api/schedule/working-hours]', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
