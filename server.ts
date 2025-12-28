
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
    console.log('--- AURUM DATABASE SYSTEM INITIALIZATION ---');
    await client.query('BEGIN');

    // 1. Tabla de Usuarios (Auth & Roles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        tenant_id TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabla de Tenants (Empresas Arrendadoras)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabla de Planes de Servicio
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_plans (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Tabla de Vehículos
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        plate TEXT UNIQUE NOT NULL,
        tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Tabla de Conductores
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Tabla de Pagos
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
        amount DECIMAL(12,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- SEEDING INICIAL ---
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('🌱 Realizando Seeding inicial de Aurum Leasing...');

      // Super Admin
      await client.query(`
        INSERT INTO users (id, email, password, role, data) 
        VALUES ($1, $2, $3, $4, $5)`, 
        ['root-admin', 'root@aurumleasing.mx', 'x0420EZS*', 'Super Admin', { name: 'Aurum Root' }]
      );

      // Planes
      await client.query(`
        INSERT INTO service_plans (id, name, data) VALUES 
        ('p1', 'Basic', '{"price": 199, "fleet_limit": 15}'),
        ('p2', 'Pro', '{"price": 499, "fleet_limit": 100}'),
        ('p3', 'Enterprise', '{"price": 1299, "fleet_limit": 10000}')
      `);

      // Empresa de Ejemplo
      await client.query(`
        INSERT INTO tenants (id, company_name, data) 
        VALUES ('t1', 'Aurum Leasing CDMX', '{"plan": "Enterprise", "revenue": 0}')
      `);

      // Vehículos de Ejemplo Real
      await client.query(`
        INSERT INTO vehicles (id, plate, tenant_id, data) VALUES 
        ('v1', 'NXY-4421', 't1', '{"brand": "Toyota", "model": "Avanza", "year": 2023, "status": "Activo", "mileage": 12400}'),
        ('v2', 'PHZ-9912', 't1', '{"brand": "Nissan", "model": "Versa", "year": 2022, "status": "Disponible", "mileage": 45000}')
      `);

      // Conductor de Ejemplo
      await client.query(`
        INSERT INTO drivers (id, email, tenant_id, data) 
        VALUES ('d1', 'conductor.demo@aurum.mx', 't1', '{"name": "Roberto Mendez", "phone": "5215512345678", "balance": 0}')
      `);

      console.log('✅ Seeding completado con éxito.');
    }

    await client.query('COMMIT');
    console.log('✅ Base de datos Aurum lista para producción.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error crítico en migración:', err);
  } finally {
    client.release();
  }
};

// Endpoints básicos
app.get('/api/fleet', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM vehicles ORDER BY created_at DESC');
    res.json(result.rows.map(r => r.data));
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
