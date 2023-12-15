import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'iuriinovosolov',
    host: 'localhost',
    database: 'messengercrm',
    password: '12345',
    port: 5432
});

const generatePrompt = async (dialogId, messengerType) => {
    const client = await pool.connect();
    try {
        const campaignRes = await client.query(
            'SELECT c.role, ch.language FROM campaigns c JOIN chats ch ON c.campaignid = ch.campaignid WHERE ch.dialogid = $1 AND ch.messenger_type = $2',
            [dialogId, messengerType]
        );
        const role = campaignRes.rows[0]?.role || '';
        const language = campaignRes.rows[0]?.language || 'unknown';

        let prompt = `Role: ${role}\n\n`;

        prompt += "Here are samples for question-answers:\n";

        const faqRes = await client.query(
            'SELECT question, answer FROM campaignfaqs WHERE campaignid IN (SELECT campaignid FROM chats WHERE dialogid = $1 AND messenger_type = $2)',
            [dialogId, messengerType]
        );

        faqRes.rows.forEach(faq => {
            prompt += `Question: ${faq.question}\nAnswer: ${faq.answer}\n`;
        });

        prompt += "\nPlease answer in language: " + language;

        return prompt;
    } catch (err) {
        console.error('Ошибка:', err);
        return '';
    } finally {
        client.release();
    }
};

export default generatePrompt;

// Пример вызова функции с данными по умолчанию
const dialogId = '168247963'; // Замените на нужный dialogId
const messengerType = 'Telegram'; // Замените на нужный тип мессенджера

generatePrompt(dialogId, messengerType).then(prompt => {
    console.log(prompt);
});
