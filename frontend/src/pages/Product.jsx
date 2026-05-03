import React from 'react'
import { useParams } from 'react-router-dom'
import { products } from '../mock/products'
import { useCart } from '../context/CartContext'
import { formatRubles } from '../utils/money'

export default function ProductPage() {
  const { id } = useParams()
  const product = products.find((p) => String(p.id) === String(id))
  const { addToCart } = useCart()

  if (!product) return <p>Товар не найден</p>

  return (
    <div className="product-page">
      <h1>{product.name}</h1>
      <div className="product-detail">
        <img src={product.image} alt={product.name} />
        <div>
          <p>{product.description}</p>
          <p className="price">{formatRubles(product.price)}</p>
          <button className="primary-button" onClick={() => addToCart(product, 1)}>Добавить в корзину</button>
        </div>
      </div>
    </div>
  )
}
