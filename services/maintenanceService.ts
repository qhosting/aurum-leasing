
import { Pool } from 'pg';
import { AuditLogger, AuditAction } from './auditService.js';

export class MaintenanceService {
    private static pool: Pool;

    static setPool(pool: Pool) {
        this.pool = pool;
    }

    static async logMaintenance(vehicleId: string, data: {
        type: string;
        description: string;
        cost: number;
        mileage: number;
        performed_by?: string;
        next_maintenance_km?: number;
    }) {
        try {
            await this.pool.query('BEGIN');

            // 1. Insert into logs
            await this.pool.query(`
        INSERT INTO maintenance_logs (vehicle_id, type, description, cost, mileage, performed_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vehicleId, data.type, data.description, data.cost, data.mileage, data.performed_by]);

            // 2. Update vehicle status
            const nextKm = data.next_maintenance_km || (data.mileage + 10000); // Default 10k km
            await this.pool.query(`
        UPDATE vehicles 
        SET mileage = $1, 
            last_maintenance_km = $2, 
            next_maintenance_km = $3, 
            last_maintenance_date = NOW(),
            status = 'Activo'
        WHERE id = $4
      `, [data.mileage, data.mileage, nextKm, vehicleId]);

            await this.pool.query('COMMIT');

            return { success: true };
        } catch (e) {
            await this.pool.query('ROLLBACK');
            throw e;
        }
    }

    static async checkMaintenanceAlerts(tenantId: string) {
        // Returns vehicles that are close to maintenance (e.g., within 1000km)
        const r = await this.pool.query(`
      SELECT * FROM vehicles 
      WHERE tenant_id = $1 
      AND (next_maintenance_km - mileage) < 1000
    `, [tenantId]);
        return r.rows;
    }

    static async updateMileage(vehicleId: string, newMileage: number) {
        await this.pool.query('UPDATE vehicles SET mileage = $1 WHERE id = $2', [newMileage, vehicleId]);

        // Check if we should notify
        const res = await this.pool.query('SELECT next_maintenance_km, tenant_id FROM vehicles WHERE id = $1', [vehicleId]);
        const vehicle = res.rows[0];

        if (vehicle && (vehicle.next_maintenance_km - newMileage) < 500) {
            // Create a notification for the lessor
            await this.pool.query(`
        INSERT INTO notifications (id, role_target, title, message, type)
        VALUES ($1, $2, $3, $4, $5)
      `, [`maint-alert-${vehicleId}-${Date.now()}`, 'Arrendador', 'Alerta de Mantenimiento', `El vehículo ${vehicleId} está a menos de 500km del mantenimiento.`, 'maintenance']);
        }
    }
}
