import { Client as NotionClient } from '@notionhq/client';
import 'dotenv/config';

// Инициализация клиента Notion с использованием ключа аутентификации
const notion = new NotionClient({
  auth: process.env.NOTION_KEY,
});

// Асинхронная функция для создания новой страницы в базе данных Notion
export async function create(short, text, authorName) {
  // Создание страницы в базе данных Notion
  const dbResponse = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DB_ID },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: short,
            },
          },
        ],
      },
      Date: {
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });

  // Сконструировать текст с добавлением активной ссылки
  const fullText = [
    {
      type: 'text',
      text: {
        content: text + "\n\n",
      },
    },
    {
      type: 'text',
      text: {
        content: 'Зроблено за допомогою ',
      },
    },
    {
      type: 'text',
      text: {
        content: '@Sorobankazkabot',
        link: {
          url: 'https://t.me/Sorobankazkabot',
        },
      },
    },
    {
      type: 'text',
      text: {
        content: '\nАвтор: ' + authorName,
      },
    },
  ];

  // Добавление блока текста на созданную страницу с активной ссылкой
  await notion.blocks.children.append({
    block_id: dbResponse.id,
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: fullText,
        },
      },
    ],
  });

  // Формирование и возврат URL созданной страницы
  const pageUrl = `https://www.notion.so/${dbResponse.id.replace(/-/g, '')}`;
  return { id: dbResponse.id, url: pageUrl };
}
