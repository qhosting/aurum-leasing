
import { Vehicle, Driver, PaymentRecord } from '../types';
import { MOCK_VEHICLES, MOCK_DRIVERS, MOCK_PAYMENTS } from '../constants';

const API_BASE = '/api';

export const persistenceService = {
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const res = await fetch(`${API_BASE}/fleet`);
      if (!res.ok) return MOCK_VEHICLES;
      const data = await res.json();
      return data.length > 0 ? data : MOCK_VEHICLES;
    } catch (err) {
      console.warn('[Aurum] Usando fallback de vehículos local');
      return MOCK_VEHICLES;
    }
  },

  // Added getDrivers to handle driver data retrieval and fix TypeScript property missing error
  async getDrivers(): Promise<Driver[]> {
    try {
      const res = await fetch(`${API_BASE}/drivers`);
      if (!res.ok) return MOCK_DRIVERS;
      const data = await res.json();
      return data.length > 0 ? data : MOCK_DRIVERS;
    } catch (err) {
      console.warn('[Aurum] Usando fallback de conductores local');
      return MOCK_DRIVERS;
    }
  },

  async getPendingPayments(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/payments/pending`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  async getGlobalStats(): Promise<{ visits: number }> {
    try {
      const res = await fetch(`${API_BASE}/stats/visits`);
      if (!res.ok) return { visits: 1024 };
      return await res.json();
    } catch {
      return { visits: 1024 };
    }
  }
};
