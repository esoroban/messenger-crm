import OpenAI from 'openai';
import 'dotenv/config';

const CHATGPT_MODEL = 'gpt-3.5-turbo';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export async function chatGPT(prompt) {
  const messages = [
    {
      role: 'system',
      content: 'Ты - чат-бот, созданный для ответа на вопросы пользователей. Твои ответы должны быть корректными, информативными и дружелюбными.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      messages,
      model: CHATGPT_MODEL,
    });

    return completion.choices[0].message.content;
  } catch (e) {
    console.error('Error while chat completion:', e.message);
    return null;
  }
}
