import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'iuriinovosolov',
    host: 'localhost',
    database: 'messengercrm',
    password: '12345',
    port: 5432
});

const addFaq = async (campaignID, question, answer) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO CampaignFAQs (CampaignID, Question, Answer) VALUES ($1, $2, $3) RETURNING *',
            [campaignID, question, answer]
        );
        console.log('FAQ добавлен:', result.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

const main = async () => {
    const campaignID = 1; // Предполагаем, что ID первой рекламной кампании равен 1
    for (let i = 0; i < 10; i++) {
        await addFaq(campaignID, `Вопрос${i}`, `Ответ${i}`);
    }
    pool.end();
};

main();
