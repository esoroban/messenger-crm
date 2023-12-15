import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'iuriinovosolov',
    host: 'localhost',
    database: 'messengercrm',
    password: '12345',
    port: 5432
});

const truncateTables = async () => {
    const client = await pool.connect();
    try {
        const tablesRes = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
        );
        const tables = tablesRes.rows.map(row => row.table_name);

        for (const table of tables) {
            await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
            console.log(`Таблица ${table} очищена.`);
        }
    } catch (err) {
        console.error('Ошибка при очистке таблиц:', err);
    } finally {
        client.release();
    }
};

truncateTables().then(() => {
    pool.end();
});
