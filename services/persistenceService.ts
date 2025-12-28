
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
      console.warn('[Aurum] Usando fallback de vehículos');
      return MOCK_VEHICLES;
    }
  },

  async saveVehicle(vehicle: Vehicle): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/fleet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle),
      });
      return res.ok;
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('aurum_local_fleet') || '[]');
      localStorage.setItem('aurum_local_fleet', JSON.stringify([...local, vehicle]));
      return true;
    }
  },

  async getDrivers(): Promise<Driver[]> {
    try {
      const res = await fetch(`${API_BASE}/drivers`);
      if (!res.ok) return MOCK_DRIVERS;
      const data = await res.json();
      return data.length > 0 ? data : MOCK_DRIVERS;
    } catch (err) {
      return MOCK_DRIVERS;
    }
  },

  async saveDriver(driver: Driver): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driver),
      });
      return res.ok;
    } catch (err) {
      return false;
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
