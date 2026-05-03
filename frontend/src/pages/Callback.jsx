import React, { useState } from 'react'

export default function CallbackPage() {
  const [form, setForm] = useState({ name: '', phone: '', comment: '' })
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
    <div className="callback-page">
      <section className="callback-hero">
        <div>
          <p className="eyebrow">Обратный звонок</p>
          <h1>Оставьте заявку, и мы подберём лампы под ваш интерьер</h1>
          <p>
            Поможем определиться с типом цоколя, яркостью и количеством ламп для
            комнаты, кухни или витрины.
          </p>
        </div>
        <div className="callback-note">
          Обычно перезваниваем в рабочее время в течение 15-30 минут.
        </div>
      </section>

      <section className="callback-form-shell">
        <form className="callback-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="callback-name">Ваше имя</label>
          <input
            id="callback-name"
            className="text-input"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Иван"
            required
          />

          <label className="field-label" htmlFor="callback-phone">Телефон</label>
          <input
            id="callback-phone"
            className="text-input"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+7 (999) 123-45-67"
            required
          />

          <label className="field-label" htmlFor="callback-comment">Комментарий</label>
          <textarea
            id="callback-comment"
            className="text-input textarea"
            name="comment"
            value={form.comment}
            onChange={handleChange}
            placeholder="Например: нужна подсветка кухни и 8 лампочек"
            rows="6"
          />

          <button type="submit" className="primary-button">
            Отправить заявку
          </button>

          {submitted && (
            <div className="success-box">
              Заявка сохранена в прототипе. Менеджер должен перезвонить вам позже.
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
