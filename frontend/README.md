# Lampashop Frontend

Простой frontend для магазина лампочек (mock backend).

Запуск локально:

```bash
cd frontend
# установить зависимости
npm install
# запустить dev-сервер
npm run dev
```

Доступ: http://localhost:5173 (по умолчанию от Vite)

Рекомендации для пуша в GitHub:

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend scaffold"
# создайте публичный репозиторий на GitHub и затем:
git remote add origin git@github.com:YOUR_USERNAME/lampashop-frontend.git
git branch -M main
git push -u origin main
```

Что реализовано:
- Vite + React (routes через `react-router-dom`)
- Страницы: каталог, карточка товара, корзина, оформление, подтверждение
- Контекст корзины (mock) и mock-данные в `src/mock/products.js`

