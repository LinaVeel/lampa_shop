import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { formatRubles } from '../utils/money'

export default function Confirmation() {
  const { state } = useLocation()
  const order = state?.order

  if (!order) return <p>Нет данных о заказе.</p>

  return (
    <div>
      <h1>Спасибо за заказ!</h1>
      <p>Номер заказа: <strong>{order.id}</strong></p>
      <p>Имя: {order.name}</p>
      <p>Телефон: {order.phone}</p>
      <p>Сумма: {formatRubles(order.total)}</p>
      <Link to="/catalog">Вернуться в каталог</Link>
    </div>
  )
}
