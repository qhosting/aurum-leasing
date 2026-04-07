const API_BASE = '/api';
// Helper to include credentials in all fetch calls
export const fetchWithAuth = async (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include' // Important for HttpOnly cookies
    });
};
export const persistenceService = {
    async login(email, password) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await res.json();
        }
        catch (err) {
            return { success: false, error: 'Error de red.' };
        }
    },
    async logout() {
        try {
            await fetchWithAuth(`${API_BASE}/auth/logout`, { method: 'POST' });
        }
        catch { /* ignore */ }
    },
    // NOTIFICATIONS PRODUCTION METHODS
    async getNotifications(role, userId) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/notifications?role=${role}&user_id=${userId}`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async markNotificationRead(id) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/notifications/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            return await res.json();
        }
        catch {
            return { success: false };
        }
    },
    async clearNotifications(role, userId) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/notifications/clear?role=${role}&user_id=${userId}`, {
                method: 'POST'
            });
            return await res.json();
        }
        catch {
            return { success: false };
        }
    },
    // Driver (Arrendatario) Methods
    async getDriverMe(driverId) {
        const res = await fetchWithAuth(`${API_BASE}/driver/me?id=${driverId}`);
        return await res.json();
    },
    async updateDriverProfile(driverId, data) {
        const res = await fetchWithAuth(`${API_BASE}/driver/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: driverId, data })
        });
        return await res.json();
    },
    async getDriverVehicle(driverId) {
        const res = await fetchWithAuth(`${API_BASE}/driver/vehicle?id=${driverId}`);
        return await res.json();
    },
    async getDriverPayments(driverId) {
        const res = await fetchWithAuth(`${API_BASE}/driver/payments?id=${driverId}`);
        return await res.json();
    },
    async reportDriverPayment(paymentData) {
        const res = await fetchWithAuth(`${API_BASE}/payments/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        return await res.json();
    },
    // Lessor (Arrendador) Methods
    async verifyPayment(paymentId, driverId, amount) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/payments/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_id: paymentId, driver_id: driverId, amount })
            });
            return await res.json();
        }
        catch {
            return { success: false };
        }
    },
    async getArrendadorStats(tenantId = 't1') {
        try {
            const res = await fetchWithAuth(`${API_BASE}/arrendador/stats?tenant_id=${tenantId}`);
            return await res.json();
        }
        catch {
            return null;
        }
    },
    async getArrendadorAnalytics() {
        try {
            const res = await fetchWithAuth(`${API_BASE}/arrendador/analytics`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async getVehicles(tenantId = 't1') {
        try {
            const res = await fetchWithAuth(`${API_BASE}/fleet?tenant_id=${tenantId}`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async saveVehicle(vehicle, tenantId = 't1') {
        try {
            const res = await fetchWithAuth(`${API_BASE}/fleet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...vehicle, tenant_id: tenantId })
            });
            return await res.json();
        }
        catch {
            return { error: 'Network error' };
        }
    },
    async getDrivers(tenantId = 't1') {
        try {
            const res = await fetchWithAuth(`${API_BASE}/drivers?tenant_id=${tenantId}`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async verifyLicense(driverId, file) {
        const formData = new FormData();
        formData.append('license', file);
        try {
            const res = await fetchWithAuth(`${API_BASE}/drivers/${driverId}/verify-license`, {
                method: 'POST',
                body: formData
            });
            return await res.json();
        }
        catch {
            return { success: false };
        }
    },
    // Maintenance Methods
    async logMaintenance(vehicleId, data) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/maintenance/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicle_id: vehicleId, ...data })
            });
            return await res.json();
        }
        catch {
            return { success: false };
        }
    },
    async getMaintenanceHistory(vehicleId) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/maintenance/history/${vehicleId}`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async getMaintenanceAlerts() {
        try {
            const res = await fetchWithAuth(`${API_BASE}/maintenance/alerts`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async getGlobalStats() {
        try {
            const res = await fetchWithAuth(`${API_BASE}/stats/visits`);
            return await res.json();
        }
        catch {
            return { visits: 0 };
        }
    },
    // Super Admin Methods
    async getSuperStats() {
        try {
            const res = await fetchWithAuth(`${API_BASE}/super/stats`);
            return await res.json();
        }
        catch {
            return null;
        }
    },
    async getSuperTenants() {
        try {
            const res = await fetchWithAuth(`${API_BASE}/super/tenants`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async getSuperPlans() {
        try {
            const res = await fetchWithAuth(`${API_BASE}/super/plans`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    // Subscription Methods
    async getInvoices(tenantId) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/tenants/${tenantId}/invoices`);
            return await res.json();
        }
        catch {
            return [];
        }
    },
    async upgradePlan(tenantId, planId) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/tenants/${tenantId}/plan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId })
            });
            return await res.json();
        }
        catch {
            return { success: false };
        }
    },
    async getTenantDetails(tenantId) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/tenants/${tenantId}`);
            return await res.json();
        }
        catch {
            return null;
        }
    },
    // --- Transport Unit Specialized Methods ---
    async extractTransportData(files) {
        const formData = new FormData();
        files.forEach(file => formData.append('docs', file));
        try {
            const res = await fetchWithAuth(`${API_BASE}/ai/extract-unit`, {
                method: 'POST',
                body: formData
            });
            return await res.json();
        }
        catch {
            return { error: 'Error al conectar con el servicio de IA' };
        }
    },
    async saveTransportUnit(data) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/fleet/transportista`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        }
        catch {
            return { error: 'Error al dar de alta la unidad' };
        }
    },
    async getTransportUnitDetail(id) {
        try {
            const res = await fetchWithAuth(`${API_BASE}/fleet/${id}`);
            return await res.json();
        }
        catch {
            return null;
        }
    }
};
