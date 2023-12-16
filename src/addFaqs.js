import pg from 'pg';
import fs from 'fs';
import csv from 'csv-parser';

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
        console.log(`Добавление FAQ: Вопрос - ${question}, Ответ - ${answer}`);
        const result = await client.query(
            'INSERT INTO CampaignFAQs (CampaignID, Question, Answer) VALUES ($1, $2, $3) RETURNING *',
            [campaignID, question, answer]
        );
        console.log('FAQ добавлен:', result.rows[0]);
    } catch (err) {
        console.error('Ошибка при добавлении FAQ:', err);
    } finally {
        client.release();
    }
};

const importFaqs = async (campaignID) => {
    const results = [];
    return new Promise((resolve, reject) => {
        console.log(`Чтение данных из файла: faq/qa_${campaignID}.csv`);
        fs.createReadStream(`faq/qa_${campaignID}.csv`)
            .pipe(csv())
            .on('data', (data) => {
                console.log('Прочитанная строка:', data);
                results.push(data);
            })
            .on('end', () => {
                console.log('Чтение файла завершено');
                resolve(results);
            })
            .on('error', (err) => {
                console.error('Ошибка при чтении CSV файла:', err);
                reject(err);
            });
    });
};

const displayFaqs = async (campaignID) => {
    const client = await pool.connect();
    try {
        console.log(`Получение FAQ из базы данных для кампании ${campaignID}`);
        const result = await client.query(
            'SELECT * FROM CampaignFAQs WHERE CampaignID = $1',
            [campaignID]
        );
        console.log(`Все FAQ для кампании ${campaignID}:`);
        result.rows.forEach(faq => {
            console.log(`Вопрос: ${faq.question}, Ответ: ${faq.answer}`);
        });
    } catch (err) {
        console.error('Ошибка при выводе FAQ:', err);
    } finally {
        client.release();
    }
};

const main = async () => {
    const campaignID = 1;
    const faqs = await importFaqs(campaignID);
    for (const faq of faqs) {
        // Используем правильные имена полей
        await addFaq(campaignID, faq.Question, faq.Answer);
    }
    await displayFaqs(campaignID);
    pool.end();
};

main();
