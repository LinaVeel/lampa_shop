import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatRubles } from '../utils/money'

export default function ProductCard({ product }) {
  const { addToCart, items, lastAdded } = useCart()
  const [clicked, setClicked] = useState(false)

  const currentQuantity = useMemo(() => {
    const item = items.find((entry) => entry.product.id === product.id)
    return item?.quantity ?? 0
  }, [items, product.id])

  useEffect(() => {
    if (!clicked) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setClicked(false), 1300)
    return () => window.clearTimeout(timeoutId)
  }, [clicked])

  const justAdded = lastAdded?.productId === product.id

  function handleAdd() {
    addToCart(product)
    setClicked(true)
  }

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link">
        <img src={product.image} alt={product.name} />
        <span className="product-badge">{product.category}</span>
      </Link>
      <div className="product-info">
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-description">{product.description}</p>
        <div className="product-meta">
          <p className="price">{formatRubles(product.price)}</p>
          <span>{product.stock_quantity} в наличии</span>
        </div>
        <button className={`primary-button full-width ${clicked ? 'button-active' : ''}`} onClick={handleAdd}>
          {currentQuantity > 0 ? `В корзине: ${currentQuantity}` : justAdded ? 'Добавлено' : 'В корзину'}
        </button>
      </div>
    </div>
  )
}
