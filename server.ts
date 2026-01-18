import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import migrate from 'node-pg-migrate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 80;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:57c52e388e393eb0b74f@qhosting_aurum-leasing-db:5432/aurum-leasing-db?sslmode=disable';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const redis = new Redis('redis://default:5faf81de3571e8b7146c@qhosting_redis:6379');

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://esm.sh"],
      "connect-src": ["'self'", "https://esm.sh", "https://*.google.com"],
      "img-src": ["'self'", "data:", "https://*", "blobBase64:"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
    }
  }
}) as any);

app.use(compression() as any);
app.use(cors() as any);
app.use(express.json() as any);
app.use(express.static(path.join(__dirname, 'dist')) as any);

const runMigrations = async () => {
  console.log('📦 Aurum System: Sincronizando Esquema Maestro via node-pg-migrate...');
  try {
    // node-pg-migrate requires a direction and the directory containing migration files
    await (migrate as any).default({
      databaseUrl: DATABASE_URL,
      dir: path.join(__dirname, 'migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
      verbose: true
    });
    console.log('✅ Aurum System: DB Sincronizada con éxito.');
  } catch (err: any) {
    console.error('❌ Aurum System Migration Error:', err.message);
    // In production, you might want to exit if migrations fail
    // Fix: cast process to any to access exit method in environments where Process type is restricted
    if (process.env.NODE_ENV === 'production') (process as any).exit(1);
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
    res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
  }
});

app.get('/api/fleet', async (req, res) => {
  const { tenant_id } = req.query;
  const r = await pool.query('SELECT * FROM vehicles WHERE tenant_id = $1', [tenant_id || 't1']);
  res.json(r.rows);
});

app.post('/api/fleet', async (req, res) => {
  const { plate, brand, model, tenant_id } = req.body;
  const id = `v-${Date.now()}`;
  await pool.query('INSERT INTO vehicles (id, plate, brand, model, tenant_id, data) VALUES ($1, $2, $3, $4, $5, $6)', [id, plate, brand, model, tenant_id, '{}']);
  res.json({ success: true, id });
});

app.post('/api/payments/report', async (req, res) => {
  const { driver_id, tenant_id, amount, type } = req.body;
  const id = `p-${Date.now()}`;
  await pool.query('INSERT INTO payments (id, driver_id, tenant_id, amount, type, status) VALUES ($1, $2, $3, $4, $5, $6)', [id, driver_id, tenant_id, amount, type || 'renta', 'pending']);
  await pool.query('INSERT INTO notifications (id, role_target, title, message, type) VALUES ($1, $2, $3, $4, $5)', [`n-${id}`, 'Arrendador', 'Pago Reportado', `Monto: $${amount}`, 'payment']);
  res.json({ success: true, id });
});

app.post('/api/payments/verify', async (req, res) => {
  const { payment_id, driver_id, amount } = req.body;
  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE payments SET status = \'verified\' WHERE id = $1', [payment_id]);
    await pool.query('UPDATE drivers SET balance = balance + $1 WHERE id = $2', [amount, driver_id]);
    await pool.query('INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)', [`n-v-${payment_id}`, driver_id, 'Pago Verificado', `Tu saldo ha sido actualizado en $${amount}`, 'payment']);
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (e) { 
    await pool.query('ROLLBACK'); 
    res.status(500).json({ success: false }); 
  }
});

app.get('/api/arrendador/stats', async (req, res) => {
  const { tenant_id } = req.query;
  const tId = tenant_id || 't1';
  try {
    const fleet = await pool.query('SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1', [tId]);
    const active = await pool.query('SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1 AND status = \'Activo\'', [tId]);
    const arrears = await pool.query('SELECT SUM(ABS(balance)) FROM drivers WHERE tenant_id = $1 AND balance < 0', [tId]);
    const revenue = await pool.query('SELECT SUM(amount) FROM payments WHERE tenant_id = $1 AND status = \'verified\'', [tId]);
    
    res.json({
      totalAssetsValue: parseInt(fleet.rows[0].count) * 20000,
      occupancyRate: (parseInt(active.rows[0].count) / (parseInt(fleet.rows[0].count) || 1)) * 100,
      totalArrears: parseFloat(arrears.rows[0].sum || 0),
      totalRevenue: parseFloat(revenue.rows[0].sum || 0),
      criticalActions: [{ title: 'Mantenimiento Pendiente', ref: 'ABC-123' }]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error calculando estadísticas' });
  }
});

app.get('/api/driver/me', async (req, res) => {
  const r = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.query.id || 'd1']);
  res.json(r.rows[0]);
});

app.get('/api/driver/payments', async (req, res) => {
  const r = await pool.query('SELECT * FROM payments WHERE driver_id = $1 ORDER BY created_at DESC', [req.query.id || 'd1']);
  res.json(r.rows);
});

app.get('/api/notifications', async (req, res) => {
  const { role, user_id } = req.query;
  const r = await pool.query('SELECT * FROM notifications WHERE (role_target = $1 OR user_id = $2) AND read = FALSE ORDER BY created_at DESC', [role, user_id]);
  res.json(r.rows.map(n => ({ ...n, timestamp: new Date(n.created_at).toLocaleTimeString() })));
});

app.post('/api/notifications/read', async (req, res) => {
  await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [req.body.id]);
  res.json({ success: true });
});

app.get('/api/stats/visits', async (req, res) => {
  const v = await redis.get('global_visits');
  res.json({ visits: parseInt(v || '0') });
});

app.get('/api/super/stats', async (req, res) => {
  const mrr = await pool.query('SELECT SUM(p.monthly_price) FROM tenants t JOIN plans p ON t.plan_id = p.id');
  const fleet = await pool.query('SELECT COUNT(*) FROM vehicles');
  const tenants = await pool.query('SELECT COUNT(*) FROM tenants WHERE status = \'active\'');
  res.json({ 
    totalMrr: parseFloat(mrr.rows[0].sum || 0), 
    totalFleet: parseInt(fleet.rows[0].count), 
    activeTenants: parseInt(tenants.rows[0].count), 
    suspendedTenants: 0 
  });
});

app.get('/api/super/tenants', async (req, res) => {
  const r = await pool.query('SELECT t.*, p.name as plan FROM tenants t JOIN plans p ON t.plan_id = p.id');
  res.json(r.rows.map(t => ({ ...t, companyName: t.company_name, fleetSize: 0 })));
});

app.get('/api/super/plans', async (req, res) => {
  const r = await pool.query('SELECT * FROM plans');
  res.json(r.rows);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

runMigrations().then(() => app.listen(port, () => console.log(`🚀 Aurum Cloud Active on Port ${port}`)));