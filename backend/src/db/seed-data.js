require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const credentials = require('./credentials');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MENU_ITEMS = [
  { cat: 'Первые блюда',  name: 'Борщ',                        desc: 'Классический борщ со сметаной и чесноком',     price: 250, weight: 350, cal: 180 },
  { cat: 'Первые блюда',  name: 'Щи',                          desc: 'Щи из свежей капусты',                         price: 200, weight: 300, cal: 150 },
  { cat: 'Первые блюда',  name: 'Суп харчо',                   desc: 'Острый суп с рисом и говядиной',               price: 280, weight: 300, cal: 200 },
  { cat: 'Вторые блюда',  name: 'Котлета по-киевски',          desc: 'Куриная котлета с маслом внутри',              price: 320, weight: 200, cal: 380 },
  { cat: 'Вторые блюда',  name: 'Плов',                        desc: 'Узбекский плов с бараниной и морковью',        price: 350, weight: 300, cal: 420 },
  { cat: 'Вторые блюда',  name: 'Гречка с тушёнкой',           desc: 'Рассыпчатая гречка с говяжьей тушёнкой',      price: 220, weight: 250, cal: 310 },
  { cat: 'Вторые блюда',  name: 'Картофельное пюре с сосисками', desc: 'Пюре на молоке с 2 сосисками',             price: 190, weight: 280, cal: 340 },
  { cat: 'Салаты',        name: 'Оливье',                      desc: 'Классический салат оливье',                    price: 150, weight: 150, cal: 220 },
  { cat: 'Салаты',        name: 'Цезарь с курицей',            desc: 'Салат цезарь с гренками и пармезаном',         price: 280, weight: 200, cal: 280 },
  { cat: 'Салаты',        name: 'Греческий салат',             desc: 'Свежие овощи с сыром фета и маслинами',        price: 230, weight: 180, cal: 160 },
  { cat: 'Десерты',       name: 'Медовик',                     desc: 'Домашний медовый торт со сметанным кремом',    price: 180, weight: 150, cal: 420 },
  { cat: 'Десерты',       name: 'Шоколадный брауни',           desc: 'Насыщенный шоколадный десерт',                 price: 150, weight: 100, cal: 380 },
  { cat: 'Напитки',       name: 'Компот из сухофруктов',       desc: 'Натуральный домашний компот',                  price: 80,  weight: 300, cal: 90  },
  { cat: 'Напитки',       name: 'Кисель клюквенный',           desc: 'Кисель из натуральной клюквы',                 price: 70,  weight: 300, cal: 80  },
];

async function seed() {
  const client = await pool.connect();
  try {
    // ── Users ─────────────────────────────────────────────────────────────────
    console.log('Upserting users...');
    const userIds = {};
    for (const cred of credentials) {
      const hash = await bcrypt.hash(cred.password, 10);
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, phone = EXCLUDED.phone,
               address = EXCLUDED.address, updated_at = NOW()
         RETURNING id, email, role`,
        [cred.name, cred.email, hash, cred.role, cred.phone, cred.address]
      );
      // ON CONFLICT path returns the existing row; re-query to get id reliably
      const { rows: found } = await client.query(
        'SELECT id, role FROM users WHERE email = $1',
        [cred.email]
      );
      userIds[cred.email] = found[0].id;
      console.log(`  ${cred.role.padEnd(8)} ${cred.email}  →  id=${found[0].id}  pwd=${cred.password}`);
    }

    // ── Menu items ────────────────────────────────────────────────────────────
    console.log('\nRebuilding menu items...');
    await client.query('DELETE FROM menu_items');

    const { rows: cats } = await client.query('SELECT id, name FROM categories');
    const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]));

    const itemIds = {};
    for (const item of MENU_ITEMS) {
      const catId = catMap[item.cat];
      if (!catId) { console.warn(`  Category not found: ${item.cat}`); continue; }
      const { rows } = await client.query(
        `INSERT INTO menu_items (category_id, name, description, price, weight_grams, calories)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [catId, item.name, item.desc, item.price, item.weight, item.cal]
      );
      itemIds[item.name] = { id: rows[0].id, price: item.price };
    }
    console.log(`  Added ${Object.keys(itemIds).length} items`);

    // ── Orders ────────────────────────────────────────────────────────────────
    console.log('\nRebuilding orders...');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');

    const ivan    = userIds['ivan@test.com'];
    const maria   = userIds['maria@test.com'];
    const alex    = userIds['alex@test.com'];
    const dmitry  = userIds['dmitry@courier.com'];
    const elena   = userIds['elena@courier.com'];

    const makeOrder = async (customerId, courierId, status, address, notes, lines) => {
      let total = 0;
      for (const [name, qty] of lines) total += itemIds[name].price * qty;
      const { rows } = await client.query(
        `INSERT INTO orders (customer_id, courier_id, status, total_price, delivery_address, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::interval) RETURNING id`,
        [customerId, courierId || null, status, total.toFixed(2), address, notes || null, Math.floor(Math.random() * 48) + 1]
      );
      const orderId = rows[0].id;
      for (const [name, qty] of lines) {
        const { id: menuItemId, price } = itemIds[name];
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price_at_time)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, menuItemId, name, qty, price]
        );
      }
      return orderId;
    };

    // Ivan — 1 delivered, 1 confirmed
    await makeOrder(ivan, dmitry, 'delivered', 'ул. Пушкина, д. 1, кв. 5', null,
      [['Борщ', 2], ['Греческий салат', 1], ['Компот из сухофруктов', 2]]);

    await makeOrder(ivan, null, 'confirmed', 'ул. Пушкина, д. 1, кв. 5', 'Домофон не работает, позвонить',
      [['Котлета по-киевски', 1], ['Картофельное пюре с сосисками', 1]]);

    // Maria — 2 delivered, 1 preparing
    await makeOrder(maria, elena, 'delivered', 'пр. Ленина, д. 42, кв. 18', null,
      [['Плов', 1], ['Цезарь с курицей', 1], ['Кисель клюквенный', 1]]);

    await makeOrder(maria, dmitry, 'delivered', 'пр. Ленина, д. 42, кв. 18', null,
      [['Щи', 2], ['Медовик', 2]]);

    await makeOrder(maria, null, 'preparing', 'пр. Ленина, д. 42, кв. 18', 'Без лука пожалуйста',
      [['Суп харчо', 1], ['Оливье', 1], ['Кисель клюквенный', 2]]);

    // Alex — 1 pending, 1 ready (couriers can grab it), 1 picked_up
    await makeOrder(alex, null, 'pending', 'ул. Гагарина, д. 15, кв. 7', null,
      [['Гречка с тушёнкой', 2], ['Шоколадный брауни', 1]]);

    await makeOrder(alex, null, 'ready', 'ул. Гагарина, д. 15, кв. 7', 'Оставить у двери',
      [['Картофельное пюре с сосисками', 1], ['Оливье', 1], ['Компот из сухофруктов', 1]]);

    await makeOrder(alex, elena, 'picked_up', 'ул. Гагарина, д. 15, кв. 7', null,
      [['Борщ', 1], ['Цезарь с курицей', 1]]);

    const { rows: orderCount } = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`  Created ${orderCount[0].count} orders`);

    console.log('\n✓ Seed complete');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
