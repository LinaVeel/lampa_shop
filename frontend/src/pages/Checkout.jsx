import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { resetCartState } from '../features/cart/cartSlice'
import { submitDeliveryOrder } from '../features/orders/ordersSlice'
import { selectCartSessionId, selectCartTotal, selectCartViewItems, selectOrdersStatus } from '../store/selectors'
import { formatRubles } from '../utils/money'
import catalogStyles from '../styles/Catalog.module.css'
import checkoutStyles from '../styles/Checkout.module.css'
import utilStyles from '../styles/utilities.module.css'

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
    deliveryType: 'delivery', // 'delivery' или 'pickup'
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
          deliveryType: form.deliveryType,
          deliveryAddress: form.deliveryType === 'delivery' ? form.address : null,
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
      <div className={utilStyles.page_status}>
        <p>Корзина пуста, добавьте товары перед оформлением.</p>
        <button type="button" className={utilStyles.primary_button} onClick={() => navigate('/catalog')}>
          Перейти в каталог
        </button>
      </div>
    )
  }

  return (
    <div className={checkoutStyles.page}>
      <section className={checkoutStyles.header_card} style={{ marginBottom: '20px' }}>
        <p className={utilStyles.eyebrow}>Оформление заказа</p>
        <h1>Заполните контакты, адрес и комментарий</h1>
      </section>

      <section className={checkoutStyles.shell}>
        <form onSubmit={submit} className={checkoutStyles.form}>
          <div className={checkoutStyles.field_grid}>
            <div>
              <label className={utilStyles.field_label}>Имя</label>
              <input name="name" value={form.name} onChange={handleChange} required className={utilStyles.text_input} />
            </div>
            <div>
              <label className={utilStyles.field_label}>Телефон</label>
              <input name="phone" value={form.phone} onChange={handleChange} required className={utilStyles.text_input} />
            </div>
          </div>

          <div className={checkoutStyles.field_grid}>
            <div>
              <label className={utilStyles.field_label}>Способ получения</label>
              <select name="deliveryType" value={form.deliveryType} onChange={handleChange} className={utilStyles.text_input}>
                <option value="delivery">Доставка по адресу</option>
                <option value="pickup">Самовывоз</option>
              </select>
            </div>
            <div>
              <label className={utilStyles.field_label}>Оплата</label>
              <select name="payment" value={form.payment} onChange={handleChange} className={utilStyles.text_input}>
                <option value="card_online">Карта онлайн</option>
                <option value="cash_on_delivery">Наличные при получении</option>
              </select>
            </div>
          </div>

          {form.deliveryType === 'delivery' && (
            <div>
              <label className={utilStyles.field_label}>Адрес доставки</label>
              <input name="address" value={form.address} onChange={handleChange} required className={utilStyles.text_input} placeholder="Москва, ул. ..." />
            </div>
          )}

          <div>
            <label className={utilStyles.field_label}>Комментарий к заказу</label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              className={`${utilStyles.text_input} ${utilStyles.textarea}`}
              rows="5"
              placeholder="Например: позвонить перед доставкой"
            />
          </div>

          {error && <div className={catalogStyles.track_result}>{error}</div>}

          <div className={checkoutStyles.summary}>
            <div>
              <span className={checkoutStyles.summary_label}>Итого</span>
              <div className={checkoutStyles.summary_total}>{formatRubles(total)}</div>
            </div>
            <button type="submit" className={utilStyles.primary_button} disabled={orderStatus === 'loading'}>
              {orderStatus === 'loading' ? 'Оформляем...' : 'Подтвердить заказ'}
            </button>
          </div>
        </form>

        <aside className={checkoutStyles.info_card}>
          <p className={utilStyles.eyebrow}>Что попадёт в заказ</p>
          <ul className={catalogStyles.contact_list}>
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
