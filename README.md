# Система онлайн-заказа и доставки готовых блюд

Полнофункциональная система, состоящая из трёх компонентов:

| Компонент | Технологии | Запуск |
|-----------|-----------|--------|
| **Backend API** | Node.js, Express, PostgreSQL, JWT | `cd backend && npm run dev` |
| **Мобильное приложение** | React Native (Expo), React Navigation | `cd mobile && npx expo start` |
| **Веб-панель администратора** | React, Vite, Tailwind CSS | `cd admin && npm run dev` |

---

## Быстрый старт

### 1. База данных

Создайте базу данных PostgreSQL и запустите миграцию:

```bash
createdb meal_delivery
cd backend
cp .env.example .env
# Отредактируйте .env — укажите DATABASE_URL
npm install
npm run migrate
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
# Сервер запустится на http://localhost:5000
```

### 3. Мобильное приложение

```bash
cd mobile
npm install
# В src/services/api.js замените localhost на IP вашей машины для физического устройства
npx expo start
```

### 4. Панель администратора

```bash
cd admin
npm install
npm run dev
# Откроется на http://localhost:3000
```

---

## Учётные данные по умолчанию

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@mealdelivery.com | admin123 |

---

## Функциональность

### Покупатель (мобильное приложение)
- Регистрация и вход
- Просмотр меню по категориям
- Добавление блюд в корзину
- Оформление заказа с указанием адреса
- Отслеживание статуса заказа в реальном времени
- История заказов
- Редактирование профиля

### Курьер (мобильное приложение)
- Просмотр доступных заказов к доставке
- Принятие заказа
- Обновление статуса: «Принят» → «Доставлен»

### Администратор (веб-панель)
- Статистика: заказы, выручка, клиенты
- Управление заказами: смена статусов, назначение курьеров
- Управление меню: категории и блюда (CRUD)
- Управление пользователями: покупатели, курьеры; блокировка/разблокировка

---

## Статусы заказа

```
pending → confirmed → preparing → ready → picked_up → delivered
                                                    ↘ cancelled (из pending/confirmed)
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `GET /api/auth/me` — текущий пользователь
- `PATCH /api/auth/profile` — обновление профиля

### Menu (публичный)
- `GET /api/menu/categories`
- `GET /api/menu/items?category_id=X`
- `GET /api/menu/items/:id`

### Orders
- `POST /api/orders` — создать заказ (покупатель)
- `GET /api/orders/my` — мои заказы (покупатель)
- `GET /api/orders/:id` — детали заказа
- `PATCH /api/orders/:id/cancel` — отменить (покупатель)
- `GET /api/orders/available` — доступные заказы (курьер)
- `PATCH /api/orders/:id/accept` — принять заказ (курьер)
- `PATCH /api/orders/:id/delivery-status` — обновить статус доставки (курьер)
- `GET /api/orders` — все заказы (admin)
- `PATCH /api/orders/:id/status` — обновить статус (admin)

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/users?role=X`
- `POST /api/admin/couriers`
- `PATCH /api/admin/users/:id/toggle`
