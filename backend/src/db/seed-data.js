require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    // Удалить тестовые блюда с кривой кодировкой
    await client.query("DELETE FROM menu_items");

    // Добавить тестовые блюда
    const items = [
      { cat: 1, name: 'Борщ', desc: 'Классический борщ со сметаной и чесноком', price: 250, weight: 350, cal: 180 },
      { cat: 1, name: 'Щи', desc: 'Щи из свежей капусты', price: 200, weight: 300, cal: 150 },
      { cat: 1, name: 'Суп харчо', desc: 'Острый суп с рисом и говядиной', price: 280, weight: 300, cal: 200 },
      { cat: 2, name: 'Котлета по-киевски', desc: 'Куриная котлета с маслом внутри', price: 320, weight: 200, cal: 380 },
      { cat: 2, name: 'Плов', desc: 'Узбекский плов с бараниной и морковью', price: 350, weight: 300, cal: 420 },
      { cat: 2, name: 'Гречка с тушёнкой', desc: 'Рассыпчатая гречка с говяжьей тушёнкой', price: 220, weight: 250, cal: 310 },
      { cat: 2, name: 'Картофельное пюре с сосисками', desc: 'Пюре на молоке с 2 сосисками', price: 190, weight: 280, cal: 340 },
      { cat: 3, name: 'Оливье', desc: 'Классический салат оливье', price: 150, weight: 150, cal: 220 },
      { cat: 3, name: 'Цезарь с курицей', desc: 'Салат цезарь с гренками и пармезаном', price: 280, weight: 200, cal: 280 },
      { cat: 3, name: 'Греческий салат', desc: 'Свежие овощи с сыром фета и маслинами', price: 230, weight: 180, cal: 160 },
      { cat: 4, name: 'Медовик', desc: 'Домашний медовый торт со сметанным кремом', price: 180, weight: 150, cal: 420 },
      { cat: 4, name: 'Шоколадный брауни', desc: 'Насыщенный шоколадный десерт', price: 150, weight: 100, cal: 380 },
      { cat: 5, name: 'Компот из сухофруктов', desc: 'Натуральный домашний компот', price: 80, weight: 300, cal: 90 },
      { cat: 5, name: 'Кисель клюквенный', desc: 'Кисель из натуральной клюквы', price: 70, weight: 300, cal: 80 },
    ];

    for (const item of items) {
      await client.query(
        `INSERT INTO menu_items (category_id, name, description, price, weight_grams, calories)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.cat, item.name, item.desc, item.price, item.weight, item.cal]
      );
    }

    const { rows } = await client.query('SELECT COUNT(*) FROM menu_items');
    console.log(`Добавлено ${rows[0].count} блюд`);
  } catch (err) {
    console.error('Ошибка:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
