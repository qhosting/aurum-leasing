exports.up = (pgm) => {
    // Indexes for foreign keys to speed up joins and filtered lookups
    pgm.createIndex('users', 'tenant_id');

    pgm.createIndex('drivers', 'tenant_id');

    pgm.createIndex('vehicles', 'tenant_id');
    pgm.createIndex('vehicles', 'driver_id');

    pgm.createIndex('payments', 'tenant_id');
    pgm.createIndex('payments', 'driver_id');
    pgm.createIndex('payments', 'status');

    // Compound index for notifications which are queried by role/user AND read status
    pgm.createIndex('notifications', ['user_id', 'read']);
    pgm.createIndex('notifications', ['role_target', 'read']);

    // Index for date-based reporting (future-proofing)
    pgm.createIndex('payments', 'created_at');
};

exports.down = (pgm) => {
    pgm.dropIndex('payments', 'created_at');
    pgm.dropIndex('notifications', ['role_target', 'read']);
    pgm.dropIndex('notifications', ['user_id', 'read']);
    pgm.dropIndex('payments', 'status');
    pgm.dropIndex('payments', 'driver_id');
    pgm.dropIndex('payments', 'tenant_id');
    pgm.dropIndex('vehicles', 'driver_id');
    pgm.dropIndex('vehicles', 'tenant_id');
    pgm.dropIndex('drivers', 'tenant_id');
    pgm.dropIndex('users', 'tenant_id');
};
