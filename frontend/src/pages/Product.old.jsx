import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../features/cart/cartSlice'
import { fetchProductById } from '../features/products/productsSlice'
import { selectProductDetailStatus, selectSelectedProduct } from '../store/selectors'
import { formatRubles } from '../utils/money'

export default function ProductPage() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const product = useSelector(selectSelectedProduct)
  const detailStatus = useSelector(selectProductDetailStatus)

  useEffect(() => {
    dispatch(fetchProductById(id))
  }, [dispatch, id])

  if (detailStatus === 'loading') {
    return <div className="page-status">Загружаем товар...</div>
  }

  if (!product) {
    return (
      <div className="page-status">
        <h1>Товар не найден</h1>
        <Link to="/catalog" className="primary-button">
          Вернуться в каталог
        </Link>
      </div>
    )
  }

  return (
    <div className="product-page">
      <section className="page-header-card">
        <p className="eyebrow">Карточка товара</p>
        <h1>{product.name}</h1>
        <p>{product.categoryName}</p>
      </section>

      <div className="product-detail">
        <img src={product.image} alt={product.name} />
        <div>
          <p>{product.description}</p>
          <p className="price">{formatRubles(product.price)}</p>
          <div className="product-meta">
            <span>{product.stock_quantity} в наличии</span>
            <span>{product.categoryName}</span>
          </div>
          <button
            className="primary-button"
            onClick={() => dispatch(addItemToCart({ product, quantity: 1 }))}
          >
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>
  )
}
