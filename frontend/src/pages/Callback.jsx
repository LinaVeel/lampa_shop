import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import callbackStyles from '../styles/Callback.module.css'
import utilStyles from '../styles/utilities.module.css'
import { selectOrdersStatus } from '../store/selectors'

export default function CallbackPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const status = useSelector(selectOrdersStatus) || 'idle'
  const [form, setForm] = useState({ name: '', phone: '', comment: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // Call request API pending
    setSubmitted(true)
    setTimeout(() => navigate('/catalog'), 2000)
  }

  return (
    <div className={callbackStyles.page}>
      <section className={callbackStyles.hero}>
        <div className={callbackStyles.copy}>
          <p className={utilStyles.eyebrow}>Заявка на звонок</p>
          <h1>Оставьте контакты, и мы перезвоним</h1>
          <p>
            Заполните форму, и оператор свяжется с вами в рабочее время. Обычно мы
            отвечаем в течение часа.
          </p>
        </div>

        <div className={callbackStyles.form_shell}>
          {submitted ? (
            <div className={utilStyles.success_box} style={{ padding: '20px', textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#25603a' }}>
              <strong style={{ fontSize: '18px', marginBottom: '10px' }}>Спасибо!</strong>
              <p>Ваша заявка принята. Мы перезвоним в ближайшее время.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={callbackStyles.form}>
              <div>
                <label className={utilStyles.field_label}>Имя</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={utilStyles.text_input}
                  placeholder="Иван"
                />
              </div>

              <div>
                <label className={utilStyles.field_label}>Телефон</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className={utilStyles.text_input}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label className={utilStyles.field_label}>Комментарий</label>
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  className={`${utilStyles.text_input} ${utilStyles.textarea}`}
                  placeholder="Вопрос или комментарий..."
                />
              </div>

              <button type="submit" className={utilStyles.primary_button} style={{ width: '100%' }} disabled={status === 'loading'}>
                {status === 'loading' ? 'Отправляем...' : 'Отправить заявку'}
              </button>
            </form>
          )}
        </div>
      </section>

      <div className={callbackStyles.note} style={{ marginTop: '24px', padding: '20px', textAlign: 'center' }}>
        <div>
          <p style={{ margin: '0 0 8px', color: 'var(--text)', fontWeight: '800' }}>Часы работы</p>
          <p style={{ margin: '0', color: 'var(--muted)' }}>Пн–Пт: 09:00–18:00</p>
          <p style={{ margin: '0', color: 'var(--muted)' }}>Сб–Вс: 10:00–16:00</p>
        </div>
      </div>
    </div>
  )
}
