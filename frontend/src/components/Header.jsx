import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Header() {
  const { items } = useCart()
  const count = items.reduce((s, it) => s + it.quantity, 0)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/catalog" className="logo">
          Lampashop
        </Link>
        <nav className="header-nav">
          <Link to="/catalog">Каталог</Link>
          <Link to="/catalog#track-order">Отследить заказ</Link>
          <Link to="/callback">Заявка на звонок</Link>
          <Link to="/cart" className="cart-link">
            Корзина <span>{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
