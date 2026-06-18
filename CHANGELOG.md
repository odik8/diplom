# Changelog

Все значимые изменения в проекте документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект придерживается [семантического версионирования](https://semver.org/lang/ru/).

## [Unreleased]

### Added
- `LICENSE` (MIT) и `CHANGELOG.md`.
- Раздел со скриншотами интерфейса и ссылка на документацию в `README.md`.
- Отчёт о покрытии кода тестами.

## [1.1.0] - 2026-06-16

### Added
- Онлайн-оплата заказов через PayPalych с проверкой подписи postback.
- Тестовый режим-эмулятор оплаты для отладки без реальных транзакций.
- Наборы тестов: backend (Jest + Supertest), admin/mobile (Vitest) — 97 тестов.

### Changed
- Обновлена документация (`README.md`) и инструкции по запуску.

## [1.0.0] - 2026-06-16

### Added
- Backend REST API на Node.js/Express + PostgreSQL: аутентификация (JWT),
  RBAC (покупатель/курьер/администратор), меню, корзина, заказы.
- Мобильное приложение (React Native / Expo): интерфейсы покупателя и курьера.
- Веб-панель администратора (React + Vite + Tailwind): дашборд, заказы, меню,
  пользователи.
- Конфигурация развёртывания через Docker Compose, миграции и сидирование БД.
- Интеграция с Яндекс Картами для адресов доставки.

[Unreleased]: https://github.com/odik8/diplom/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/odik8/diplom/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/odik8/diplom/releases/tag/v1.0.0
