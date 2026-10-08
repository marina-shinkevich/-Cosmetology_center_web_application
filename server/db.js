const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const server   = process.env.DB_SERVER;
const database = process.env.DB_NAME;
const user     = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

if (!server || !database) {
  console.error('[DB] .env не загружен! DB_SERVER и DB_NAME обязательны.');
  process.exit(1);
}

// ─── Sequelize + tedious (mssql dialect, SQL Server Authentication) ───────────
const sequelize = new Sequelize(database, user, password, {
  host: server.includes('\\') ? server.split('\\')[0] : server,
  dialect: 'mssql',
  dialectOptions: {
    authentication: {
      type: 'default',
      options: {
        userName: user,
        password: password,
      },
    },
    options: {
      instanceName: server.includes('\\') ? server.split('\\')[1] : undefined,
      trustServerCertificate: true,
      encrypt: false,
    },
  },
  logging: false,
});

// ─── Модели 
const models = require('./models')(sequelize);

// ─── Обёртка query() для сырых SQL-запросов (используется в сложных JOIN) ────
async function query(sql, params = []) {
  let i = 0;
  const replacements = {};
  const namedSql = sql.replace(/\?/g, () => {
    const key = `p${i}`;
    replacements[key] = params[i];
    i++;
    return `:${key}`;
  });

  const [rows] = await sequelize.query(namedSql, {
    replacements,
    type: sequelize.QueryTypes.RAW,
  });
  if (Array.isArray(rows)) return rows;
  return rows;
}

// ─── Проверка подключения при старте 
async function testConnection() {
  console.log(`[DB] Connecting to "${database}" on "${server}" via Sequelize...`);
  try {
    await sequelize.authenticate();
    console.log(`[DB]  Connected to ${database} on ${server}`);
  } catch (err) {
    console.error('[DB]  Database connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, models, query, testConnection };
