exports.up = (pgm) => {
    // Add Transportista specific fields to drivers
    pgm.addColumns('drivers', {
        rfc: { type: 'text' },
        zip_code: { type: 'text' }
    });

    // Add Transportista specific fields to vehicles
    pgm.addColumns('vehicles', {
        unit_type: { type: 'text', default: 'standard' }, // standard, transportista
        color: { type: 'text' },
        sct_permit: { type: 'text' },
        insurance_policy: { type: 'text' },
        insurance_company: { type: 'text' },
        trailer_plate: { type: 'text' }
    });

    // New table for document backups
    pgm.createTable('documents', {
        id: { type: 'text', primaryKey: true },
        entity_type: { type: 'text', notNull: true }, // 'vehicle' or 'driver'
        entity_id: { type: 'text', notNull: true },
        doc_type: { type: 'text', notNull: true }, // 'license', 'sct_permit', 'insurance', etc.
        file_path: { type: 'text', notNull: true },
        original_name: { type: 'text' },
        created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
    });

    // Add indexes for faster document lookups
    pgm.createIndex('documents', ['entity_type', 'entity_id']);
};

exports.down = (pgm) => {
    pgm.dropTable('documents');
    pgm.dropColumns('vehicles', ['unit_type', 'color', 'sct_permit', 'insurance_policy', 'insurance_company', 'trailer_plate']);
    pgm.dropColumns('drivers', ['rfc', 'zip_code']);
};
