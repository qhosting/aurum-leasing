
import express from 'express';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  loginSchema, fleetSchema, paymentReportSchema, paymentVerifySchema,
  driverProfileSchema, notificationReadSchema, aiAnalyzeSchema,
  forgotPasswordSchema, resetPasswordSchema, whatsappSendSchema,
  planUpdateSchema, transportDriverSchema
} from './schemas.js';
import { sendWhatsappMessage } from './services/whatsappService.js';
import { upload, handleFileUpload } from './services/documentService.js';
import { generateStatement, exportPaymentsCSV } from './services/reportService.js';
import { aiService } from './services/aiService.js';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticateToken, authorizeRoles } from './middleware.js';
import { AuditLogger, AuditAction } from './services/auditService.js';
import { SubscriptionService } from './services/subscriptionService.js';
import { MaintenanceService } from './services/maintenanceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.set('trust proxy', 1);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && process.env.NODE_ENV !== 'test') {
  console.warn('WARNING: DATABASE_URL is not set. Database connections will fail.');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
MaintenanceService.setPool(pool);

export const redis = new Redis(process.env.REDIS_URL as string);
redis.on('error', (err) => {
  console.warn('[ioredis] No se pudo conectar a Redis. La caché estará desactivada:', err.message);
});
export const auditLogger = new AuditLogger(pool);

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
        process.env.JWT_SECRET as string,
        { expiresIn: '8h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      await auditLogger.log({
        action: AuditAction.LOGIN_SUCCESS,
        user_id: user.id,
        email: user.email,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });

      res.json({ success: true, user: userWithoutPassword });
      return;
    }
  }

  await auditLogger.log({
    action: AuditAction.LOGIN_FAILURE,
    email: email,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    details: { reason: 'Invalid credentials or user not found' }
  });

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

    await auditLogger.log({
      action: AuditAction.PASSWORD_RESET_REQUEST,
      email: email,
      ip_address: req.ip
    });
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
  const tenantId = (req as any).user.tenant_id;
  const r = await pool.query('SELECT * FROM vehicles WHERE tenant_id = $1', [tenantId]);
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
  const tenantId = (req as any).user.tenant_id;
  if (!tenantId) return res.status(400).json({ error: 'Tenant ID missing in session' });

  const cacheKey = `stats:${tenantId}`;

  try {
    // Try to get from cache first
    const cachedStats = await redis.get(cacheKey);
    if (cachedStats) {
      return res.json(JSON.parse(cachedStats));
    }

    const r = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1) as fleet_count,
        (SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1 AND status = 'Activo') as active_count,
        (SELECT SUM(ABS(balance)) FROM drivers WHERE tenant_id = $1 AND balance < 0) as total_arrears,
        (SELECT SUM(amount) FROM payments WHERE tenant_id = $1 AND status = 'verified') as total_revenue
    `, [tenantId]);

    const stats = r.rows[0];
    const fleetCount = parseInt(stats.fleet_count);
    const activeCount = parseInt(stats.active_count);

    const result = {
      totalAssetsValue: fleetCount * 20000,
      occupancyRate: (activeCount / (fleetCount || 1)) * 100,
      totalArrears: parseFloat(stats.total_arrears || 0),
      totalRevenue: parseFloat(stats.total_revenue || 0),
      criticalActions: [{ title: 'Mantenimiento Pendiente', ref: 'ABC-123' }]
    };

    // Store in cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error calculando estadísticas' });
  }
});

app.get('/api/arrendador/analytics', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const tenantId = (req as any).user.tenant_id;
  try {
    const r = await pool.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM payments
      WHERE tenant_id = $1 AND status = 'Verified'
      AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date ASC
    `, [tenantId]);

    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo analíticos' });
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
  const tenantId = (req as any).user.tenant_id;
  const r = await pool.query('SELECT * FROM drivers WHERE tenant_id = $1', [tenantId]);
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

