exports.up = (pgm) => {
  pgm.createTable('plans', {
    id: { type: 'text', primaryKey: true },
    name: { type: 'text', notNull: true },
    monthly_price: { type: 'numeric', notNull: true },
    max_fleet_size: { type: 'integer' },
    features: { type: 'jsonb' },
    color: { type: 'text' }
  });

  pgm.createTable('tenants', {
    id: { type: 'text', primaryKey: true },
    company_name: { type: 'text', notNull: true },
    plan_id: { type: 'text', references: 'plans', onDelete: 'SET NULL' },
    status: { type: 'text', default: 'active' },
    integration_settings: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('users', {
    id: { type: 'serial', primaryKey: true },
    email: { type: 'text', notNull: true, unique: true },
    password: { type: 'text', notNull: true },
    role: { type: 'text', notNull: true },
    tenant_id: { type: 'text', references: 'tenants', onDelete: 'CASCADE' },
    data: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('drivers', {
    id: { type: 'text', primaryKey: true },
    name: { type: 'text', notNull: true },
    phone: { type: 'text' },
    balance: { type: 'numeric', default: 0 },
    tenant_id: { type: 'text', references: 'tenants', onDelete: 'CASCADE' },
    last_payment_date: { type: 'timestamp' },
    rating: { type: 'numeric', default: 5.0 },
    contract_date: { type: 'timestamp' },
    data: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('vehicles', {
    id: { type: 'text', primaryKey: true },
    plate: { type: 'text', unique: true },
    brand: { type: 'text' },
    model: { type: 'text' },
    year: { type: 'integer' },
    status: { type: 'text', default: 'Activo' },
    tenant_id: { type: 'text', references: 'tenants', onDelete: 'CASCADE' },
    driver_id: { type: 'text', references: 'drivers', onDelete: 'SET NULL' },
    data: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('payments', {
    id: { type: 'text', primaryKey: true },
    driver_id: { type: 'text', references: 'drivers', onDelete: 'CASCADE' },
    tenant_id: { type: 'text', references: 'tenants', onDelete: 'CASCADE' },
    amount: { type: 'numeric', notNull: true },
    type: { type: 'text', notNull: true },
    status: { type: 'text', default: 'pending' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  pgm.createTable('notifications', {
    id: { type: 'text', primaryKey: true },
    role_target: { type: 'text' },
    user_id: { type: 'text' },
    title: { type: 'text', notNull: true },
    message: { type: 'text' },
    type: { type: 'text' },
    read: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('notifications');
  pgm.dropTable('payments');
  pgm.dropTable('vehicles');
  pgm.dropTable('drivers');
  pgm.dropTable('users');
  pgm.dropTable('tenants');
  pgm.dropTable('plans');
};
