import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Header from './components/Header'
import Catalog from './pages/Catalog'
import ProductPage from './pages/Product'
import CartPage from './pages/Cart'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import CallbackPage from './pages/Callback'
import { bootstrapCart } from './features/cart/cartSlice'
import { fetchCategories } from './features/products/productsSlice'
import { fetchOrdersBySession } from './features/orders/ordersSlice'

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    let isActive = true

    dispatch(fetchCategories())
    dispatch(bootstrapCart())
      .unwrap()
      .then(({ sessionId }) => {
        if (isActive && sessionId) {
          dispatch(fetchOrdersBySession(sessionId))
        }
      })
      .catch(() => {})

    return () => {
      isActive = false
    }
  }, [dispatch])

  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </main>
    </div>
  )
}
