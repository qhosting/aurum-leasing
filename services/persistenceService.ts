
import { Vehicle, Driver, PaymentRecord, UserRole, ArrendadoraAccount, ServicePlan, Notification } from '../types';

const API_BASE = '/api';

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenant_id: string;
    data: any;
  };
  error?: string;
}

// Helper to include credentials in all fetch calls
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include' // Important for HttpOnly cookies
  });
};

export const persistenceService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) { return { success: false, error: 'Error de red.' }; }
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch { /* ignore */ }
  },

  // NOTIFICATIONS PRODUCTION METHODS
  async getNotifications(role: string, userId: string): Promise<Notification[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notifications?role=${role}&user_id=${userId}`);
      return await res.json();
    } catch { return []; }
  },

  async markNotificationRead(id: string): Promise<any> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return await res.json();
    } catch { return { success: false }; }
  },

  async clearNotifications(role: string, userId: string): Promise<any> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notifications/clear?role=${role}&user_id=${userId}`, {
        method: 'POST'
      });
      return await res.json();
    } catch { return { success: false }; }
  },

  // Driver (Arrendatario) Methods
  async getDriverMe(driverId: string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/driver/me?id=${driverId}`);
    return await res.json();
  },

  async updateDriverProfile(driverId: string, data: any): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/driver/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: driverId, data })
    });
    return await res.json();
  },

  async getDriverVehicle(driverId: string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/driver/vehicle?id=${driverId}`);
    return await res.json();
  },

  async getDriverPayments(driverId: string): Promise<any[]> {
    const res = await fetchWithAuth(`${API_BASE}/driver/payments?id=${driverId}`);
    return await res.json();
  },

  async reportDriverPayment(paymentData: any): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/payments/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return await res.json();
  },

  // Lessor (Arrendador) Methods
  async verifyPayment(paymentId: string, driverId: string, amount: number): Promise<any> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, driver_id: driverId, amount })
      });
      return await res.json();
    } catch { return { success: false }; }
  },

  async getArrendadorStats(tenantId: string = 't1'): Promise<any> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/arrendador/stats?tenant_id=${tenantId}`);
      return await res.json();
    } catch { return null; }
  },

  async getVehicles(tenantId: string = 't1'): Promise<Vehicle[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/fleet?tenant_id=${tenantId}`);
      return await res.json();
    } catch { return []; }
  },

  async saveVehicle(vehicle: Partial<Vehicle>, tenantId: string = 't1'): Promise<any> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/fleet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vehicle, tenant_id: tenantId })
      });
      return await res.json();
    } catch { return { error: 'Network error' }; }
  },

  async getDrivers(tenantId: string = 't1'): Promise<Driver[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/drivers?tenant_id=${tenantId}`);
      return await res.json();
    } catch { return []; }
  },

  async getGlobalStats(): Promise<{ visits: number }> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/stats/visits`);
      return await res.json();
    } catch { return { visits: 0 }; }
  },

  // Super Admin Methods
  async getSuperStats(): Promise<any> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/super/stats`);
      return await res.json();
    } catch { return null; }
  },

  async getSuperTenants(): Promise<ArrendadoraAccount[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/super/tenants`);
      return await res.json();
    } catch { return []; }
  },

  async getSuperPlans(): Promise<ServicePlan[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/super/plans`);
      return await res.json();
    } catch { return []; }
  }
};
