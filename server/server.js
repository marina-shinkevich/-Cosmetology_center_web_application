const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Роутеры 
app.use('/',        require('./routes/auth'));
app.use('/api',     require('./routes/users'));
app.use('/api',     require('./routes/services'));
app.use('/api',     require('./routes/specialists'));
app.use('/api',     require('./routes/reservations'));
app.use('/api',     require('./routes/schedule'));
app.use('/api',     require('./routes/master'));
app.use('/api',     require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api',     require('./routes/ai'));


const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  await testConnection();
});
