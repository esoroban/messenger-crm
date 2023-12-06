import OpenAI from 'openai';
import 'dotenv/config';

const CHATGPT_MODEL = 'gpt-3.5-turbo';

const ROLES = {
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  USER: 'user',
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const getMessage = (m) => `
Напиши україньскою мовою на основі цих повідомлень послідовну пізнавальну казку: ${m}
Багато тексту не потрібно - максимум 200 слів.`

export async function chatGPT(message = '') {
  const messages = [
    {
      role: ROLES.SYSTEM,
      content:
        'Ти - літній дід Соробан із Японії, який має мудрість та любить складати цікаві історії...ы опытный копирайтер, который пишет краткие эмоциональные статьи для соц сетей.',
    },
    { role: ROLES.USER, content: getMessage(message) },
  ]
  try {
    const completion = await openai.chat.completions.create({
      messages,
      model: CHATGPT_MODEL,
    });

    return completion.choices[0].message;
  } catch (e) {
    console.error('Error while chat completion', e.message);
  }
}
