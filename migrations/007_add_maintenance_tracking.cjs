exports.up = (pgm) => {
    pgm.addColumns('vehicles', {
        mileage: { type: 'integer', default: 0 },
        last_maintenance_km: { type: 'integer', default: 0 },
        next_maintenance_km: { type: 'integer', default: 0 },
        last_maintenance_date: { type: 'date' },
        insurance_expiry: { type: 'date' },
        verification_expiry: { type: 'date' }
    });

    pgm.createTable('maintenance_logs', {
        id: { type: 'serial', primaryKey: true },
        vehicle_id: { type: 'text', references: 'vehicles', onDelete: 'CASCADE' },
        date: { type: 'timestamp', default: pgm.func('current_timestamp') },
        type: { type: 'text', notNull: true }, // Preventivo, Correctivo
        description: { type: 'text' },
        cost: { type: 'numeric', default: 0 },
        mileage: { type: 'integer' },
        performed_by: { type: 'text' }
    });
};

exports.down = (pgm) => {
    pgm.dropTable('maintenance_logs');
    pgm.dropColumns('vehicles', [
        'mileage',
        'last_maintenance_km',
        'next_maintenance_km',
        'last_maintenance_date',
        'insurance_expiry',
        'verification_expiry'
    ]);
};
