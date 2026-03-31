const { Pool } = require('pg');
require('dotenv').config();

const useDatabaseUrl = !!process.env.DATABASE_URL;

const pool = new Pool(
    useDatabaseUrl
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false,
            },
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: Number(process.env.DB_PORT) || 5432,
        }
);

module.exports = pool;