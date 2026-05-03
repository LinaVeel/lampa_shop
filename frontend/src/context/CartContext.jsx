import React, { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [lastAdded, setLastAdded] = useState(null)

  function addToCart(product, quantity = 1) {
    setLastAdded({ productId: product.id, quantity, timestamp: Date.now() })

    setItems((prev) => {
      const found = prev.find((p) => p.product.id === product.id)
      if (found) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + quantity } : it
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  function updateQuantity(productId, quantity) {
    setItems((prev) => prev.map((it) => (it.product.id === productId ? { ...it, quantity } : it)))
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((it) => it.product.id !== productId))
  }

  function clearCart() {
    setItems([])
  }

  const value = { items, addToCart, updateQuantity, removeItem, clearCart, lastAdded }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
