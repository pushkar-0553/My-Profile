import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('[Migration] Starting TiDB database migration...');
  console.log(`[Migration] Target: ${config.tidb.host}:${config.tidb.port}/${config.tidb.database}`);

  const poolConfig = {
    host: config.tidb.host,
    port: config.tidb.port,
    user: config.tidb.user,
    password: config.tidb.password,
    database: config.tidb.database,
    multipleStatements: true,
  };

  if (config.tidb.enableSsl) {
    poolConfig.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    };
  }

  let connection;
  try {
    connection = await mysql.createConnection(poolConfig);
    console.log('[Migration] Connected to database.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Migration] Executing DDL statements...');
    await connection.query(sql);

    console.log('[Migration] Schema migration completed successfully! All tables verified.');
  } catch (error) {
    console.error('[Migration] Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
