
import { app } from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';
import migrate from 'node-pg-migrate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 80;
const DATABASE_URL = process.env.DATABASE_URL;

const runMigrations = async () => {
  if (!DATABASE_URL) {
    console.warn('Skipping migrations: DATABASE_URL not set.');
    return;
  }
  console.log('📦 Aurum System: Sincronizando Esquema Maestro via node-pg-migrate...');
  try {
    const migrationRunner = (migrate as any).default || migrate;
    
    await migrationRunner({
      databaseUrl: DATABASE_URL,
      dir: path.join(__dirname, 'migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
      verbose: true
    });
    console.log('✅ Aurum System: DB Sincronizada con éxito.');
  } catch (err: any) {
    console.error('❌ Aurum System Migration Error:', err.message);
    if (process.env.NODE_ENV === 'production') (process as any).exit(1);
  }
};

runMigrations().then(() => app.listen(port, () => console.log(`🚀 Aurum Cloud Active on Port ${port}`)));
