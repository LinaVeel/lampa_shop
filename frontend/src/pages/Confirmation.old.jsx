import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentOrder } from '../store/selectors'
import { formatRubles } from '../utils/money'

export default function Confirmation() {
  const { state } = useLocation()
  const currentOrder = useSelector(selectCurrentOrder)
  const order = state?.order || currentOrder

  if (!order) {
    return (
      <div className="page-status">
        <p>Нет данных о заказе.</p>
        <Link to="/catalog" className="primary-button">
          Вернуться в каталог
        </Link>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <section className="page-header-card">
        <p className="eyebrow">Заказ оформлен</p>
        <h1>Спасибо за заказ!</h1>
        <p>Заказ создан через backend orders service и сохранён в Redux.</p>
      </section>

      <section className="checkout-shell">
        <div className="checkout-form-card">
          <h2>Данные заказа</h2>
          <p>
            Номер заказа: <strong>{order.id}</strong>
          </p>
          <p>
            Имя: <strong>{order.recipient_name || order.name}</strong>
          </p>
          <p>
            Телефон: <strong>{order.recipient_phone || order.phone}</strong>
          </p>
          <p>
            Сумма: <strong>{formatRubles(Number(order.total_amount || order.total || 0))}</strong>
          </p>
          <p>
            Статус: <strong>{order.status || 'pending'}</strong>
          </p>
          <Link to="/catalog" className="primary-button">
            Вернуться в каталог
          </Link>
        </div>

        <aside className="checkout-info-card">
          <p className="eyebrow">Состав заказа</p>
          {Array.isArray(order.items) && order.items.length > 0 ? (
            <ul className="contact-list">
              {order.items.map((item) => (
                <li key={item.id || item.productId}>
                  {item.productName || item.name} × {item.quantity}
                </li>
              ))}
            </ul>
          ) : (
            <p>Состав заказа доступен в истории заказов или после отслеживания.</p>
          )}
        </aside>
      </section>
    </div>
  )
}
