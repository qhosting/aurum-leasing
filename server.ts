
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
    console.log('📦 Aurum System: Iniciando Sincronización de Esquema y Datos...');
    
    // 1. Crear tablas base si no existen
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY);
    `);

    // 2. Función auxiliar para ejecutar migraciones seguras
    const migrateColumn = async (table: string, column: string, definition: string) => {
      await client.query(`
        DO $$ BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = '${column}') THEN 
            ALTER TABLE ${table} ADD COLUMN ${column} ${definition};
          END IF; 
        END $$;
      `);
    };

    // 3. Definición de columnas
    await migrateColumn('tenants', 'company_name', 'TEXT NOT NULL DEFAULT \'Sin Nombre\'');
    await migrateColumn('tenants', 'status', 'TEXT DEFAULT \'active\'');
    await migrateColumn('tenants', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');
    await migrateColumn('tenants', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    await migrateColumn('users', 'email', 'TEXT UNIQUE');
    await migrateColumn('users', 'password', 'TEXT');
    await migrateColumn('users', 'role', 'TEXT');
    await migrateColumn('users', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await migrateColumn('users', 'data', 'JSONB DEFAULT \'{}\'');

    await migrateColumn('drivers', 'email', 'TEXT UNIQUE');
    await migrateColumn('drivers', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await migrateColumn('drivers', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');

    await migrateColumn('vehicles', 'plate', 'TEXT UNIQUE');
    await migrateColumn('vehicles', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await migrateColumn('vehicles', 'driver_id', 'TEXT REFERENCES drivers(id)');
    await migrateColumn('vehicles', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');

    await migrateColumn('payments', 'tenant_id', 'TEXT REFERENCES tenants(id)');
    await migrateColumn('payments', 'driver_id', 'TEXT REFERENCES drivers(id)');
    await migrateColumn('payments', 'amount', 'DECIMAL(12,2)');
    await migrateColumn('payments', 'status', 'TEXT DEFAULT \'pending\'');
    await migrateColumn('payments', 'data', 'JSONB NOT NULL DEFAULT \'{}\'');

    await migrateColumn('notifications', 'user_id', 'TEXT');
    await migrateColumn('notifications', 'role_target', 'TEXT');
    await migrateColumn('notifications', 'title', 'TEXT NOT NULL DEFAULT \'Aviso\'');
    await migrateColumn('notifications', 'message', 'TEXT NOT NULL DEFAULT \'-\'');
    await migrateColumn('notifications', 'type', 'TEXT NOT NULL DEFAULT \'system\'');
    await migrateColumn('notifications', 'read', 'BOOLEAN DEFAULT FALSE');
    await migrateColumn('notifications', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // 4. Semillas de datos (Users para Login)
    await client.query(`
      INSERT INTO tenants (id, company_name) VALUES ('t1', 'Aurum Leasing Demo') ON CONFLICT DO NOTHING;
      INSERT INTO users (id, email, password, role, tenant_id) VALUES 
        ('u1', 'admin@aurum.mx', 'admin123', 'Super Admin', NULL),
        ('u2', 'pro@aurum.mx', 'pro123', 'Arrendador', 't1'),
        ('u3', 'chofer@aurum.mx', 'chofer123', 'Arrendatario', 't1')
      ON CONFLICT (email) DO NOTHING;
      INSERT INTO drivers (id, email, tenant_id, data) VALUES 
        ('d1', 'chofer@aurum.mx', 't1', '{"name": "Juan Chofer", "balance": 0, "amortization": {"paidPrincipal": 5000, "totalValue": 25000}}')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('✅ Aurum System: Base de Datos sincronizada y poblada.');
  } catch (err: any) {
    console.error('❌ Aurum System DB Error:', err.message);
  } finally {
    client.release();
  }
};

// --- ENDPOINTS ---

app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (r.rows.length > 0) {
      const user = r.rows[0];
      await redis.incr('global_visits');
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: 'Credenciales no encontradas en el sistema Aurum.' });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/notifications', async (req: any, res: any) => {
  const { role, user_id } = req.query;
  try {
    const r = await pool.query(
      'SELECT * FROM notifications WHERE (role_target = $1 OR user_id = $2) AND read = FALSE ORDER BY created_at DESC LIMIT 50',
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

app.get('/api/driver/me', async (req: any, res: any) => {
  const driverId = req.query.id as string;
  try {
    const r = await pool.query('SELECT * FROM drivers WHERE id = $1', [driverId || 'd1']);
    res.json(r.rows[0] || null);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/visits', async (req: any, res: any) => {
  try {
    const v = await redis.get('global_visits');
    res.json({ visits: parseInt(v || '0') });
  } catch { res.json({ visits: 0 }); }
});

app.get('*', (req: any, res: any) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

initDb().then(() => app.listen(port, () => console.log(`🚀 Aurum Cloud Active on Port ${port}`)));
