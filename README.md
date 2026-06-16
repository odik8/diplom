# Доставка готовых блюд

  **Система онлайн-заказа и доставки готовых блюд: REST API, мобильное приложение для покупателей и курьеров, веб-панель администратора**

  ![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
  ![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)
  ![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
  ![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white)


---

## О проекте

Полнофункциональная система онлайн-заказа и доставки готовых блюд, разработанная в рамках выпускной квалификационной работы. Система покрывает полный жизненный цикл заказа — от выбора блюд покупателем до доставки курьером — и предоставляет администратору инструменты управления меню, заказами и пользователями.

Проект построен по клиент-серверной архитектуре: единый REST API обслуживает два клиентских приложения с разграничением прав по ролям (**покупатель**, **курьер**, **администратор**) на основе JWT.

### Состав системы

| Компонент | Назначение | Технологии |
|-----------|-----------|-----------|
| **Backend API** | REST API, бизнес-логика, БД, аутентификация, приём оплаты | Node.js, Express, PostgreSQL, JWT |
| **Мобильное приложение** | Интерфейсы покупателя и курьера | React Native (Expo), React Navigation |
| **Веб-панель администратора** | Управление и аналитика | React, Vite, Tailwind CSS |

---

## Возможности

### Покупатель (мобильное приложение)

- **Регистрация и вход** по email с JWT-сессией
- **Просмотр меню** по категориям, карточка блюда с описанием
- **Корзина** с подсчётом суммы заказа
- **Оформление заказа** с указанием адреса доставки
- **Онлайн-оплата** через PayPalych (с тестовым режимом-эмулятором)
- **Отслеживание статуса заказа** в реальном времени
- **История заказов** и редактирование профиля

### Курьер (мобильное приложение)

- **Список доступных заказов** к доставке
- **Принятие заказа** в работу
- **Обновление статуса доставки**: «Принят» → «Доставлен»

### Администратор (веб-панель)

- **Дашборд** со статистикой: заказы, выручка, клиенты
- **Управление заказами** — смена статусов, назначение курьеров
- **Управление меню** — категории и блюда (CRUD)
- **Управление пользователями** — покупатели и курьеры, блокировка/разблокировка

---

## Технологический стек

| Слой | Технологии |
| ---- | ---------- |
| Backend | Node.js, [Express](https://expressjs.com/) 4, [PostgreSQL](https://www.postgresql.org/) 15 (драйвер `pg`) |
| Аутентификация | [JWT](https://jwt.io/) (`jsonwebtoken`), хеширование паролей `bcryptjs` |
| Безопасность | `helmet`, `cors`, `express-rate-limit`, валидация `express-validator` |
| Оплата | Интеграция с [PayPalych](https://paypalych.com), серверный postback с проверкой подписи |
| Мобильное | [React Native](https://reactnative.dev/) 0.81, [Expo](https://expo.dev/) SDK 54, [React Navigation](https://reactnavigation.org/) 7, `axios`, `react-native-webview` |
| Веб-панель | [React](https://react.dev/) 18, [Vite](https://vitejs.dev/) 5, [Tailwind CSS](https://tailwindcss.com/) 3, [React Router](https://reactrouter.com/) 6 |
| Тесты | Backend — [Jest](https://jestjs.io/) + Supertest; Admin — [Vitest](https://vitest.dev/) + Testing Library; Mobile — Jest |
| Инфраструктура | Docker Compose (db + migrate + backend + admin) |

---

## Установка и запуск

### Вариант 1. Docker Compose (рекомендуется)

Поднимает PostgreSQL, выполняет миграцию и сидинг, запускает backend и веб-панель одной командой:

```bash
docker compose up -d
```

После запуска:

- Backend API — http://localhost:5001
- Веб-панель — http://localhost:3000
- PostgreSQL — `localhost:5432`

Миграция и наполнение демо-данными (`npm run setup`) выполняются автоматически при каждом старте; повторный сидинг не затирает существующие данные.

> Оплата по умолчанию работает в **тестовом режиме** (`PAYPALYCH_TEST_MODE=true`) — заказ оплачивается локально без обращения к платёжному сервису. Для боевого режима укажите `PAYPALYCH_TOKEN` и `PAYPALYCH_SHOP_ID` в `docker-compose.yml` и уберите `PAYPALYCH_TEST_MODE`.

### Вариант 2. Локальный запуск

#### Требования

- Node.js 18+
- PostgreSQL 15
- Для мобильного приложения: Expo CLI, Xcode (iOS) или Android Studio

#### 1. База данных и backend

```bash
createdb meal_delivery
cd backend
cp .env.example .env          # укажите DATABASE_URL и JWT_SECRET
npm install
npm run setup                 # миграция + демо-данные
npm run dev                   # http://localhost:5001
```

#### 2. Веб-панель администратора

```bash
cd admin
npm install
npm run dev                   # http://localhost:3000
```

#### 3. Мобильное приложение

```bash
cd mobile
npm install
# В src/services/api.js укажите IP вашей машины вместо localhost
# для запуска на физическом устройстве
npx expo run:ios              # или: npx expo run:android
```

### Тесты

```bash
cd backend && npm test        # Jest + Supertest (БД мокается)
cd admin   && npm test        # Vitest + Testing Library
cd mobile  && npm test        # Jest
```

---

## Учётные данные по умолчанию

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | `admin@mealdelivery.com` | `admin123` |
| Покупатель | `ivan@test.com` | `client123` |
| Курьер | `dmitry@courier.com` | `courier123` |

---

## Структура проекта

```
diplom/
├── backend/                    # REST API (Node.js + Express + PostgreSQL)
│   └── src/
│       ├── app.js              # сборка Express-приложения, middleware, маршруты
│       ├── index.js            # точка входа, запуск сервера
│       ├── config/             # подключение к БД
│       ├── controllers/        # auth, menu, order, admin, payment
│       ├── routes/             # auth, menu, orders, admin, payments
│       ├── middleware/         # authenticate / authorize (JWT, роли)
│       ├── services/           # paypalych.js — интеграция оплаты
│       ├── db/                 # schema.sql, миграция, сид-данные
│       └── __tests__/          # Jest-тесты API
├── mobile/                     # React Native (Expo)
│   └── src/
│       ├── navigation/         # App / Customer / Courier навигаторы
│       ├── context/            # AuthContext, CartContext
│       ├── screens/            # auth, customer, courier
│       └── services/api.js     # axios-клиент к API
├── admin/                      # React + Vite + Tailwind
│   └── src/
│       ├── pages/              # Dashboard, Orders, Menu, Users, Login
│       ├── components/         # Layout, StatusBadge
│       ├── context/            # AuthContext
│       └── services/           # API-клиент
├── docs/                       # ВКР, презентация, скриншоты, payments.md
└── docker-compose.yml          # db + migrate + backend + admin
```

---

## Архитектура

```
        ┌──────────────────────┐      ┌──────────────────────┐
        │  Мобильное (Expo)    │      │  Веб-панель (React)  │
        │  Покупатель / Курьер │      │   Администратор      │
        └──────────┬───────────┘      └──────────┬───────────┘
                   │   axios + JWT               │   axios + JWT
                   └──────────────┬──────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │       Backend API (Express)    │
                  │  helmet · cors · rate-limit    │
                  │  authenticate / authorize (JWT)│
                  │                                │
                  │  /auth  /menu  /orders         │
                  │  /payments  /admin             │
                  └───────┬───────────────┬────────┘
                          │               │ postback (подпись)
                          ▼               ▼
                  ┌──────────────┐  ┌──────────────┐
                  │  PostgreSQL  │  │  PayPalych   │
                  │   (pg pool)  │  │   (оплата)   │
                  └──────────────┘  └──────────────┘
```

### Принципы

- **Единый API, разграничение по ролям** — один backend обслуживает оба клиента; доступ к эндпоинтам ограничен middleware `authorize('customer' | 'courier' | 'admin')`
- **Stateless-аутентификация** — JWT в заголовке `Authorization`, пароли хранятся как `bcrypt`-хеши
- **Защита по умолчанию** — `helmet`, ограничение частоты запросов на `/auth`, серверная валидация входных данных
- **Безопасный приём оплаты** — подтверждение платежа приходит только через server-to-server postback с проверкой подписи, а не от клиента

---

## Статусы заказа

```
pending → confirmed → preparing → ready → picked_up → delivered
                                                    ↘ cancelled (из pending / confirmed)
```

Статус оплаты отслеживается отдельным полем: `unpaid → pending → paid` (или `failed`).

---

## API Endpoints

### Auth — `/api/auth`
- `POST /register` — регистрация
- `POST /login` — вход
- `GET /me` — текущий пользователь
- `PATCH /profile` — обновление профиля

### Menu — `/api/menu` (публичный)
- `GET /categories`
- `GET /items?category_id=X`
- `GET /items/:id`

### Orders — `/api/orders`
- `POST /` — создать заказ *(покупатель)*
- `GET /my` — мои заказы *(покупатель)*
- `GET /:id` — детали заказа
- `PATCH /:id/cancel` — отменить *(покупатель)*
- `GET /available` — доступные заказы *(курьер)*
- `PATCH /:id/accept` — принять заказ *(курьер)*
- `PATCH /:id/delivery-status` — обновить статус доставки *(курьер)*
- `GET /` — все заказы *(admin)*
- `PATCH /:id/status` — обновить статус *(admin)*

### Payments — `/api/payments`
- `POST /:orderId/create` — создать платёж *(покупатель)*
- `POST /paypalych/postback` — серверное уведомление PayPalych (с проверкой подписи)
- `GET|POST /test/:billId` — эмуляция оплаты в тестовом режиме

### Admin — `/api/admin`
- `GET /stats` — статистика
- `GET /users?role=X` — список пользователей
- `POST /couriers` — создать курьера
- `PATCH /users/:id/toggle` — блокировка/разблокировка

---

## Лицензия

Проект разработан в учебных целях в рамках выпускной квалификационной работы.
