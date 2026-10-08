const express = require('express');
const router = express.Router();
const { models } = require('../db');
const { User, Profile } = models;

// GET /api/clients/active
router.get('/clients/active', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { RoleID: 1, IsActive: true },
      attributes: ['UserID', 'FirstName', 'LastName', 'Login', 'Phone', 'Email', 'PasswordHash'],
      order: [['LastName', 'ASC'], ['FirstName', 'ASC']],
    });
    res.json({ success: true, clients: users });
  } catch (err) {
    console.error('[GET /api/clients/active]', err.message);
    res.status(500).json({ success: false });
  }
});

// GET /api/user/:login
router.get('/user/:login', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { Login: req.params.login },
      attributes: ['UserID', 'FirstName', 'LastName', 'Login', 'Phone', 'Email', 'PasswordHash', 'Photo'],
    });
    if (!user) return res.status(404).json({ message: 'Не найден' });
    const plain = user.toJSON();
    if (plain.Photo) {
      plain.PhotoBase64 = `data:image/jpeg;base64,${Buffer.from(plain.Photo).toString('base64')}`;
      delete plain.Photo;
    }
    res.json(plain);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /api/user/update
router.put('/user/update', async (req, res) => {
  const { UserID, FirstName, LastName, Login, Phone, Email, PasswordHash } = req.body;
  try {
    await User.update(
      { FirstName, LastName, Login, Phone: Phone || null, Email: Email || null, PasswordHash },
      { where: { UserID } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// PUT /api/users/update-all
router.put('/users/update-all', async (req, res) => {
  const { updatedUsers } = req.body;
  try {
    for (const u of updatedUsers) {
      await User.update(
        { FirstName: u.FirstName, LastName: u.LastName, Login: u.Login, Phone: u.Phone || null, Email: u.Email || null, PasswordHash: u.PasswordHash },
        { where: { UserID: u.UserID } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// DELETE /api/users/delete/:id
router.delete('/users/delete/:id', async (req, res) => {
  try {
    await User.update({ IsActive: false }, { where: { UserID: req.params.id } });
    res.json({ success: true, message: 'Пользователь деактивирован' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// DELETE /api/users/deactivate-self/:id  — клиент удаляет свой аккаунт
router.delete('/users/deactivate-self/:id', async (req, res) => {
  try {
    await User.update({ IsActive: false }, { where: { UserID: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// GET /api/medical-card/:userId
router.get('/medical-card/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { UserID: req.params.userId } });
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /api/medical-card
router.put('/medical-card', async (req, res) => {
  const { UserID, BirthDate, Gender, Allergies, ChronicDiseases, Medications } = req.body;
  try {
    const [profile, created] = await Profile.findOrCreate({
      where: { UserID },
      defaults: { UserID, BirthDate: BirthDate || null, Gender: Gender || null, Allergies: Allergies || null, ChronicDiseases: ChronicDiseases || null, Medications: Medications || null },
    });
    if (!created) {
      await profile.update({ BirthDate: BirthDate || null, Gender: Gender || null, Allergies: Allergies || null, ChronicDiseases: ChronicDiseases || null, Medications: Medications || null });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
