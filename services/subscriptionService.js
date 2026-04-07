import { pool } from '../app.js';
export class SubscriptionService {
    /**
     * Process all tenants to check for expiration and generate new invoices
     */
    static async processSubscriptions() {
        console.log('⏳ Processing global subscriptions...');
        const now = new Date();
        try {
            // 1. Mark expired tenants
            await pool.query(`
        UPDATE tenants 
        SET status = 'suspended' 
        WHERE status = 'active' 
        AND subscription_expires_at < $1 
        AND auto_renew = false
      `, [now]);
            // 2. Identify tenants that need auto-renewal (expired but auto_renew = true)
            const toRenew = await pool.query(`
        SELECT t.*, p.monthly_price
        FROM tenants t
        JOIN plans p ON t.plan_id = p.id
        WHERE t.status = 'active'
        AND t.subscription_expires_at < $1
        AND t.auto_renew = true
      `, [now]);
            for (const tenant of toRenew.rows) {
                await this.renewTenant(tenant);
            }
            console.log(`✅ Subscription processing finished. Renewed ${toRenew.rows.length} tenants.`);
        }
        catch (err) {
            console.error('❌ Error processing subscriptions:', err);
        }
    }
    static async renewTenant(tenant) {
        const nextExpiration = new Date(tenant.subscription_expires_at);
        nextExpiration.setMonth(nextExpiration.getMonth() + 1);
        const invoiceId = `inv-saas-${Date.now()}-${tenant.id}`;
        try {
            await pool.query('BEGIN');
            // Create invoice
            await pool.query(`
        INSERT INTO invoices (id, tenant_id, plan_id, amount, status, billing_period_start, billing_period_end)
        VALUES ($1, $2, $3, $4, 'paid', $5, $6)
      `, [
                invoiceId,
                tenant.id,
                tenant.plan_id,
                tenant.monthly_price,
                tenant.subscription_expires_at,
                nextExpiration
            ]);
            // Update tenant
            await pool.query(`
        UPDATE tenants 
        SET subscription_expires_at = $1, last_billing_date = $2
        WHERE id = $3
      `, [nextExpiration, new Date(), tenant.id]);
            await pool.query('COMMIT');
            console.log(`💳 Auto-renewed tenant ${tenant.company_name} (Invoice: ${invoiceId})`);
        }
        catch (err) {
            await pool.query('ROLLBACK');
            console.error(`❌ Error renewing tenant ${tenant.id}:`, err);
        }
    }
    static async upgradePlan(tenantId, planId) {
        const planRes = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
        if (planRes.rows.length === 0)
            throw new Error('Plan not found');
        const plan = planRes.rows[0];
        const nextExpiration = new Date();
        nextExpiration.setMonth(nextExpiration.getMonth() + 1);
        await pool.query(`
      UPDATE tenants 
      SET plan_id = $1, 
          status = 'active', 
          subscription_expires_at = $2,
          last_billing_date = NOW()
      WHERE id = $3
    `, [planId, nextExpiration, tenantId]);
        return { success: true, plan: plan.name };
    }
}
