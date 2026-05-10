import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { resetCartState } from '../features/cart/cartSlice'
import { submitDeliveryOrder } from '../features/orders/ordersSlice'
import { selectCartSessionId, selectCartTotal, selectCartViewItems, selectOrdersStatus } from '../store/selectors'
import { formatRubles } from '../utils/money'

export default function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartViewItems)
  const total = useSelector(selectCartTotal)
  const sessionId = useSelector(selectCartSessionId)
  const orderStatus = useSelector(selectOrdersStatus)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    comment: '',
    payment: 'card_online',
  })
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (items.length === 0) {
      setError('Корзина пуста, добавьте товары перед оформлением.')
      return
    }

    try {
      const order = await dispatch(
        submitDeliveryOrder({
          sessionId,
          recipientName: form.name,
          recipientPhone: form.phone,
          deliveryAddress: form.address,
          paymentMethod: form.payment,
          comment: form.comment,
        })
      ).unwrap()

      dispatch(resetCartState())
      navigate('/confirmation', {
        state: {
          order: {
            ...order,
            items,
            total,
          },
        },
      })
    } catch (submitError) {
      setError(submitError?.message || 'Не удалось оформить заказ.')
    }
  }

  if (items.length === 0) {
    return (
      <div className="page-status">
        <p>Корзина пуста, добавьте товары перед оформлением.</p>
        <button type="button" className="primary-button" onClick={() => navigate('/catalog')}>
          Перейти в каталог
        </button>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <section className="page-header-card">
        <p className="eyebrow">Оформление заказа</p>
        <h1>Заполните контакты, адрес и комментарий</h1>
        <p>Данные уйдут в orders service, который создаст заказ из вашей корзины.</p>
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
              <label className="field-label">Адрес доставки</label>
              <input name="address" value={form.address} onChange={handleChange} required className="text-input" placeholder="Москва, ул. ..." />
            </div>
            <div>
              <label className="field-label">Оплата</label>
              <select name="payment" value={form.payment} onChange={handleChange} className="text-input">
                <option value="card_online">Карта онлайн</option>
                <option value="cash_on_delivery">Наличные при получении</option>
              </select>
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
              placeholder="Например: позвонить перед доставкой"
            />
          </div>

          {error && <div className="track-result">{error}</div>}

          <div className="checkout-summary">
            <div>
              <span className="summary-label">Итого</span>
              <div className="summary-total">{formatRubles(total)}</div>
            </div>
            <button type="submit" className="primary-button" disabled={orderStatus === 'loading'}>
              {orderStatus === 'loading' ? 'Оформляем...' : 'Подтвердить заказ'}
            </button>
          </div>
        </form>

        <aside className="checkout-info-card">
          <p className="eyebrow">Что попадёт в заказ</p>
          <ul className="contact-list">
            <li>Имя и телефон для связи</li>
            <li>Адрес доставки</li>
            <li>Комментарий к заказу</li>
            <li>Состав корзины и сумма</li>
          </ul>
        </aside>
      </section>
    </div>
  )
}
