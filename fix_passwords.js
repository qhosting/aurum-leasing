import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL variable de entorno no encontrada.');
    process.exit(1);
}

async function fixPasswords() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        console.log('Sincronizando base de datos...');

        // Hashes correctos
        // admin123 -> $2b$10$1uqpApszxhY1gljz5ZtGxuZ.zhatIv0V6T5aBNR2l4pZ1IHEtEok2
        // 123456 -> $2b$10$GiqRyMyef9vwwFSjTgArGODoMqKQjD5zFiu2XoAQfsfis/x3ckwt6

        // 1. Asegurar que los hashes son correctos (bcrypt)
        await pool.query("UPDATE users SET password = '$2b$10$GiqRyMyef9vwwFSjTgArGODoMqKQjD5zFiu2XoAQfsfis/x3ckwt6' WHERE email = 'pro@aurum.mx'");
        await pool.query("UPDATE users SET password = '$2b$10$GiqRyMyef9vwwFSjTgArGODoMqKQjD5zFiu2XoAQfsfis/x3ckwt6' WHERE email = 'chofer@aurum.mx'");
        await pool.query("UPDATE users SET password = '$2b$10$GiqRyMyef9vwwFSjTgArGODoMqKQjD5zFiu2XoAQfsfis/x3ckwt6' WHERE email = 'admin@aurum.mx'");

        // 2. Corregir roles
        await pool.query("UPDATE users SET role = 'Super Admin' WHERE email = 'admin@aurum.mx'");

        // 3. Crear root si no existe (con ID manual ya que la DB remota no usa serial)
        const rootCheck = await pool.query("SELECT * FROM users WHERE email = 'root@aurumcapital.mx'");
        if (rootCheck.rows.length === 0) {
            await pool.query("INSERT INTO users (id, email, password, role) VALUES ('u-root', 'root@aurumcapital.mx', '$2b$10$1uqpApszxhY1gljz5ZtGxuZ.zhatIv0V6T5aBNR2l4pZ1IHEtEok2', 'Super Admin')");
            console.log('✅ Usuario root@aurumcapital.mx creado.');
        } else {
            await pool.query("UPDATE users SET password = '$2b$10$1uqpApszxhY1gljz5ZtGxuZ.zhatIv0V6T5aBNR2l4pZ1IHEtEok2' WHERE email = 'root@aurumcapital.mx'");
        }

        console.log('✅ Base de datos sincronizada correctamente.');
    } catch (err) {
        console.error('❌ Error sincronizando DB:', err);
    } finally {
        await pool.end();
    }
}

fixPasswords();
