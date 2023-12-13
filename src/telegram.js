import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const TOKEN = process.env.TELEGRAM_TOKEN;
const pool = new Pool({
    user: 'iuriinovosolov',
    host: 'localhost',
    database: 'messengercrm',
    password: '12345',
    port: 5432
});

const bot = new TelegramBot(TOKEN, { polling: true });

const addChat = async (dialogId, firstName, lastName, messengerType, campaignId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO chats (dialogid, firstname, lastname, messenger_type, campaignid, creationdate, lastupdated) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING chatid',
            [dialogId, firstName, lastName, messengerType, campaignId]
        );
        return result.rows[0].chatid;
    } catch (err) {
        console.error('Ошибка при добавлении чата:', err);
    } finally {
        client.release();
    }
};

const addMessage = async (chatId, messageContent, messageType) => {
    const client = await pool.connect();
    try {
        await client.query(
            'INSERT INTO messages (chatid, timestamp, messagecontent, messagetype) VALUES ($1, CURRENT_TIMESTAMP, $2, $3)',
            [chatId, messageContent, messageType]
        );
    } catch (err) {
        console.error('Ошибка при добавлении сообщения:', err);
    } finally {
        client.release();
    }
};

bot.onText(/\/start\s+(\w+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const params = match[1];
    let campaignID;
    if (params) {
        [, campaignID] = params.split('_');
    }

    const client = await pool.connect();
    try {
        const campaignRes = await client.query('SELECT invitemessage FROM campaigns WHERE campaignid = $1', [campaignID]);
        const inviteMessage = campaignRes.rows[0]?.invitemessage || "Привет! Как я могу помочь вам сегодня?";

        const chatDbId = await addChat(chatId.toString(), msg.chat.first_name, msg.chat.last_name, 'Telegram', campaignID);

        bot.sendMessage(chatId, inviteMessage);

        if (chatDbId) {
            await addMessage(chatDbId, inviteMessage, "исходящее");
        }
    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        client.release();
    }
});

bot.on('message', async (msg) => {
    if (!msg.text.startsWith('/start')) {
        const chatId = msg.chat.id;
        // Предположим, что chatDbId уже известен. В реальном сценарии вам нужно будет его определить.
        const chatDbId = 1; // Здесь необходимо добавить логику для определения chatDbId.
        
        if (chatDbId) {
            await addMessage(chatDbId, msg.text, "входящее");
        }
    }
});

console.log('Telegram бот запущен.');
