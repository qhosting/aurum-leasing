
import express from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:57c52e388e393eb0b74f@qhosting_aurum-leasing-db:5432/aurum-leasing-db?sslmode=disable',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const redis = new Redis(process.env.REDIS_URL || 'redis://default:5faf81de3571e8b7146c@qhosting_redis:6379');

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://esm.sh"],
      "connect-src": ["'self'", "https://esm.sh", "https://*.google.com"],
      "img-src": ["'self'", "data:", "https://*", "blob:"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
    }
  }
}));

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * AURUM MIGRATION ENGINE
 * Gestiona el esquema de base de datos de forma incremental y segura.
 */
const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('--- AURUM DATABASE MIGRATION SYSTEM STARTING ---');
    await client.query('BEGIN');

    // 1. Log de Migraciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_log (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Esquema Base: Tenants y Planes (Requeridos para FKs)
    console.log('📦 Migrando esquema base (Tenants/Plans)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS service_plans (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Usuarios (Auth)
    console.log('👥 Migrando esquema de usuarios...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL;
    `);

    // 4. Operaciones (Flota y Conductores)
    console.log('🚗 Migrando esquema de flota y conductores...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        plate TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;

      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
    `);

    // 5. Finanzas y Legal
    console.log('💰 Migrando esquema financiero...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        amount DECIMAL(12,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        driver_id TEXT REFERENCES drivers(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        expiry_date DATE,
        status TEXT DEFAULT 'valid',
        file_url TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Auxilio Vial e Incidencias
    console.log('🚨 Migrando esquema de incidencias...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        location JSONB,
        description TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS driver_id TEXT REFERENCES drivers(id) ON DELETE CASCADE;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE;
    `);

    // --- SEEDING DE SEGURIDAD (ROOT ACCESS) ---
    console.log('🌱 Ejecutando seeding de seguridad Aurum...');

    // Super Admin Seeding - Garantiza acceso al sistema
    await client.query(`
      INSERT INTO users (id, email, password, role, data) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET 
        password = EXCLUDED.password, 
        role = EXCLUDED.role,
        data = EXCLUDED.data`, 
      ['root-admin', 'root@aurumleasing.mx', 'x0420EZS*', 'Super Admin', { name: 'Aurum Global Controller' }]
    );

    // Planes Iniciales
    await client.query(`
      INSERT INTO service_plans (id, name, data) VALUES 
      ('p1', 'Basic', '{"price": 199, "fleet_limit": 15}'),
      ('p2', 'Pro', '{"price": 499, "fleet_limit": 100}'),
      ('p3', 'Enterprise', '{"price": 1299, "fleet_limit": 10000}')
      ON CONFLICT (name) DO NOTHING
    `);

    // Tenant CDMX de ejemplo
    await client.query(`
      INSERT INTO tenants (id, company_name, data) 
      VALUES ('t1', 'Aurum Leasing CDMX', '{"plan": "Enterprise", "region": "Central"}')
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Aurum Database System Synchronized & Seeded.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ CRITICAL MIGRATION ERROR:', err);
    (process as any).exit(1);
  } finally {
    client.release();
  }
};

// --- ENDPOINTS API ---

app.get('/api/fleet', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({ id: r.id, plate: r.plate, ...r.data })));
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM drivers ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({ id: r.id, email: r.email, ...r.data })));
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.get('/api/payments/pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, d.data->>'name' as driver_name 
      FROM payments p 
      JOIN drivers d ON p.driver_id = d.id 
      WHERE p.status = 'pending'
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.get('/api/stats/visits', async (req, res) => {
  try {
    const visits = await redis.incr('global_visits');
    res.json({ visits });
  } catch (err) { res.json({ visits: 1024 }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

initDb().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Aurum Enterprise Server running on port ${port}`);
  });
});
