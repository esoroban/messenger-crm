import pg from 'pg';
const { Pool } = pg;

const initializeDbConnection = () => {
    return new Pool({
        user: 'iuriinovosolov',
        host: 'localhost',
        database: 'messengercrm',
        password: '12345',
        port: 5432
    });
};

const pool = initializeDbConnection();

const addCampaign = async (managerId, campaignName, utmParameters, role, inviteMessage) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO Campaigns (ManagerID, CampaignName, UTM_Parameters, Role, InviteMessage) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [managerId, campaignName, utmParameters, role, inviteMessage]
        );
        console.log('Новая рекламная компания добавлена:', result.rows[0]);
        return result.rows[0];
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

const createTelegramLink = (managerID, campaignID) => {
    const baseUrl = 'https://t.me/testsorobot';
    const startParameter = `${managerID}_${campaignID}`;
    return `${baseUrl}?start=${startParameter}`;
};

const main = async () => {
    // Пример использования: предположим, что ID менеджера равен 1
    const managerId = 1;
    const campaign = await addCampaign(managerId, 'Первая рекламная компания', 'ads_1', `Role: Soroban School Assistant. Purpose: Provide comprehensive answers to inquiries related to the Soroban school, using a predefined list of questions and answers. Operation: Respond directly to the user's latest question without explicitly stating "Question-Answer". The response will be based on the relevant information from the question-answer list. The assistant will not preface responses with "Question" or "Answer", ensuring a natural and direct communication style.`, 'Привіт, Чім я можу допомогти?');
    if (campaign) {
        const telegramLink = createTelegramLink(managerId, campaign.campaignid);
        console.log('Ссылка на Telegram:', telegramLink);
    }
    pool.end();
};

main();
