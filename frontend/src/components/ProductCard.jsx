import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../features/cart/cartSlice'
import { selectCartLastMutation, selectCartViewItems } from '../store/selectors'
import { formatRubles } from '../utils/money'
import cardStyles from '../styles/ProductCard.module.css'
import utilStyles from '../styles/utilities.module.css'

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartViewItems)
  const lastMutation = useSelector(selectCartLastMutation)
  const [clicked, setClicked] = useState(false)

  const currentQuantity = cartItems.find((entry) => entry.productId === product.id)?.quantity ?? 0
  const justAdded = lastMutation?.productId === product.id

  useEffect(() => {
    if (!clicked) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setClicked(false), 1300)
    return () => window.clearTimeout(timeoutId)
  }, [clicked])

  function handleAdd() {
    dispatch(addItemToCart({ product, quantity: 1 }))
    setClicked(true)
  }

  return (
    <div className={cardStyles.card}>
      <Link to={`/product/${product.id}`} className={cardStyles.image_link}>
        <img src={product.image} alt={product.name} />
        <span className={cardStyles.badge}>{product.categoryName}</span>
      </Link>
      <div className={cardStyles.info}>
        <h3 className={cardStyles.title}>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p style={{ color: 'var(--muted)' }}>{product.description}</p>
        <div className={cardStyles.meta}>
          <p className={cardStyles.price}>{formatRubles(product.price)}</p>
          <span>{product.stock_quantity} в наличии</span>
        </div>
        <button
          className={`${utilStyles.primary_button} ${utilStyles.full_width} ${clicked ? utilStyles.button_active : ''}`}
          onClick={handleAdd}
        >
          {currentQuantity > 0 ? `В корзине: ${currentQuantity}` : justAdded ? 'Добавлено' : 'В корзину'}
        </button>
      </div>
    </div>
  )
}
