exports.up = (pgm) => {
    pgm.addColumns('drivers', {
        license_number: { type: 'text' },
        license_expiry: { type: 'date' },
        license_status: { type: 'text', default: 'unverified' }, // valid, expired, unverified
        license_front_url: { type: 'text' },
        is_verified: { type: 'boolean', default: false },
        last_ocr_at: { type: 'timestamp' }
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('drivers', ['license_number', 'license_expiry', 'license_status', 'license_front_url', 'is_verified', 'last_ocr_at']);
};
