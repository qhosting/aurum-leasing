import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL variable de entorno no encontrada.');
    process.exit(1);
}

async function checkUsers() {
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const res = await pool.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Users Table Structure:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

checkUsers();
