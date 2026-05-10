import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearCartOnServer, removeItemFromCart, resetCartState, updateItemQuantity } from '../features/cart/cartSlice'
import { selectCartCount, selectCartTotal, selectCartViewItems } from '../store/selectors'
import { formatRubles } from '../utils/money'

export default function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartViewItems)
  const count = useSelector(selectCartCount)
  const total = useSelector(selectCartTotal)

  if (count === 0) {
    return (
      <div className="page-status">
        <h1>Корзина</h1>
        <p>Корзина пуста.</p>
        <Link to="/catalog" className="primary-button">
          Перейти в каталог
        </Link>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <section className="page-header-card">
        <p className="eyebrow">Корзина</p>
        <h1>Выберите количество и переходите к оформлению</h1>
        <p>Корзина синхронизируется с carts service через fetch.</p>
      </section>

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
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="cart-item-cell">
                  <img src={item.image} alt={item.productName} />
                  <div>
                    <strong>{item.productName}</strong>
                    <p>{item.categoryName}</p>
                  </div>
                </div>
              </td>
              <td>{formatRubles(item.unitPrice)}</td>
              <td>
                <input
                  className="text-input cart-quantity-input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    dispatch(
                      updateItemQuantity({
                        itemId: item.id,
                        quantity: Number(event.target.value),
                      })
                    )
                  }
                />
              </td>
              <td>{formatRubles(item.lineTotal)}</td>
              <td>
                <button type="button" className="link-button" onClick={() => dispatch(removeItemFromCart(item.id))}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart-actions">
        <div className="total">Итого: {formatRubles(total)}</div>
        <div className="cart-actions-buttons">
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              dispatch(clearCartOnServer())
              dispatch(resetCartState())
            }}
          >
            Очистить
          </button>
          <button type="button" className="primary-button" onClick={() => navigate('/checkout')}>
            Оформить заказ
          </button>
        </div>
      </div>
    </div>
  )
}
