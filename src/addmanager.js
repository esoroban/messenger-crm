import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'iuriinovosolov',
    host: 'localhost',
    database: 'messengercrm',
    password: '12345',
    port: 5432
});

const addManager = async (managerName, contactInfo, googleID) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO Managers (ManagerName, ContactInfo, GoogleID) VALUES ($1, $2, $3) RETURNING *',
            [managerName, contactInfo, googleID]
        );
        console.log('Новый менеджер добавлен:', result.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

addManager('Оля Рашевская', 'Днепр Сити Коммунар ', 'GoogleID123456789');
pool.end();
