// config/sequelize-config.cjs
/* eslint-disable */
const path = require('path');

/* ────────── 1. Selección dinámica del .env ────────── */
const envFile = '.env';
require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });

/* ────────── 2. Config común ────────── */
const common = {
  username : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME,
  host     : process.env.DB_HOST,
  port     : process.env.DB_PORT || 3306,
  dialect  : 'mysql',

  /* Storage interno de Sequelize-CLI */
  migrationStorage : 'sequelize',
  seederStorage    : 'sequelize',

  /* Rutas */
  migrations: {
    path   : path.resolve(__dirname, '../src/migrations'),
    pattern: /\.js$/,
  },
  seeders: {
    path   : path.resolve(__dirname, '../src/seeders'),
    pattern: /\.js$/,
  },
};

module.exports = {
  development: { ...common },
  production : { ...common },
};
