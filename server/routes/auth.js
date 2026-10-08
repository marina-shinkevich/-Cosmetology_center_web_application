const express = require('express');
const router = express.Router();
const { query, models } = require('../db');
const { User, Role } = models;

// POST /login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = await User.findOne({
      where: { Login: login, PasswordHash: password, IsActive: true },
      include: [{ model: Role, attributes: ['RoleName'] }],
    });
    if (!user) return res.json({ success: false, message: 'Неверный логин или пароль' });
    res.json({
      success: true,
      user: {
        UserID: user.UserID, FirstName: user.FirstName, LastName: user.LastName,
        Login: user.Login, Email: user.Email, Phone: user.Phone,
        Role: user.Role?.RoleName,
      },
    });
  } catch (err) {
    console.error('[POST /login]', err.message);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// POST /register
router.post('/register', async (req, res) => {
  const { firstName, lastName, login, email, phone, passwordHash } = req.body;
  try {
    await User.create({
      LastName: lastName, FirstName: firstName, Login: login,
      PasswordHash: passwordHash, Phone: phone || null, Email: email || null,
      RoleID: 1, IsActive: true,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /register]', err.message);
    res.status(500).json({ success: false, message: 'Ошибка регистрации. Возможно, логин уже занят.' });
  }
});

module.exports = router;
