import React, { useEffect, useMemo, useState } from 'react'

import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { categories, products } from '../mock/products'
import { useCart } from '../context/CartContext'

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? 'Все'
  const { items, lastAdded } = useCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [showToast, setShowToast] = useState(false)
  const [trackForm, setTrackForm] = useState({ orderNumber: '', phone: '' })
  const [trackResult, setTrackResult] = useState('')

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory = category === 'Все' || product.category === category
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query])

  useEffect(() => {
    if (!lastAdded) {
      setShowToast(false)
      return undefined
    }

    setShowToast(true)
    const timeoutId = window.setTimeout(() => setShowToast(false), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [lastAdded])

  function updateParams(nextValues) {
    const nextParams = new URLSearchParams(searchParams)

    if (nextValues.q !== undefined) {
      if (nextValues.q) {
        nextParams.set('q', nextValues.q)
      } else {
        nextParams.delete('q')
      }
    }

    if (nextValues.category !== undefined) {
      if (nextValues.category === 'Все') {
        nextParams.delete('category')
      } else {
        nextParams.set('category', nextValues.category)
      }
    }

    setSearchParams(nextParams)
  }

  function handleTrackChange(event) {
    const { name, value } = event.target
    setTrackForm((current) => ({ ...current, [name]: value }))
  }

  function handleTrackSubmit(event) {
    event.preventDefault()

    if (!trackForm.orderNumber.trim() && !trackForm.phone.trim()) {
      setTrackResult('Введите трек-номер или номер телефона.')
      return
    }

    setTrackResult(
      `Заказ найден для ${trackForm.orderNumber || trackForm.phone}. Статус: в обработке.`
    )
  }

  return (
    <div className="catalog-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Интернет-магазин лампочек</p>
          <h1>Каталог лампочек для дома, кухни и витрин</h1>
          <p className="hero-copy">
            Подберите лампу по типу света, категории и бюджету. Здесь уже есть
            быстрый поиск, фильтры, большие фото и быстрая обратная связь по корзине.
          </p>
        </div>
        <div className="hero-actions">
          <a href="#track-order" className="ghost-button">
            Отследить заказ
          </a>
          <Link to="/callback" className="primary-button">
            Оставить заявку на звонок
          </Link>
        </div>
      </section>

      <section className="hero-stats">
        <div className="stat-card">
          <span className="stat-label">В корзине</span>
          <strong>{cartCount} товаров</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Фотоламп</span>
          <strong>12 моделей</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Доставка</span>
          <strong>Москва и область</strong>
        </div>
      </section>

      {showToast && lastAdded && (
        <div className="cart-toast" key={lastAdded.timestamp}>
          <strong>Добавлено в корзину</strong>
          <span>Товар увеличен на {lastAdded.quantity}. Сейчас в корзине {cartCount} товаров.</span>
        </div>
      )}

      <section className="catalog-layout">
        <aside className="filters-panel">
          <div className="panel-block">
            <label className="field-label" htmlFor="catalog-search">Поиск по названию</label>
            <input
              id="catalog-search"
              className="text-input"
              type="search"
              placeholder="например, smart или kitchen"
              value={query}
              onChange={(event) => updateParams({ q: event.target.value })}
            />
          </div>

          <div className="panel-block">
            <label className="field-label" htmlFor="catalog-category">Категория</label>
            <select
              id="catalog-category"
              className="text-input"
              value={category}
              onChange={(event) => updateParams({ category: event.target.value })}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="panel-block">
            <p className="field-label">Популярные категории</p>
            <div className="chip-list">
              {categories.slice(1).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${category === item ? 'active' : ''}`}
                  onClick={() => updateParams({ category: item })}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="callback-card">
            <p className="callback-title">Нужна помощь с выбором?</p>
            <p>Оставьте заявку, и мы перезвоним в рабочее время.</p>
            <Link to="/callback" className="primary-button full-width">
              Заказать звонок
            </Link>
          </div>
        </aside>

        <div className="catalog-content">
          <div className="catalog-toolbar">
            <p>
              Найдено товаров: <strong>{filteredProducts.length}</strong>
            </p>
            <button
              type="button"
              className="link-button"
              onClick={() => setSearchParams({})}
            >
              Сбросить фильтры
            </button>
          </div>

          <div className="grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="track-section" id="track-order">
        <div className="track-copy">
          <p className="eyebrow">Отследить заказ</p>
          <h2>Проверьте статус заказа по номеру или телефону</h2>
          <p>
            Введите трек-номер заказа или номер телефона, указанный при оформлении,
            и мы покажем текущий статус заявки.
          </p>
        </div>

        <form className="track-form" onSubmit={handleTrackSubmit}>
          <label className="field-label" htmlFor="track-order-number">Номер заказа</label>
          <input
            id="track-order-number"
            className="text-input"
            name="orderNumber"
            value={trackForm.orderNumber}
            onChange={handleTrackChange}
            placeholder="например, 10254"
          />

          <label className="field-label" htmlFor="track-phone">Телефон</label>
          <input
            id="track-phone"
            className="text-input"
            name="phone"
            value={trackForm.phone}
            onChange={handleTrackChange}
            placeholder="+7 (999) 123-45-67"
          />

          <button type="submit" className="primary-button full-width">
            Отследить
          </button>
          {trackResult && <div className="track-result">{trackResult}</div>}
        </form>
      </section>

      <section className="about-contact-grid">
        <article className="info-card">
          <p className="eyebrow">О нас</p>
          <h2>Мы подбираем лампы под каждый интерьер</h2>
          <p>
            Lampashop — это витрина лампочек для дома, кухни, витрин и декоративных
            светильников. Мы делаем акцент на качественных фото, понятной навигации и
            быстром выборе.
          </p>
        </article>

        <article className="info-card">
          <p className="eyebrow">Контактные данные</p>
          <h2>Свяжитесь с нами любым удобным способом</h2>
          <ul className="contact-list">
            <li>Адрес: Москва, ул. Светлая, д. 12</li>
            <li>Телефон: +7 (495) 123-45-67</li>
            <li>Часы работы: ежедневно 09:00–21:00</li>
          </ul>
          <div className="social-links">
            <a href="https://t.me/" target="_blank" rel="noreferrer" aria-label="Telegram">
              <span className="social-icon telegram">✈</span>
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <span className="social-icon instagram">◎</span>
            </a>
          </div>
        </article>
      </section>

      <footer className="site-footer">
        <div>
          <strong>Lampashop</strong>
          <p>Москва, ул. Светлая, д. 12</p>
          <p>Часы работы: 09:00–21:00</p>
        </div>
        <div>
          <p>Телефон: +7 (495) 123-45-67</p>
          <div className="social-links">
            <a href="https://t.me/" target="_blank" rel="noreferrer" aria-label="Telegram">
              <span className="social-icon telegram">✈</span>
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <span className="social-icon instagram">◎</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
