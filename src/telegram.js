import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import pg from 'pg';
import generatePrompt from './promptCreate.js';
//import chatGPT from './chatGPTApi.js';
import { chatGPT } from './chatGPTApi.js';


const { Pool } = pg;
dotenv.config();

// Настройка соединения с базой данных
const pool = new Pool({
    user: 'iuriinovosolov',
    host: 'localhost',
    database: 'messengercrm',
    password: '12345',
    port: 5432
});

// Инициализация Telegram бота
const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// Функция для добавления или поиска чата в базе данных
const getOrAddChat = async (telegramDialogId, firstName, lastName, messengerType = 'Telegram', campaignId, language) => {
    const client = await pool.connect();
    try {
        const existingChatRes = await client.query(
            'SELECT chatid FROM chats WHERE dialogid = $1 AND messenger_type = $2',
            [telegramDialogId, messengerType]
        );
        if (existingChatRes.rowCount > 0) {
            return existingChatRes.rows[0].chatid;
        }

        const result = await client.query(
            'INSERT INTO chats (dialogid, firstname, lastname, messenger_type, campaignid, chatstatus, language, creationdate, lastupdated) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING chatid',
            [telegramDialogId, firstName, lastName, messengerType, campaignId, 'need_action', language]
        );
        return result.rows[0].chatid;
    } catch (err) {
        console.error('Ошибка при добавлении/поиске чата:', err);
    } finally {
        client.release();
    }
};

// Функция для добавления сообщения в базу данных
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

// Обработчик команды /start
bot.onText(/\/start\s+(\w+)/, async (msg, match) => {
    const telegramDialogId = msg.chat.id.toString();
    const userLanguage = msg.from.language_code || 'unknown';
    const params = match[1];
    let campaignID;
    if (params) {
        [, campaignID] = params.split('_');
    }

    const client = await pool.connect();
    try {
        const campaignRes = await client.query('SELECT invitemessage FROM campaigns WHERE campaignid = $1', [campaignID]);
        const inviteMessage = campaignRes.rows[0]?.invitemessage || "Привет! Как я могу помочь вам сегодня?";

        const chatDbId = await getOrAddChat(telegramDialogId, msg.chat.first_name, msg.chat.last_name, 'Telegram', campaignID, userLanguage);

        bot.sendMessage(msg.chat.id, inviteMessage);

        if (chatDbId) {
            await addMessage(chatDbId, inviteMessage, "исходящее");
        }
    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        client.release();
    }
});

// Обработчик остальных сообщений
bot.on('message', async (msg) => {
    if (!msg.text.startsWith('/start')) {
        const telegramDialogId = msg.chat.id.toString();

        // Получение внутреннего chatId из базы данных
        const chatDbId = await getOrAddChat(telegramDialogId, msg.chat.first_name, msg.chat.last_name, 'Telegram', undefined, undefined);

        if (chatDbId) {
            await addMessage(chatDbId, msg.text, "входящее");

            const prompt = await generatePrompt(telegramDialogId, 'Telegram');
            const gptResponse = await chatGPT(prompt);

            bot.sendMessage(msg.chat.id, gptResponse);
        }
    }
});

console.log('Telegram бот запущен.');
