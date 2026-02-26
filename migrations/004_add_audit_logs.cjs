exports.up = (pgm) => {
    pgm.createTable('audit_logs', {
        id: 'id', // serial primary key
        user_id: { type: 'text' },
        email: { type: 'text' },
        action: { type: 'text', notNull: true },
        details: { type: 'jsonb' },
        ip_address: { type: 'text' },
        user_agent: { type: 'text' },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.createIndex('audit_logs', 'action');
    pgm.createIndex('audit_logs', 'created_at');
    pgm.createIndex('audit_logs', 'email');
};

exports.down = (pgm) => {
    pgm.dropTable('audit_logs');
};
