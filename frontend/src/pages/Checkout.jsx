import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatRubles } from '../utils/money'

export default function Checkout() {
  const { items, clearCart } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    comment: '',
    payment: 'card_online',
  })

  const total = items.reduce((s, it) => s + it.product.price * it.quantity, 0)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function submit(e) {
    e.preventDefault()
    const order = {
      id: Date.now(),
      items,
      total,
      ...form,
    }
    clearCart()
    navigate('/confirmation', { state: { order } })
  }

  if (items.length === 0) return <p>Корзина пуста, добавить товары перед оформлением.</p>

  return (
    <div className="checkout-page">
      <section className="page-header-card">
        <p className="eyebrow">Оформление заказа</p>
        <h1>Заполните контакты, адрес и комментарий</h1>
        <p>Эта форма соберёт все данные, которые нужны для доставки и связи с вами.</p>
      </section>

      <section className="checkout-shell">
        <form onSubmit={submit} className="checkout checkout-form-card">
          <div className="field-grid">
            <div>
              <label className="field-label">Имя</label>
              <input name="name" value={form.name} onChange={handleChange} required className="text-input" />
            </div>
            <div>
              <label className="field-label">Телефон</label>
              <input name="phone" value={form.phone} onChange={handleChange} required className="text-input" />
            </div>
          </div>

          <div className="field-grid">
            <div>
              <label className="field-label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="text-input" placeholder="name@example.com" />
            </div>
            <div>
              <label className="field-label">Адрес доставки</label>
              <input name="address" value={form.address} onChange={handleChange} required className="text-input" placeholder="Москва, ул. ..." />
            </div>
          </div>

          <div>
            <label className="field-label">Комментарий к заказу</label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              className="text-input textarea"
              rows="5"
              placeholder="Например: позвонить перед доставкой, нужен счет на юридическое лицо и т.д."
            />
          </div>

          <div>
            <label className="field-label">Оплата</label>
            <select name="payment" value={form.payment} onChange={handleChange} className="text-input">
              <option value="card_online">Карта онлайн</option>
              <option value="cash_on_delivery">Наличные при получении</option>
            </select>
          </div>

          <div className="checkout-summary">
            <div>
              <span className="summary-label">Итого</span>
              <div className="summary-total">{formatRubles(total)}</div>
            </div>
            <button type="submit" className="primary-button">Подтвердить заказ</button>
          </div>
        </form>

        <aside className="checkout-info-card">
          <p className="eyebrow">Что попадёт в заказ</p>
          <ul className="contact-list">
            <li>Имя и телефон для связи</li>
            <li>Email для подтверждения</li>
            <li>Адрес доставки</li>
            <li>Комментарий к заказу</li>
          </ul>
        </aside>
      </section>
    </div>
  )
}
