
import { Vehicle, VehicleStatus, Driver, PaymentRecord, AmortizationInstallment, ArrendadoraAccount, ServicePlan } from './shared/types';

const generateInstallments = (count: number, amount: number, paidCount: number): AmortizationInstallment[] => {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    dueDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
    amount: amount,
    principal: amount * 0.85,
    interest: amount * 0.15,
    status: i < paidCount ? 'paid' : (i === paidCount ? 'pending' : 'future')
  }));
};

export const MOCK_VEHICLES: Vehicle[] = [
  { 
    id: '1', plate: 'ABC-1234', brand: 'Toyota', model: 'Avanza', year: 2022, 
    status: VehicleStatus.ACTIVE, lastMaintenance: '2024-04-10', nextMaintenanceKm: 50000,
    mileage: 45000, insuranceExpiry: '2024-12-15', verificationExpiry: '2024-06-20',
    purchasePrice: 22000, currentEstimatedValue: 18500, driverId: 'd1', maintenanceHistory: [],
    monthlyRent: 9800, securityDeposit: 15000, interestRate: 1.5,
    telemetry: {
      lat: 19.432608,
      lng: -99.133209,
      speed: 42,
      fuelLevel: 68,
      engineHealth: 94,
      isEngineOn: true,
      externalTemp: 24,
      safetyScore: 88,
      harshEvents: { braking: 2, acceleration: 1, cornering: 0 },
      lastUpdate: new Date().toISOString()
    }
  },
  { 
    id: '2', plate: 'XYZ-9876', brand: 'Nissan', model: 'Versa', year: 2023, 
    status: VehicleStatus.AVAILABLE, lastMaintenance: '2024-05-01', nextMaintenanceKm: 30000,
    mileage: 28500, insuranceExpiry: '2025-01-10', verificationExpiry: '2024-07-15',
    purchasePrice: 19500, currentEstimatedValue: 17800, maintenanceHistory: [],
    monthlyRent: 8500, securityDeposit: 12000, interestRate: 1.2,
    telemetry: {
      lat: 25.686614,
      lng: -100.316113,
      speed: 0,
      fuelLevel: 32,
      engineHealth: 98,
      isEngineOn: false,
      externalTemp: 28,
      safetyScore: 95,
      harshEvents: { braking: 0, acceleration: 0, cornering: 0 },
      lastUpdate: new Date().toISOString()
    }
  }
];

export const MOCK_DRIVERS: Driver[] = [
  { 
    id: 'd1', 
    name: 'Juan Pérez', 
    phone: '5215512345678',
    balance: 150, 
    lastPaymentDate: '2024-05-15', 
    rating: 4.8, 
    isArrears: false,
    rentPlan: 'semanal',
    contractDate: '2023-01-10',
    securityDeposit: { total: 15000, paid: 15000 },
    amortization: { 
      totalValue: 25000, 
      paidPrincipal: 15000, 
      totalInstallments: 104, 
      installments: generateInstallments(10, 350, 8)
    }
  },
  {
    id: 'd2',
    name: 'Maria Garcia',
    phone: '5215598765432',
    balance: -450,
    lastPaymentDate: '2024-05-10',
    rating: 4.5,
    isArrears: true,
    rentPlan: 'diario',
    contractDate: '2023-11-05',
    securityDeposit: { total: 12000, paid: 8000 },
    amortization: {
      totalValue: 22000,
      paidPrincipal: 4000,
      totalInstallments: 365,
      installments: generateInstallments(5, 45, 2)
    }
  }
];

export const MOCK_TENANTS: ArrendadoraAccount[] = [
  { 
    id: 't1', 
    companyName: 'Aurum CDMX Sur', 
    fleetSize: 45, 
    status: 'active', 
    plan: 'Enterprise', 
    monthlyRevenue: 12500,
    integrationSettings: {
      wahaUrl: 'https://waha-cdmx.aurum-cloud.com',
      wahaToken: 'cdmx-secure-123',
      n8nWebhook: 'https://n8n.servicios.mx/webhook/cdmx-finance'
    }
  },
  { 
    id: 't2', 
    companyName: 'Elite Leasing Monterrey', 
    fleetSize: 22, 
    status: 'active', 
    plan: 'Pro', 
    monthlyRevenue: 4500,
    integrationSettings: {
      wahaUrl: 'https://waha-mty.elite.mx',
      wahaToken: 'mty-99-token',
      n8nWebhook: 'https://n8n.elite.mx/webhook/mty-ops'
    }
  }
];

export const MOCK_PLANS: ServicePlan[] = [
  {
    id: 'p1',
    name: 'Basic',
    monthlyPrice: 199,
    maxFleetSize: 15,
    features: [
      'Gestión de Inventario Digital',
      'Portal del Chofer (Web PWA)',
      'Alertas WhatsApp Estándar',
      'Reportes de Mantenimiento PDF',
      'Bóveda Digital de Documentos'
    ],
    activeSubscribers: 12,
    color: 'slate'
  },
  {
    id: 'p2',
    name: 'Pro',
    monthlyPrice: 499,
    maxFleetSize: 100,
    features: [
      'IA Preventiva Gemini Lite',
      'Conciliación de Pagos n8n',
      'Firma Digital de Contratos',
      'Soporte 24/7 Prioritario',
      'Módulo de Análisis de Riesgo'
    ],
    activeSubscribers: 8,
    color: 'amber'
  },
  {
    id: 'p3',
    name: 'Enterprise',
    monthlyPrice: 1299,
    maxFleetSize: 10000,
    features: [
      'Gemini AI Pro Estratégico',
      'Marca Blanca (Custom Domain/Logo)',
      'Integración ERP (SAP, Oracle, Odoo)',
      'Account Manager Dedicado',
      'Acceso Multi-sucursal',
      'API Full Access & Webhooks Custom',
      'Asesoría Legal de Contratos'
    ],
    activeSubscribers: 4,
    color: 'indigo'
  }
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'h1', amount: 350, date: '2024-05-01', driverId: 'd1', status: 'verified', type: 'renta' },
  { id: 'h2', amount: 350, date: '2024-05-08', driverId: 'd1', status: 'verified', type: 'renta' },
  { id: 'p1', amount: 350, date: '2024-05-15', driverId: 'd1', status: 'verified', type: 'renta' }
];
