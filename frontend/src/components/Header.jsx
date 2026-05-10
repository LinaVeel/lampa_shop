import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCartCount } from '../store/selectors'
import styles from '../styles/Header.module.css'

export default function Header() {
  const count = useSelector(selectCartCount)

  return (
    <header className={styles.site_header}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 0' }}>
        <Link to="/catalog" className={styles.logo}>
          Lampashop
        </Link>
        <nav className={styles.header_nav}>
          <Link to="/catalog" className={styles.nav_link}>Каталог</Link>
          <Link to="/catalog#track-order" className={styles.nav_link}>Отследить заказ</Link>
          <Link to="/callback" className={styles.nav_link}>Заявка на звонок</Link>
          <Link to="/cart" className={styles.cart_link}>
            Корзина <span>{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
