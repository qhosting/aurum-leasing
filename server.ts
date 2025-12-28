
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

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        tenant_id TEXT REFERENCES tenants(id),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        plate TEXT UNIQUE NOT NULL,
        tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
        driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
        driver_id TEXT REFERENCES drivers(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed data con campos extendidos para el Arrendatario
    await client.query(`
      INSERT INTO tenants (id, company_name, data) 
      VALUES ('t1', 'Aurum Leasing CDMX', '{"plan": "Enterprise"}') 
      ON CONFLICT DO NOTHING;

      INSERT INTO drivers (id, email, tenant_id, data) 
      VALUES ('d1', 'juan.perez@aurum.mx', 't1', '{
        "name": "Juan Pérez", 
        "phone": "5215512345678", 
        "address": "Av. Reforma 222, CDMX",
        "emergencyName": "Marta Pérez",
        "emergencyPhone": "5511223344",
        "emergencyRel": "Esposa",
        "rentPlan": "semanal", 
        "amortization": {"totalValue": 250000, "paidPrincipal": 18500}
      }') 
      ON CONFLICT DO NOTHING;

      INSERT INTO users (id, email, password, role, tenant_id, data) 
      VALUES ('u1', 'juan.perez@aurum.mx', 'aurum2024', 'Arrendatario', 't1', '{"driver_id": "d1"}') 
      ON CONFLICT DO NOTHING;
      
      INSERT INTO vehicles (id, plate, tenant_id, driver_id, data) 
      VALUES ('v1', 'ABC-1234', 't1', 'd1', '{"brand": "Toyota", "model": "Avanza", "year": 2022, "status": "Activo", "verificationExpiry": "2024-12-31"}') 
      ON CONFLICT DO NOTHING;

      INSERT INTO payments (id, tenant_id, driver_id, amount, status, data)
      VALUES ('p-seed-1', 't1', 'd1', 3500.00, 'verified', '{"type": "renta", "date": "2024-05-10"}')
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB INIT ERROR:', err);
  } finally {
    client.release();
  }
};

// Endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const r = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
  if (r.rows.length > 0) {
    await redis.incr('global_visits');
    res.json({ success: true, user: r.rows[0] });
  } else {
    res.status(401).json({ success: false, error: 'Credenciales inválidas' });
  }
});

app.get('/api/driver/me', async (req, res) => {
  const driverId = req.query.id || 'd1';
  try {
    const driver = await pool.query('SELECT * FROM drivers WHERE id = $1', [driverId]);
    const payments = await pool.query('SELECT SUM(amount) as balance FROM payments WHERE driver_id = $1 AND status = \'verified\'', [driverId]);
    res.json({ ...driver.rows[0], balance: parseFloat(payments.rows[0].balance || '0') });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/driver/profile', async (req, res) => {
  const { id, data } = req.body;
  try {
    await pool.query(
      'UPDATE drivers SET data = data || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(data), id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/driver/vehicle', async (req, res) => {
  const driverId = req.query.id || 'd1';
  const r = await pool.query('SELECT * FROM vehicles WHERE driver_id = $1', [driverId]);
  res.json(r.rows[0] ? { id: r.rows[0].id, plate: r.rows[0].plate, ...r.rows[0].data } : null);
});

app.get('/api/driver/payments', async (req, res) => {
  const driverId = req.query.id || 'd1';
  const r = await pool.query('SELECT * FROM payments WHERE driver_id = $1 ORDER BY created_at DESC', [driverId]);
  res.json(r.rows.map(p => ({ id: p.id, amount: p.amount, date: p.created_at, status: p.status, ...p.data })));
});

app.post('/api/payments/report', async (req, res) => {
  const { driver_id, tenant_id, amount, ...data } = req.body;
  const id = `p-${Date.now()}`;
  try {
    await pool.query('INSERT INTO payments (id, driver_id, tenant_id, amount, status, data) VALUES ($1, $2, $3, $4, $5, $6)', 
      [id, driver_id, tenant_id, amount, 'pending', data]);
    res.json({ success: true, id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/visits', async (req, res) => {
  const visits = await redis.get('global_visits');
  res.json({ visits: parseInt(visits || '0') });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDb().then(() => app.listen(port, () => console.log(`🚀 Aurum Cloud Active on ${port}`)));
