
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const fleetSchema = z.object({
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  tenant_id: z.string().optional()
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
