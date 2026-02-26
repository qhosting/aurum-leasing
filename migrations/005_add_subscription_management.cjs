exports.up = (pgm) => {
    // Add subscription columns to tenants
    pgm.addColumns('tenants', {
        subscription_expires_at: { type: 'timestamp' },
        billing_cycle: { type: 'text', default: 'monthly' },
        auto_renew: { type: 'boolean', default: true },
        last_billing_date: { type: 'timestamp' },
    });

    // Create SaaS Invoices table (for billing tenants)
    pgm.createTable('invoices', {
        id: { type: 'text', primaryKey: true },
        tenant_id: { type: 'text', references: 'tenants', onDelete: 'CASCADE', notNull: true },
        plan_id: { type: 'text', references: 'plans', onDelete: 'SET NULL' },
        amount: { type: 'numeric', notNull: true },
        status: { type: 'text', default: 'pending' }, // paid, pending, failed, cancelled
        billing_period_start: { type: 'timestamp' },
        billing_period_end: { type: 'timestamp' },
        created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        paid_at: { type: 'timestamp' }
    });

    pgm.createIndex('invoices', 'tenant_id');
    pgm.createIndex('invoices', 'status');
};

exports.down = (pgm) => {
    pgm.dropTable('invoices');
    pgm.dropColumns('tenants', ['subscription_expires_at', 'billing_cycle', 'auto_renew', 'last_billing_date']);
};
