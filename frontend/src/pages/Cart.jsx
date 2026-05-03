import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatRubles } from '../utils/money'

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()

  const total = items.reduce((s, it) => s + it.product.price * it.quantity, 0)

  if (items.length === 0)
    return (
      <div>
        <h1>Корзина</h1>
        <p>Корзина пуста.</p>
        <Link to="/catalog">Перейти в каталог</Link>
      </div>
    )

  return (
    <div>
      <h1>Корзина</h1>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Товар</th>
            <th>Цена</th>
            <th>Кол-во</th>
            <th>Сумма</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.product.id}>
              <td>{it.product.name}</td>
              <td>{formatRubles(it.product.price)}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => updateQuantity(it.product.id, Number(e.target.value))}
                />
              </td>
              <td>{formatRubles(it.product.price * it.quantity)}</td>
              <td>
                <button onClick={() => removeItem(it.product.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cart-actions">
        <div className="total">Итого: {formatRubles(total)}</div>
        <div>
          <button onClick={() => clearCart()}>Очистить</button>
          <button onClick={() => navigate('/checkout')}>Оформить заказ</button>
        </div>
      </div>
    </div>
  )
}
