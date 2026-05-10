import React, { useEffect, useState } from 'react'

import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import ProductCard from '../components/ProductCard'
import { clearTrackedOrder, submitOrderTracking } from '../features/orders/ordersSlice'
import { fetchCategories, fetchProducts } from '../features/products/productsSlice'
import {
  selectCategories,
  selectCartCount,
  selectCartLastMutation,
  selectCatalogProducts,
  selectOrdersTrackStatus,
  selectProductListStatus,
  selectProductsCategoriesStatus,
  selectProductsError,
  selectTrackedOrder,
} from '../store/selectors'
import catalogStyles from '../styles/Catalog.module.css'
import utilStyles from '../styles/utilities.module.css'

const STATUS_LABELS = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
}

export default function Catalog() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const products = useSelector(selectCatalogProducts)
  const categories = useSelector(selectCategories)
  const cartCount = useSelector(selectCartCount)
  const lastMutation = useSelector(selectCartLastMutation)
  const productsStatus = useSelector(selectProductListStatus)
  const categoriesStatus = useSelector(selectProductsCategoriesStatus)
  const productsError = useSelector(selectProductsError)
  const trackedOrder = useSelector(selectTrackedOrder)
  const trackStatus = useSelector(selectOrdersTrackStatus)
  const [showToast, setShowToast] = useState(false)
  const [trackForm, setTrackForm] = useState({ orderNumber: '', phone: '' })
  const [trackResult, setTrackResult] = useState('')

  useEffect(() => {
    if (categoriesStatus === 'idle') {
      dispatch(fetchCategories())
    }
  }, [dispatch, categoriesStatus])

  useEffect(() => {
    const nextCategoryId = categoryId ? Number(categoryId) : undefined

    dispatch(
      fetchProducts({
        search: query.trim() || undefined,
        categoryId: nextCategoryId,
      })
    )
  }, [dispatch, query, categoryId])

  useEffect(() => {
    if (!lastMutation) {
      setShowToast(false)
      return undefined
    }

    setShowToast(true)
    const timeoutId = window.setTimeout(() => setShowToast(false), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [lastMutation])

  useEffect(() => {
    if (trackedOrder) {
      const russianStatus = STATUS_LABELS[trackedOrder.status] || trackedOrder.status
      setTrackResult(
        `Заказ ${trackedOrder.id} найден. Статус: ${russianStatus}. Трек-номер: ${
          trackedOrder.tracking_number || 'еще не присвоен'
        }.`
      )
    }
  }, [trackedOrder])

  function updateParams(nextValues) {
    const nextParams = new URLSearchParams(searchParams)

    if (nextValues.q !== undefined) {
      if (nextValues.q) {
        nextParams.set('q', nextValues.q)
      } else {
        nextParams.delete('q')
      }
    }

    if (nextValues.categoryId !== undefined) {
      if (nextValues.categoryId) {
        nextParams.set('categoryId', nextValues.categoryId)
      } else {
        nextParams.delete('categoryId')
      }
    }

    setSearchParams(nextParams)
  }

  function handleTrackChange(event) {
    const { name, value } = event.target
    setTrackForm((current) => ({ ...current, [name]: value }))
  }

  async function handleTrackSubmit(event) {
    event.preventDefault()

    if (!trackForm.orderNumber.trim() || !trackForm.phone.trim()) {
      setTrackResult('Введите номер заказа и телефон для поиска.')
      return
    }

    try {
      setTrackResult('')
      dispatch(clearTrackedOrder())
      await dispatch(
        submitOrderTracking({
          orderId: trackForm.orderNumber,
          recipientPhone: trackForm.phone,
        })
      ).unwrap()
    } catch (error) {
      setTrackResult(error?.message || 'Не удалось найти заказ.')
    }
  }

  const categoryOptions = [{ id: '', name: 'Все' }, ...categories]

  return (
    <div className={catalogStyles.page}>
      <section className={catalogStyles.hero_panel}>
        <div>
          <p className={utilStyles.eyebrow}>Интернет-магазин лампочек</p>
          <h1>Каталог лампочек для дома, кухни и витрин</h1>
          <p className={catalogStyles.hero_copy}>
            Подберите лампу по типу света, категории и бюджету. Поиск и фильтры
            теперь работают через backend, а корзина связана с Redux.
          </p>
        </div>
        <div className={catalogStyles.hero_actions}>
          <a href="#track-order" className={utilStyles.ghost_button}>
            Отследить заказ
          </a>
          <Link to="/callback" className={utilStyles.primary_button}>
            Оставить заявку на звонок
          </Link>
        </div>
      </section>

      {showToast && lastMutation && (
        <div className={catalogStyles.cart_toast} key={lastMutation.timestamp}>
          <strong>Добавлено в корзину</strong>
          <span>
            Товар увеличен на {lastMutation.quantity}. Сейчас в корзине {cartCount} товаров.
          </span>
        </div>
      )}

      <section className={catalogStyles.layout}>
        <aside className={catalogStyles.filters_panel}>
          <div className={catalogStyles.panel_block}>
            <label className={utilStyles.field_label} htmlFor="catalog-search">
              Поиск по названию
            </label>
            <input
              id="catalog-search"
              className={utilStyles.text_input}
              type="search"
              placeholder="например, smart или kitchen"
              value={query}
              onChange={(event) => updateParams({ q: event.target.value })}
            />
          </div>

          <div className={catalogStyles.panel_block}>
            <label className={utilStyles.field_label} htmlFor="catalog-category">
              Категория
            </label>
            <select
              id="catalog-category"
              className={utilStyles.text_input}
              value={categoryId}
              onChange={(event) => updateParams({ categoryId: event.target.value })}
            >
              {categoryOptions.map((item) => (
                <option key={item.id || 'all'} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className={catalogStyles.panel_block}>
            <p className={utilStyles.field_label}>Популярные категории</p>
            <div className={catalogStyles.chip_list}>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${utilStyles.chip} ${String(categoryId) === String(item.id) ? utilStyles.active : ''}`}
                  onClick={() => updateParams({ categoryId: String(item.id) })}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className={utilStyles.success_box} style={{ padding: '18px', borderRadius: '12px', color: 'var(--text)' }}>
            <p style={{ margin: '0 0 8px', color: 'var(--text)', fontWeight: '800' }}>Нужна помощь с выбором?</p>
            <p style={{ color: 'var(--muted)' }}>Оставьте заявку, и мы перезвоним в рабочее время.</p>
            <Link to="/callback" className={`${utilStyles.primary_button} ${utilStyles.full_width}`} style={{ marginTop: '12px' }}>
              Заказать звонок
            </Link>
          </div>
        </aside>

        <div className={catalogStyles.content}>
          <div className={catalogStyles.toolbar}>
            <p>
              Найдено товаров: <strong>{products.length}</strong>
            </p>
            <button type="button" className={utilStyles.link_button} onClick={() => setSearchParams({})}>
              Сбросить фильтры
            </button>
          </div>

          {productsError && <div className={catalogStyles.track_result}>{productsError}</div>}
          {productsStatus === 'loading' && <div className={catalogStyles.track_result}>Загружаем каталог...</div>}

          <div className={catalogStyles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className={catalogStyles.track_section} id="track-order">
        <div className={catalogStyles.track_copy}>
          <p className={utilStyles.eyebrow}>Отследить заказ</p>
          <h2>Проверьте статус заказа по номеру и телефону</h2>
        </div>

        <form className={catalogStyles.track_form} onSubmit={handleTrackSubmit}>
          <label className={utilStyles.field_label} htmlFor="track-order-number">
            Номер заказа
          </label>
          <input
            id="track-order-number"
            className={utilStyles.text_input}
            name="orderNumber"
            value={trackForm.orderNumber}
            onChange={handleTrackChange}
            placeholder="например, 10254"
          />

          <label className={utilStyles.field_label} htmlFor="track-phone">
            Телефон
          </label>
          <input
            id="track-phone"
            className={utilStyles.text_input}
            name="phone"
            value={trackForm.phone}
            onChange={handleTrackChange}
            placeholder="+7 (999) 123-45-67"
          />

          <button
            type="submit"
            className={utilStyles.primary_button} 
            style={{ width: '100%' }}
            disabled={trackStatus === 'loading'}
          >
            {trackStatus === 'loading' ? 'Ищем...' : 'Отследить'}
          </button>

          {trackResult && <div className={catalogStyles.track_result}>{trackResult}</div>}
        </form>
      </section>

      <section className={catalogStyles.about_contact_grid}>
        <article className={catalogStyles.info_card}>
          <p className={utilStyles.eyebrow}>О нас</p>
          <h2 className={catalogStyles.info_title}>Мы подбираем лампы под каждый интерьер</h2>
          <p className={catalogStyles.info_description}>
            Lampashop — это витрина лампочек для дома, кухни, витрин и декоративных
            светильников. Мы делаем акцент на качественных фото, понятной навигации и
            быстром выборе.
          </p>
        </article>

        <article className={catalogStyles.info_card}>
          <p className={utilStyles.eyebrow}>Контактные данные</p>
          <h2 className={catalogStyles.info_title}>Свяжитесь с нами любым удобным способом</h2>
          <ul className={catalogStyles.contact_list}>
            <li>Адрес: Москва, ул. Светлая, д. 12</li>
            <li>Телефон: +7 (495) 123-45-67</li>
            <li>Часы работы: ежедневно 09:00–21:00</li>
          </ul>
          <div className={catalogStyles.social_links}>
            <a href="https://t.me/" target="_blank" rel="noreferrer" aria-label="Telegram">
              <span className={`${catalogStyles.social_icon} ${catalogStyles.telegram}`}>✈</span>
            </a>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <span className={`${catalogStyles.social_icon} ${catalogStyles.instagram}`}>◎</span>
            </a>
          </div>
        </article>
      </section>

    </div>
  )
}