app.post('/api/notifications/clear', authenticateToken, async (req, res) => {
  const { role, id: user_id } = (req as any).user;
  await pool.query('UPDATE notifications SET read = TRUE WHERE (role_target = $1 OR user_id = $2)', [role, user_id.toString()]);
  res.json({ success: true });
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  const { role, id: user_id } = (req as any).user;
  const r = await pool.query('SELECT * FROM notifications WHERE (role_target = $1 OR user_id = $2) AND read = FALSE ORDER BY created_at DESC', [role, user_id.toString()]);
  res.json(r.rows.map(n => ({ ...n, timestamp: new Date(n.created_at).toLocaleTimeString() })));
});

app.post('/api/notifications/read', async (req, res) => {
  const validation = notificationReadSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [validation.data.id]);
  res.json({ success: true });
});

app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
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
          type: Type.OBJECT,
          properties: {
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short title of the risk" },
                  description: { type: Type.STRING, description: "Detailed explanation of the risk" }
                }
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: "Specific actionable recommendation" }
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
  try {
    const r = await pool.query(`
      SELECT 
        (SELECT SUM(p.monthly_price) FROM tenants t JOIN plans p ON t.plan_id = p.id) as total_mrr,
        (SELECT COUNT(*) FROM vehicles) as total_fleet,
        (SELECT COUNT(*) FROM tenants WHERE status = 'active') as active_tenants
    `);

    const stats = r.rows[0];
    res.json({
      totalMrr: parseFloat(stats.total_mrr || 0),
      totalFleet: parseInt(stats.total_fleet || 0),
      activeTenants: parseInt(stats.active_tenants || 0),
      suspendedTenants: 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Error calculando estadísticas globales' });
  }
});

app.get('/api/super/tenants', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  const r = await pool.query('SELECT t.*, p.name as plan FROM tenants t JOIN plans p ON t.plan_id = p.id');
  res.json(r.rows.map(t => ({ ...t, companyName: t.company_name, fleetSize: 0 })));
});

app.get('/api/super/plans', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  const r = await pool.query('SELECT * FROM plans');
  res.json(r.rows);
});

// WAHA Integration
app.post('/api/whatsapp/send', authenticateToken, authorizeRoles('Super Admin', 'Arrendador'), async (req, res) => {
  const validation = whatsappSendSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  await sendWhatsappMessage(req, res);
});

// Document Upload
app.post('/api/documents/upload', authenticateToken, upload.single('file'), handleFileUpload);

// Reports
app.get('/api/reports/statement/:driverId', authenticateToken, generateStatement);
app.get('/api/reports/payments/csv', authenticateToken, exportPaymentsCSV);

