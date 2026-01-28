
import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import migrate from 'node-pg-migrate';
import { GoogleGenAI, SchemaType } from "@google/genai";
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  loginSchema, fleetSchema, paymentReportSchema, paymentVerifySchema,
  driverProfileSchema, notificationReadSchema, aiAnalyzeSchema,
  forgotPasswordSchema, resetPasswordSchema
} from './schemas.js';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticateToken, authorizeRoles } from './middleware.js';

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
app.use(cookieParser() as any);
app.use(express.static(path.join(__dirname, 'dist')) as any);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login requests per hour
  message: 'Too many login attempts from this IP, please try again later.'
});

app.use('/api/', globalLimiter);

const runMigrations = async () => {
  console.log('📦 Aurum System: Sincronizando Esquema Maestro via node-pg-migrate...');
  try {
    // node-pg-migrate default export varies based on environment/bundler. 
    // We handle both directly calling it or accessing .default.
    const migrationRunner = (migrate as any).default || migrate;
    
    await migrationRunner({
      databaseUrl: DATABASE_URL,
      dir: path.join(__dirname, 'migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
      verbose: true
    });
    console.log('✅ Aurum System: DB Sincronizada con éxito.');
  } catch (err: any) {
    console.error('❌ Aurum System Migration Error:', err.message);
    // In production, failure to migrate is a critical error.
    if (process.env.NODE_ENV === 'production') (process as any).exit(1);
  }
};

// Endpoints
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { email, password } = validation.data;
  const r = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

  if (r.rows.length > 0) {
    const user = r.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      await redis.incr('global_visits');
      const { password: _, ...userWithoutPassword } = user;

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
        process.env.JWT_SECRET || 'aurum-secret-key-change-in-prod',
        { expiresIn: '8h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      res.json({ success: true, user: userWithoutPassword });
      return;
    }
  }

  res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const validation = forgotPasswordSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { email } = validation.data;
  const r = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

  if (r.rows.length > 0) {
    const token = crypto.randomBytes(32).toString('hex');
    await redis.setex(`reset:${token}`, 900, email); // 15 mins

    // In a real implementation:
    // await sendEmail(email, "Restablecer contraseña", `Link: https://app.aurum-leasing.mx/reset?token=${token}`);
    console.log(`[EMAIL MOCK] To: ${email} | Subject: Reset Password | Token: ${token}`);
  }

  // Always return success to prevent user enumeration
  res.json({ success: true, message: 'Si el correo existe, recibirás instrucciones.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const validation = resetPasswordSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { token, newPassword } = validation.data;
  const email = await redis.get(`reset:${token}`);

  if (!email) {
    return res.status(400).json({ error: 'Token inválido o expirado.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
  await redis.del(`reset:${token}`);

  res.json({ success: true, message: 'Contraseña actualizada.' });
});

app.get('/api/fleet', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const { tenant_id } = req.query;
  const r = await pool.query('SELECT * FROM vehicles WHERE tenant_id = $1', [tenant_id || 't1']);
  res.json(r.rows);
});

app.post('/api/fleet', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const validation = fleetSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { plate, brand, model, tenant_id } = validation.data;
  const id = `v-${Date.now()}`;
  await pool.query('INSERT INTO vehicles (id, plate, brand, model, tenant_id, data) VALUES ($1, $2, $3, $4, $5, $6)', [id, plate, brand, model, tenant_id, '{}']);
  res.json({ success: true, id });
});

app.post('/api/payments/report', authenticateToken, async (req, res) => {
  const validation = paymentReportSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { driver_id, tenant_id, amount, type } = validation.data;
  const id = `p-${Date.now()}`;
  await pool.query('INSERT INTO payments (id, driver_id, tenant_id, amount, type, status) VALUES ($1, $2, $3, $4, $5, $6)', [id, driver_id, tenant_id, amount, type || 'renta', 'pending']);
  await pool.query('INSERT INTO notifications (id, role_target, title, message, type) VALUES ($1, $2, $3, $4, $5)', [`n-${id}`, 'Arrendador', 'Pago Reportado', `Monto: $${amount}`, 'payment']);
  res.json({ success: true, id });
});

app.post('/api/payments/verify', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const validation = paymentVerifySchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { payment_id, driver_id, amount } = validation.data;
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

app.get('/api/arrendador/stats', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
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

app.get('/api/driver/me', authenticateToken, async (req, res) => {
  const driverId = req.query.id || (req as any).user.id;
  const r = await pool.query('SELECT * FROM drivers WHERE id = $1', [driverId]);
  res.json(r.rows[0]);
});

app.get('/api/driver/payments', authenticateToken, async (req, res) => {
  const driverId = req.query.id || (req as any).user.id;
  const r = await pool.query('SELECT * FROM payments WHERE driver_id = $1 ORDER BY created_at DESC', [driverId]);
  res.json(r.rows);
});

app.get('/api/drivers', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const { tenant_id } = req.query;
  const r = await pool.query('SELECT * FROM drivers WHERE tenant_id = $1', [tenant_id || 't1']);
  res.json(r.rows);
});

app.patch('/api/driver/profile', authenticateToken, async (req, res) => {
  const validation = driverProfileSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { id, data } = validation.data;
  await pool.query('UPDATE drivers SET data = data || $2::jsonb WHERE id = $1', [id, JSON.stringify(data)]);
  res.json({ success: true });
});

app.get('/api/driver/vehicle', authenticateToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM vehicles WHERE driver_id = $1', [req.query.id]);
  res.json(r.rows[0]);
});

app.post('/api/notifications/clear', async (req, res) => {
  const { role, user_id } = req.query;
  await pool.query('UPDATE notifications SET read = TRUE WHERE (role_target = $1 OR user_id = $2)', [role, user_id]);
  res.json({ success: true });
});

app.get('/api/notifications', async (req, res) => {
  const { role, user_id } = req.query;
  const r = await pool.query('SELECT * FROM notifications WHERE (role_target = $1 OR user_id = $2) AND read = FALSE ORDER BY created_at DESC', [role, user_id]);
  res.json(r.rows.map(n => ({ ...n, timestamp: new Date(n.created_at).toLocaleTimeString() })));
});

app.post('/api/notifications/read', async (req, res) => {
  const validation = notificationReadSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [validation.data.id]);
  res.json({ success: true });
});

app.post('/api/ai/analyze', async (req, res) => {
  const validation = aiAnalyzeSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const { vehicles, drivers } = validation.data;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      risks: [{ title: "Config Error", description: "API Key not configured on server." }],
      recommendations: ["Contact system administrator."]
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Analyze the following leasing fleet data for a CEO.
    Identify the top 3 risks (Financial, Operational, or Maintenance).
    Suggest 2 immediate actions to improve profitability.

    Vehicles: ${JSON.stringify(vehicles)}
    Drivers: ${JSON.stringify(drivers)}

    Return the response in a structured format with "risks" (array of {title, description}) and "recommendations" (array of strings).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            risks: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING, description: "Short title of the risk" },
                  description: { type: SchemaType.STRING, description: "Detailed explanation of the risk" }
                }
              }
            },
            recommendations: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING, description: "Specific actionable recommendation" }
            }
          }
        }
      }
    });

    const text = response.text;
    res.json(JSON.parse(text || "{}"));
  } catch (error) {
    console.error("Gemini Server Error:", error);
    res.json({
      risks: [{ title: "AI Service Error", description: "Could not generate analysis." }],
      recommendations: ["Retry later."]
    });
  }
});

app.get('/api/stats/visits', async (req, res) => {
  const v = await redis.get('global_visits');
  res.json({ visits: parseInt(v || '0') });
});

app.get('/api/super/stats', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
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

app.get('/api/super/tenants', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  const r = await pool.query('SELECT t.*, p.name as plan FROM tenants t JOIN plans p ON t.plan_id = p.id');
  res.json(r.rows.map(t => ({ ...t, companyName: t.company_name, fleetSize: 0 })));
});

app.get('/api/super/plans', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  const r = await pool.query('SELECT * FROM plans');
  res.json(r.rows);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

runMigrations().then(() => app.listen(port, () => console.log(`🚀 Aurum Cloud Active on Port ${port}`)));
