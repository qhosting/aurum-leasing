
exports.up = (pgm) => {
  pgm.createTable('system_config', {
    key: { type: 'varchar(100)', notNull: true, primaryKey: true },
    value: { type: 'text', notNull: true },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Seed initial WhatsApp contact number
  pgm.sql("INSERT INTO system_config (key, value) VALUES ('saas_contact_whatsapp', '5215555555555')");
};

exports.down = (pgm) => {
  pgm.dropTable('system_config');
};
