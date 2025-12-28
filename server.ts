
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

// Configuración de Bases de Datos con credenciales de producción
// Se priorizan variables de entorno para Easypanel/Docker
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:57c52e388e393eb0b74f@qhosting_aurum-leasing-db:5432/aurum-leasing-db?sslmode=disable',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const redis = new Redis(process.env.REDIS_URL || 'redis://default:5faf81de3571e8b7146c@qhosting_redis:6379');

// Middleware de optimización y seguridad
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json());

// Servir frontend compilado
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * INIT DB: Crea la estructura necesaria para Aurum Leasing V en el deploy inicial.
 * Se utiliza JSONB para flexibilidad en la evolución de los modelos de Arrendadora y Vehículos.
 */
const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('--- AURUM DB INITIALIZATION START ---');
    await client.query('BEGIN');

    // Tabla de Vehículos e Inventario
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        plate TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de Choferes / Arrendatarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de Pagos y Transacciones
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

    // Tabla de Arrendadoras (Clientes SaaS / Tenants)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de Planes de Servicio Aurum
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Aurum Leasing V: Estructura de Tablas verificada/creada.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ DB Init Error:', err);
  } finally {
    client.release();
  }
};

// --- API ENDPOINTS ---

// Fleet API
app.get('/api/fleet', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM vehicles ORDER BY created_at DESC');
    res.json(result.rows.map(r => r.data));
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar flota' });
  }
});

app.post('/api/fleet', async (req, res) => {
  const vehicle = req.body;
  try {
    await pool.query(
      'INSERT INTO vehicles (id, plate, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $3, plate = $2, updated_at = CURRENT_TIMESTAMP',
      [vehicle.id, vehicle.plate, vehicle]
    );
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar vehículo' });
  }
});

// Drivers API
app.get('/api/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM drivers ORDER BY created_at DESC');
    res.json(result.rows.map(r => r.data));
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar conductores' });
  }
});

app.post('/api/drivers', async (req, res) => {
  const driver = req.body;
  try {
    await pool.query(
      'INSERT INTO drivers (id, email, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $3, email = $2, updated_at = CURRENT_TIMESTAMP',
      [driver.id, driver.email || driver.id, driver]
    );
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar conductor' });
  }
});

// Redis: Tracking de actividad global
app.get('/api/stats/visits', async (req, res) => {
  try {
    const visits = await redis.incr('global_visits');
    res.json({ visits });
  } catch (err) {
    res.json({ visits: 1024 });
  }
});

// Fallback para Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Inicializar DB y luego arrancar servidor
initDb().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Aurum Enterprise Server running on port ${port}`);
    console.log(`🌍 Production Domain: aurumleasing.mx`);
  });
});