// --- Driver License Verification with Gemini AI ---
app.post('/api/drivers/:id/verify-license', authenticateToken, upload.single('license'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen de la licencia' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Config error: GEMINI_API_KEY is not set.' });
  const ai = new GoogleGenAI({ apiKey });

  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    const prompt = `
      Analiza esta imagen de una licencia de conducir (México). 
      Extrae:
      1. Número de licencia (license_number)
      2. Fecha de vencimiento (license_expiry) en formato YYYY-MM-DD.
      
      Retorna un JSON válido.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            license_number: { type: Type.STRING },
            license_expiry: { type: Type.STRING }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    // Validar si la fecha es válida para PostgreSQL
    const expiry = data.license_expiry && !isNaN(Date.parse(data.license_expiry)) ? data.license_expiry : null;

    // Actualizar base de datos
    await pool.query(
      'UPDATE drivers SET license_number = $1, license_expiry = $2, license_status = $3, is_verified = true, last_ocr_at = NOW() WHERE id = $4',
      [data.license_number, expiry, 'valid', id]
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error("AI License Verification Error:", err);
    res.status(500).json({ error: 'Fallo al procesar la licencia con IA' });
  }
});

app.post('/api/maintenance/log', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const { vehicle_id, ...data } = req.body;
  try {
    const result = await MaintenanceService.logMaintenance(vehicle_id, data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error registrando mantenimiento' });
  }
});

app.get('/api/maintenance/history/:vehicleId', authenticateToken, async (req, res) => {
  const { vehicleId } = req.params;
  try {
    const r = await pool.query('SELECT * FROM maintenance_logs WHERE vehicle_id = $1 ORDER BY date DESC', [vehicleId]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

app.get('/api/maintenance/alerts', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const tenantId = (req as any).user.tenant_id;
  try {
    const alerts = await MaintenanceService.checkMaintenanceAlerts(tenantId);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo alertas' });
  }
});

app.get('/api/tenants/:id', authenticateToken, async (req, res) => {
  const tenantId = req.params.id;
  if ((req as any).user.role !== 'Super Admin' && (req as any).user.tenant_id !== tenantId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const r = await pool.query(`
    SELECT t.*, p.name as plan_name, p.monthly_price as plan_price
    FROM tenants t 
    LEFT JOIN plans p ON t.plan_id = p.id 
    WHERE t.id = $1
  `, [tenantId]);

  if (r.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
  res.json(r.rows[0]);
});

// --- Subscription management ---
app.patch('/api/tenants/:id/plan', authenticateToken, authorizeRoles('Super Admin', 'Arrendador'), async (req, res) => {
  const validation = planUpdateSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: validation.error });

  const tenantId = req.params.id;
  // Security check: Arrendador can only update their own tenant
  if ((req as any).user.role === 'Arrendador' && (req as any).user.tenant_id !== tenantId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await SubscriptionService.upgradePlan(tenantId, validation.data.plan_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tenants/:id/invoices', authenticateToken, async (req, res) => {
  const tenantId = req.params.id;
  if ((req as any).user.role !== 'Super Admin' && (req as any).user.tenant_id !== tenantId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const r = await pool.query('SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
  res.json(r.rows);
});

// Run background task for subscriptions every 24 hours
setInterval(() => {
  SubscriptionService.processSubscriptions();
}, 24 * 60 * 60 * 1000);

// Initial run after start
setTimeout(() => SubscriptionService.processSubscriptions(), 5000);



// --- Transport Unit (Tractocamion) Management Routes ---

// 3. Get Detailed Unit Info (Vehicle + Driver + Docs)
app.get('/api/fleet/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const tenantId = (req as any).user.tenant_id;

  try {
    const vehicleRes = await pool.query('SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (vehicleRes.rows.length === 0) return res.status(404).json({ error: 'Unidad no encontrada' });

    const vehicle = vehicleRes.rows[0];
    let driver = null;
    if (vehicle.driver_id) {
       const driverRes = await pool.query('SELECT * FROM drivers WHERE id = $1', [vehicle.driver_id]);
       driver = driverRes.rows[0];
    }

    const docsRes = await pool.query('SELECT * FROM documents WHERE entity_id = $1 OR entity_id = $2', [vehicle.id, vehicle.driver_id]);
    
    res.json({
      success: true,
      vehicle,
      driver,
      documents: docsRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener detalle de la unidad' });
  }
});

// 4. List Documents for a Unit
app.get('/api/fleet/:id/documents', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const r = await pool.query('SELECT * FROM documents WHERE entity_id = $1 ORDER BY created_at DESC', [id]);
  res.json(r.rows);
});

// 5. Update Transport Unit
app.patch('/api/fleet/transportista/:id', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const { id } = req.params;
  const { vehicle, driver } = req.body;
  const tenantId = (req as any).user.tenant_id;

  try {
    await pool.query('BEGIN');
    
    // Update Vehicle
    if (vehicle) {
      await pool.query(
        `UPDATE vehicles SET 
         plate = COALESCE($1, plate), brand = COALESCE($2, brand), model = COALESCE($3, model),
         color = COALESCE($4, color), sct_permit = COALESCE($5, sct_permit), 
         insurance_policy = COALESCE($6, insurance_policy), insurance_company = COALESCE($7, insurance_company),
         trailer_plate = COALESCE($8, trailer_plate)
         WHERE id = $9 AND tenant_id = $10`,
        [
          vehicle.plate, vehicle.brand, vehicle.model, vehicle.color, vehicle.sct_permit,
          vehicle.insurance_policy, vehicle.insurance_company, vehicle.trailer_plate, id, tenantId
        ]
      );
    }

    // Update Driver if driver_id is present
    if (driver && driver.id) {
      await pool.query(
        'UPDATE drivers SET name = COALESCE($1, name), rfc = COALESCE($2, rfc), zip_code = COALESCE($3, zip_code) WHERE id = $4 AND tenant_id = $5',
        [driver.name, driver.rfc, driver.zip_code, driver.id, tenantId]
      );
    }

    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Error al actualizar unidad' });
  }
});

// 6. Delete Unit
app.delete('/api/fleet/:id', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const { id } = req.params;
  const tenantId = (req as any).user.tenant_id;

  try {
    await pool.query('DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    // Note: Documents are kept in the database by default as history unless explicitly requested to delete.
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar unidad' });
  }
});



// --- Transport Unit (Tractocamion) Special Endpoints ---

// 1. AI Data Extraction from Documents
app.post('/api/ai/extract-unit', authenticateToken, upload.array('docs', 5), async (req, res) => {
  if (!req.files || (req.files as any[]).length === 0) {
    return res.status(400).json({ error: 'No se subieron documentos para analizar.' });
  }

  const filePaths = (req.files as any[]).map(f => f.path);
  
  try {
    const data = await aiService.extractTransportData(filePaths);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("AI Unit extraction error:", err.message);
    res.status(500).json({ error: 'Fallo al procesar documentos con IA' });
  }
});

// 2. Specialized Fleet Creation for Transport Units
app.post('/api/fleet/transportista', authenticateToken, authorizeRoles('Arrendador'), async (req, res) => {
  const { vehicle, driver, documents } = req.body;

  try {
    await pool.query('BEGIN');

    // 1. Handle Driver (Operador)
    const driverId = driver.id || `d-tr-${Date.now()}`;
    if (!driver.id) {
       await pool.query(
        'INSERT INTO drivers (id, name, rfc, zip_code, tenant_id) VALUES ($1, $2, $3, $4, $5)',
        [driverId, driver.name, driver.rfc, driver.zip_code, (req as any).user.tenant_id]
      );
    } else {
       await pool.query(
        'UPDATE drivers SET rfc = $1, zip_code = $2, name = $3 WHERE id = $4',
        [driver.rfc, driver.zip_code, driver.name, driverId]
      );
    }

    // 2. Handle Vehicle (Tracto)
    const vehicleId = `v-tr-${Date.now()}`;
    await pool.query(
      `INSERT INTO vehicles 
       (id, plate, brand, model, unit_type, color, sct_permit, insurance_policy, insurance_company, trailer_plate, tenant_id, driver_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        vehicleId, vehicle.plate, vehicle.brand, vehicle.model, 'transportista',
        vehicle.color, vehicle.sct_permit, vehicle.insurance_policy, vehicle.insurance_company,
        vehicle.trailer_plate, (req as any).user.tenant_id, driverId
      ]
    );

    // 3. Associate Backup Documents
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        await pool.query(
          'INSERT INTO documents (id, entity_type, entity_id, doc_type, file_path, original_name) VALUES ($1, $2, $3, $4, $5, $6)',
          [`doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, doc.entity_type, doc.entity_type === 'driver' ? driverId : vehicleId, doc.type, doc.path, doc.name]
        );
      }
    }

    await pool.query('COMMIT');
    res.json({ success: true, vehicleId, driverId });
  } catch (err: any) {
    await pool.query('ROLLBACK');
    console.error("Transport Unit Creation Error:", err.message);
    res.status(500).json({ error: 'Error al dar de alta la unidad de transporte.' });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
