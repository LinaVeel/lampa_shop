import React, { useState } from 'react'

export default function AuthPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="auth-page">
      <section className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">Личный кабинет</p>
          <h1>Вход для постоянных покупателей</h1>
          <p>
            Сохраняйте заказы, быстрее оформляйте повторные покупки и отслеживайте
            статусы заявок в одном месте.
          </p>
          <ul className="feature-list">
            <li>Быстрый вход по email</li>
            <li>История заказов и корзин</li>
            <li>Сохранённые данные для оформления</li>
          </ul>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Авторизация</h2>
          <label className="field-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            className="text-input"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label className="field-label" htmlFor="auth-password">Пароль</label>
          <input
            id="auth-password"
            className="text-input"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="primary-button full-width">
            Войти
          </button>

          {submitted && (
            <div className="success-box">
              Для прототипа авторизация не подключена к backend, но форма уже готова.
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
