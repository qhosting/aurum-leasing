
import express, { Request, Response } from 'express';
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

const redis = new Redis('redis://default:5faf81de3571e8b7146c@qhosting_redis:6379');

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
}) as any);

app.use(compression() as any);
app.use(cors() as any);
app.use(express.json() as any);
app.use(express.static(path.join(__dirname, 'dist')) as any);

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('📦 Aurum System: Iniciando Migración Robusta de DB...');
    await client.query('BEGIN');

    // 1. Asegurar que las tablas existan con al menos la columna ID
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY);
    `);

    // 2. Helper para agregar columnas si no existen
    const addColumn = async (table: string, column: string, type: string) => {
      const checkColumn = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);
      
      if (checkColumn.rowCount === 0) {
        console.log(`  -> Migrando: Agregando columna ${column} a ${table}`);
        await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      }
    };

    // 3. Definir esquema completo mediante migraciones incrementales
    // Tenants
    await addColumn('tenants', 'company_name', 'TEXT NOT NULL DEFAULT \'Sin Nombre\'');
    await addColumn('tenants', 'status', 'TEXT DEFAULT \'active\'');
    await addColumn('tenants', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');
    await addColumn('tenants', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Users
    await addColumn('users', 'email', 'TEXT UNIQUE');
    await addColumn('users', 'password', 'TEXT');
    await addColumn('users', 'role', 'TEXT');
    await addColumn('users', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await addColumn('users', 'data', 'JSONB DEFAULT \'{}\'');
    await addColumn('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Drivers (EL PUNTO DE FALLO REPORTADO)
    await addColumn('drivers', 'email', 'TEXT UNIQUE');
    await addColumn('drivers', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await addColumn('drivers', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');
    await addColumn('drivers', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addColumn('drivers', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Vehicles
    await addColumn('vehicles', 'plate', 'TEXT UNIQUE');
    await addColumn('vehicles', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await addColumn('vehicles', 'driver_id', 'TEXT REFERENCES drivers(id)');
    await addColumn('vehicles', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');
    await addColumn('vehicles', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Payments
    await addColumn('payments', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await addColumn('payments', 'driver_id', 'TEXT REFERENCES drivers(id)');
    await addColumn('payments', 'amount', 'DECIMAL(12,2)');
    await addColumn('payments', 'status', 'TEXT DEFAULT \'pending\'');
    await addColumn('payments', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');
    await addColumn('payments', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Notifications
    await addColumn('notifications', 'user_id', 'TEXT');
    await addColumn('notifications', 'role_target', 'TEXT');
    await addColumn('notifications', 'title', 'TEXT NOT NULL DEFAULT \'Aviso\'');
    await addColumn('notifications', 'message', 'TEXT NOT NULL DEFAULT \'-\'');
    await addColumn('notifications', 'type', 'TEXT NOT NULL DEFAULT \'system\'');
    await addColumn('notifications', 'read', 'BOOLEAN DEFAULT FALSE');
    await addColumn('notifications', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // 4. Índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_driver ON payments(driver_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Aurum System: Esquema verificado y migrado con éxito.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Aurum System Error (initDb):', err.message);
  } finally {
    client.release();
  }
};

app.get('/api/admin/db-check', async (req: any, res: any) => {
  try {
    const tables = ['tenants', 'users', 'drivers', 'vehicles', 'payments', 'notifications'];
    const status: any = {};
    for (const table of tables) {
      const r = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      status[table] = parseInt(r.rows[0].count);
    }
    const redisVisits = await redis.get('global_visits');
    res.json({ postgres: status, redis: { global_visits: parseInt(redisVisits || '0') }, status: 'Healthy' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/notifications', async (req: any, res: any) => {
  const { role, user_id } = req.query;
  try {
    const r = await pool.query(
      'SELECT * FROM notifications WHERE role_target = $1 OR user_id = $2 ORDER BY created_at DESC LIMIT 50',
      [role || null, user_id || null]
    );
    res.json(r.rows.map(n => ({
      ...n,
      timestamp: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notifications/read', async (req: any, res: any) => {
  const { id } = req.body;
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (r.rows.length > 0) {
      await redis.incr('global_visits');
      res.json({ success: true, user: r.rows[0] });
    } else { res.status(401).json({ success: false, error: 'Credenciales inválidas' }); }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payments/report', async (req: any, res: any) => {
  const { driver_id, tenant_id, amount, ...data } = req.body;
  const id = `p-${Date.now()}`;
  const notifId = `n-${Date.now()}`;
  try {
    await pool.query('BEGIN');
    await pool.query('INSERT INTO payments (id, driver_id, tenant_id, amount, status, data) VALUES ($1, $2, $3, $4, $5, $6)', 
      [id, driver_id, tenant_id, amount, 'pending', JSON.stringify(data)]);
    await pool.query('INSERT INTO notifications (id, role_target, title, message, type) VALUES ($1, $2, $3, $4, $5)',
      [notifId, 'Arrendador', 'Nuevo Pago Reportado', `Monto: $${amount} de chofer ID: ${driver_id}`, 'payment']);
    await pool.query('COMMIT');
    res.json({ success: true, id });
  } catch (err: any) { await pool.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
});

app.post('/api/payments/verify', async (req: any, res: any) => {
  const { payment_id, driver_id, amount } = req.body;
  const notifId = `n-v-${Date.now()}`;
  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE payments SET status = \'verified\' WHERE id = $1', [payment_id]);
    await pool.query('INSERT INTO notifications (id, user_id, role_target, title, message, type) VALUES ($1, $2, $3, $4, $5, $6)',
      [notifId, driver_id, 'Arrendatario', 'Pago Verificado', `Tu pago por $${amount} ha sido validado con éxito.`, 'payment']);
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) { await pool.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
});

app.get('/api/driver/me', async (req: any, res: any) => {
  const driverId = (req.query.id as string) || 'd1';
  try {
    const driver = await pool.query('SELECT * FROM drivers WHERE id = $1', [driverId]);
    const payments = await pool.query('SELECT SUM(amount) as balance FROM payments WHERE driver_id = $1 AND status = \'verified\'', [driverId]);
    res.json({ ...driver.rows[0], balance: parseFloat(payments.rows[0].balance || '0') });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/visits', async (req: any, res: any) => {
  try {
    const visits = await redis.get('global_visits');
    res.json({ visits: parseInt(visits || '0') });
  } catch (err: any) { res.json({ visits: 0 }); }
});

app.get('*', (req: any, res: any) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDb().then(() => app.listen(port, () => console.log(`🚀 Aurum Cloud Active on Port ${port}`)));
