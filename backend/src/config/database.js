import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
};

const pool = new Pool(poolConfig);

// Manejador de errores del pool
pool.on('error', (err) => {
    console.error('Error inesperado del cliente del pool', err);
});

export const query = async (text, params) => {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } catch (err) {
        console.error('Error ejecutando consulta:', err);
        throw err;
    } finally {
        client.release();
    }
};

// Test de conexión con mejor manejo de errores
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Base de datos conectada exitosamente');
        return true;
    } catch (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return false;
    }
};

testConnection();
