
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const fleetSchema = z.object({
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  unit_type: z.enum(['standard', 'transportista']).optional().default('standard'),
  color: z.string().optional(),
  sct_permit: z.string().optional(),
  insurance_policy: z.string().optional(),
  insurance_company: z.string().optional(),
  trailer_plate: z.string().optional(),
  tenant_id: z.string().optional()
});

export const transportDriverSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rfc: z.string().optional(),
  zip_code: z.string().optional(),
  license_number: z.string().optional(),
  data: z.object({}).passthrough().optional()
});

export const paymentReportSchema = z.object({
  driver_id: z.string().min(1),
  tenant_id: z.string().min(1),
  amount: z.number().positive(),
  type: z.string().optional()
});

export const paymentVerifySchema = z.object({
  payment_id: z.string().min(1),
  driver_id: z.string().min(1),
  amount: z.number().positive()
});

export const driverProfileSchema = z.object({
  id: z.string().min(1),
  data: z.object({}).passthrough()
});

export const notificationReadSchema = z.object({
  id: z.string().min(1)
});

export const aiAnalyzeSchema = z.object({
  vehicles: z.array(z.any()),
  drivers: z.array(z.any())
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6)
});

export const whatsappSendSchema = z.object({
  chatId: z.string().min(1),
  text: z.string().min(1),
  session: z.string().optional()
});

export const planUpdateSchema = z.object({
  plan_id: z.string().min(1)
});
