import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgres://postgres:57c52e388e393eb0b74f@cloud.qhosting.net:1087/aurum-leasing-db?sslmode=disable";

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
