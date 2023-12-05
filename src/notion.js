import { Client as NotionClient } from '@notionhq/client';
import config from 'config';

// Инициализация клиента Notion с использованием ключа аутентификации
const notion = new NotionClient({
  auth: config.get('NOTION_KEY'),
});

// Асинхронная функция для создания новой страницы в базе данных Notion
export async function create(short, text) {
  // Создание страницы в базе данных Notion
  const dbResponse = await notion.pages.create({
    parent: { database_id: config.get('NOTION_DB_ID') },
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

  // Добавление блока текста на созданную страницу
  await notion.blocks.children.append({
    block_id: dbResponse.id,
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: text,
              },
            },
          ],
        },
      },
    ],
  });

  // Формирование и возврат URL созданной страницы
  const pageUrl = `https://www.notion.so/${dbResponse.id.replace(/-/g, '')}`;
  return { id: dbResponse.id, url: pageUrl };
}
