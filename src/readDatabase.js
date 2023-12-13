import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'iuriinovosolov',
    host: 'localhost',
    database: 'messengercrm',
    password: '12345',
    port: 5432
});

const getTableData = async () => {
    const client = await pool.connect();
    try {
        // Получаем список всех таблиц
        const tablesRes = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
        );
        const tables = tablesRes.rows.map(row => row.table_name);

        // Для каждой таблицы получаем структуру и первые пять строк данных
        for (const table of tables) {
            console.log(`\nСтруктура таблицы: ${table}`);
            const structureRes = await client.query(
                "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1;",
                [table]
            );
            structureRes.rows.forEach(row => {
                console.log(`- ${row.column_name} (${row.data_type}), Nullable: ${row.is_nullable}`);
            });

            console.log(`\nПервые пять строк из таблицы: ${table}`);
            const dataRes = await client.query(`SELECT * FROM ${table} LIMIT 5;`);
            console.log(dataRes.rows);
        }
    } catch (err) {
        console.error('Ошибка при получении данных из таблиц:', err);
    } finally {
        client.release();
    }
};

getTableData().then(() => {
    pool.end();
});
