import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import authStyles from '../styles/Auth.module.css'
import utilStyles from '../styles/utilities.module.css'
import { selectAuthStatus } from '../store/selectors'

export default function Auth() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const status = useSelector(selectAuthStatus) || 'idle'
  const [form, setForm] = useState({ email: '', password: '' })

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // Auth implementation pending
    navigate('/catalog')
  }

  return (
    <div className={authStyles.page}>
      <section className={authStyles.shell}>
        <div className={authStyles.copy}>
          <p className={utilStyles.eyebrow}>Авторизация</p>
          <h1>Войдите в учётную запись</h1>
          <ul className={authStyles.feature_list}>
            <li>Просмотр истории заказов</li>
            <li>Сохранение избранного</li>
            <li>Персональные рекомендации</li>
          </ul>
        </div>

        <div className={authStyles.card}>
          <form onSubmit={handleSubmit} className={authStyles.form}>
            <div>
              <label className={utilStyles.field_label}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className={utilStyles.text_input}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className={utilStyles.field_label}>Пароль</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className={utilStyles.text_input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className={utilStyles.primary_button} style={{ width: '100%' }} disabled={status === 'loading'}>
              {status === 'loading' ? 'Загрузка...' : 'Войти'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
