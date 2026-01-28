exports.up = (pgm) => {
  // Plans
  pgm.sql(`
    INSERT INTO plans (id, name, monthly_price, max_fleet_size, features, color) VALUES
    ('p1', 'Basic', 199, 15, '["Gestión de Inventario Digital"]', 'slate'),
    ('p2', 'Pro', 499, 100, '["IA Preventiva Gemini Lite"]', 'amber'),
    ('p3', 'Enterprise', 1299, 10000, '["Gemini AI Pro Estratégico"]', 'indigo');
  `);

  // Tenants
  pgm.sql(`
    INSERT INTO tenants (id, company_name, plan_id, status) VALUES
    ('t1', 'Aurum Leasing Demo', 'p3', 'active');
  `);

  // Users
  // Passwords are now hashed with bcrypt (salt rounds = 10)
  // admin123 -> $2b$10$1uqpApszxhY1gljz5ZtGxuZ.zhatIv0V6T5aBNR2l4pZ1IHEtEok2
  // 123456 -> $2b$10$GiqRyMyef9vwwFSjTgArGODoMqKQjD5zFiu2XoAQfsfis/x3ckwt6
  pgm.sql(`
    INSERT INTO users (email, password, role, tenant_id) VALUES
    ('root@aurumcapital.mx', '$2b$10$1uqpApszxhY1gljz5ZtGxuZ.zhatIv0V6T5aBNR2l4pZ1IHEtEok2', 'Super Admin', NULL),
    ('pro@aurum.mx', '$2b$10$GiqRyMyef9vwwFSjTgArGODoMqKQjD5zFiu2XoAQfsfis/x3ckwt6', 'Arrendador', 't1'),
    ('chofer@aurum.mx', '$2b$10$GiqRyMyef9vwwFSjTgArGODoMqKQjD5zFiu2XoAQfsfis/x3ckwt6', 'Arrendatario', 't1');
  `);

  // Drivers
  pgm.sql(`
    INSERT INTO drivers (id, name, phone, balance, tenant_id, rating) VALUES
    ('d1', 'Chofer Demo', '5512345678', 150, 't1', 4.8);
  `);

  // Vehicles
  pgm.sql(`
    INSERT INTO vehicles (id, plate, brand, model, year, status, tenant_id, driver_id) VALUES
    ('v1', 'ABC-1234', 'Toyota', 'Avanza', 2022, 'Activo', 't1', 'd1'),
    ('v2', 'XYZ-9876', 'Nissan', 'Versa', 2023, 'Disponible', 't1', NULL);
  `);
};

exports.down = (pgm) => {
  pgm.sql('DELETE FROM vehicles');
  pgm.sql('DELETE FROM drivers');
  pgm.sql('DELETE FROM users');
  pgm.sql('DELETE FROM tenants');
  pgm.sql('DELETE FROM plans');
};
