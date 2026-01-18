
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
    console.log('📦 Aurum System: Sincronizando Esquema Maestro...');
    
    // 1. Asegurar Tablas Base
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS contracts (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS maintenance_records (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY);
    `);

    // 2. Función de Migración Dinámica Mejorada
    const ensureColumn = async (table: string, column: string, type: string, defaultValue: string) => {
      const res = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = '${column}'
      `);
      
      if (res.rows.length === 0) {
        // Si no existe, crear con default para registros futuros
        await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultValue}`);
      }
      
      // Limpiar registros existentes que tengan NULL en esta columna (Crucial para el error reportado)
      await client.query(`UPDATE ${table} SET ${column} = ${defaultValue} WHERE ${column} IS NULL`);
      
      // Aplicar restricciones finales
      try {
        await client.query(`ALTER TABLE ${table} ALTER COLUMN ${column} SET NOT NULL`);
        await client.query(`ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${defaultValue}`);
      } catch (e) {
        console.warn(`⚠️ Warning en ${table}.${column}:`, (e as Error).message);
      }
    };

    // --- Módulo SaaS & Tenants ---
    await ensureColumn('plans', 'name', 'TEXT', "'Basic'");
    await ensureColumn('plans', 'monthly_price', 'DECIMAL(10,2)', '0');
    await ensureColumn('plans', 'features', 'JSONB', "'[]'");
    await ensureColumn('plans', 'color', 'TEXT', "'slate'");

    await ensureColumn('tenants', 'company_name', 'TEXT', "'Empresa Nueva'");
    await ensureColumn('tenants', 'plan_id', 'TEXT', "'p1'");
    await ensureColumn('tenants', 'status', 'TEXT', "'active'");
    await ensureColumn('tenants', 'data', 'JSONB', "'{}'"); // FIX: Gestión de columna 'data' en tenants

    // --- Módulo Usuarios ---
    await ensureColumn('users', 'email', 'TEXT', "''");
    await ensureColumn('users', 'password', 'TEXT', "'123'");
    await ensureColumn('users', 'role', 'TEXT', "'Arrendatario'");
    await ensureColumn('users', 'tenant_id', 'TEXT', "NULL");
    await ensureColumn('users', 'data', 'JSONB', "'{}'");

    await ensureColumn('drivers', 'tenant_id', 'TEXT', "NULL");
    await ensureColumn('drivers', 'email', 'TEXT', "''");
    await ensureColumn('drivers', 'balance', 'DECIMAL(12,2)', '0');
    await ensureColumn('drivers', 'data', 'JSONB', "'{}'");

    // --- Módulo Flota ---
    await ensureColumn('vehicles', 'plate', 'TEXT', "''");
    await ensureColumn('vehicles', 'brand', 'TEXT', "''");
    await ensureColumn('vehicles', 'model', 'TEXT', "''");
    await ensureColumn('vehicles', 'status', 'TEXT', "'Disponible'");
    await ensureColumn('vehicles', 'tenant_id', 'TEXT', "NULL");
    await ensureColumn('vehicles', 'driver_id', 'TEXT', "NULL");
    await ensureColumn('vehicles', 'data', 'JSONB', "'{}'");

    // --- Módulo Financiero ---
    await ensureColumn('payments', 'tenant_id', 'TEXT', "NULL");
    await ensureColumn('payments', 'driver_id', 'TEXT', "NULL");
    await ensureColumn('payments', 'amount', 'DECIMAL(12,2)', '0');
    await ensureColumn('payments', 'status', 'TEXT', "'pending'");
    await ensureColumn('payments', 'type', 'TEXT', "'renta'");
    await ensureColumn('payments', 'data', 'JSONB', "'{}'");
    await ensureColumn('payments', 'created_at', 'TIMESTAMP', 'CURRENT_TIMESTAMP');

    // --- Módulo Notificaciones ---
    await ensureColumn('notifications', 'user_id', 'TEXT', "NULL");
    await ensureColumn('notifications', 'role_target', 'TEXT', "NULL");
    await ensureColumn('notifications', 'title', 'TEXT', "''");
    await ensureColumn('notifications', 'message', 'TEXT', "''");
    await ensureColumn('notifications', 'type', 'TEXT', "'system'");
    await ensureColumn('notifications', 'read', 'BOOLEAN', 'FALSE');
    await ensureColumn('notifications', 'created_at', 'TIMESTAMP', 'CURRENT_TIMESTAMP');

    // 3. Semilla de Datos (UPSERTs Actualizados)
    await client.query("BEGIN");
    
    await client.query(`
      INSERT INTO plans (id, name, monthly_price, color, features) 
      VALUES ('p1', 'Basic', 199, 'slate', '["Gestión Flota"]'), 
             ('p2', 'Pro', 499, 'amber', '["IA Gemini Lite"]'), 
             ('p3', 'Enterprise', 1299, 'indigo', '["IA Pro Full"]') 
      ON CONFLICT (id) DO UPDATE SET monthly_price = EXCLUDED.monthly_price;
    `);

    // FIX: Incluir 'data' en el insert de tenants para satisfacer la restricción NOT NULL
    await client.query(`
      INSERT INTO tenants (id, company_name, plan_id, data) 
      VALUES ('t1', 'Aurum Leasing Demo', 'p3', '{}') 
      ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;
    `);

    await client.query(`
      INSERT INTO users (id, email, password, role, tenant_id, data) 
      VALUES ('u1', 'admin@aurum.mx', 'admin123', 'Super Admin', NULL, '{}'), 
             ('u2', 'pro@aurum.mx', 'pro123', 'Arrendador', 't1', '{}'), 
             ('u3', 'chofer@aurum.mx', 'chofer123', 'Arrendatario', 't1', '{}') 
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    `);

    await client.query(`
      INSERT INTO drivers (id, email, tenant_id, balance, data) 
      VALUES ('d1', 'chofer@aurum.mx', 't1', 0, '{"name": "Juan Pérez", "amortization": {"paidPrincipal": 5000, "totalValue": 25000}}') 
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    `);

    await client.query(`
      INSERT INTO vehicles (id, plate, brand, model, status, tenant_id, driver_id, data) 
      VALUES ('v1', 'ABC-123', 'Toyota', 'Avanza', 'Activo', 't1', 'd1', '{}'), 
             ('v2', 'XYZ-987', 'Nissan', 'Versa', 'Disponible', 't1', NULL, '{}') 
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query("COMMIT");
    console.log('✅ Aurum System: DB Sincronizada y Hotfix Aplicado.');

  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error('❌ Aurum System DB Error:', err.message);
  } finally {
    client.release();
  }
};

// --- ENDPOINTS ---
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
  await pool.query('INSERT INTO vehicles (id, plate, brand, model, tenant_id) VALUES ($1, $2, $3, $4, $5)', [id, plate, brand, model, tenant_id]);
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

initDb().then(() => app.listen(port, () => console.log(`🚀 Aurum Cloud Active on Port ${port}`)));
