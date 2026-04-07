
export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ARRENDADOR = 'Arrendador',
  ARRENDATARIO = 'Arrendatario'
}

export enum VehicleStatus {
  ACTIVE = 'Activo',
  WORKSHOP = 'Taller',
  AVAILABLE = 'Disponible',
  DEBT_HOLD = 'Bloqueado (Mora)'
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'payment' | 'system' | 'alert' | 'maintenance';
}

export interface ServicePlan {
  id: string;
  name: string;
  monthlyPrice: number;
  maxFleetSize: number;
  features: string[];
  activeSubscribers: number;
  color: 'amber' | 'indigo' | 'emerald' | 'slate';
}

export interface ArrendadoraAccount {
  id: string;
  companyName: string;
  fleetSize: number;
  status: 'active' | 'suspended';
  plan: 'Basic' | 'Enterprise' | 'Pro';
  monthlyRevenue: number;
  integrationSettings: {
    wahaUrl: string;
    wahaToken: string;
    n8nWebhook: string;
  };
}

export interface TelemetryData {
  lat: number;
  lng: number;
  speed: number;
  fuelLevel: number; // 0-100
  engineHealth: number; // 0-100
  isEngineOn: boolean;
  externalTemp: number;
  safetyScore: number; // 0-100
  harshEvents: {
    braking: number;
    acceleration: number;
    cornering: number;
  };
  lastUpdate: string;
}

export interface AmortizationInstallment {
  number: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'paid' | 'pending' | 'overdue' | 'future';
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'Preventivo' | 'Correctivo';
  description: string;
  cost: number;
  mileage: number;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: VehicleStatus;
  lastMaintenance?: string;
  nextMaintenanceKm?: number;
  next_maintenance_km?: number;
  mileage: number;
  insuranceExpiry?: string;
  insurance_expiry?: string;
  verificationExpiry?: string;
  verification_expiry?: string;
  purchasePrice?: number;
  currentEstimatedValue?: number;
  driverId?: string;
  maintenanceHistory?: MaintenanceRecord[];
  monthlyRent: number;
  securityDeposit: number;
  interestRate: number;
  telemetry?: TelemetryData;
  // Transport specific fields
  unit_type?: 'standard' | 'transportista';
  color?: string;
  sct_permit?: string;
  insurance_policy?: string;
  insurance_company?: string;
  trailer_plate?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  balance: number;
  lastPaymentDate: string;
  rating: number;
  isArrears: boolean;
  rentPlan: 'diario' | 'semanal' | 'mensual';
  contractDate: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseStatus?: 'valid' | 'expired' | 'unverified';
  licenseFrontUrl?: string;
  isVerified?: boolean;
  rfc?: string;
  zip_code?: string;
  securityDeposit: {
    total: number;
    paid: number;
  };
  amortization: {
    totalValue: number;
    paidPrincipal: number;
    totalInstallments: number;
    installments: AmortizationInstallment[];
  };
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  driverId: string;
  status: 'pending' | 'verified' | 'rejected';
  type: 'renta' | 'fianza' | 'multa' | 'otro';
  receiptUrl?: string;
}
