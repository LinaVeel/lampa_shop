import { ORDERS_API_BASE, buildUrl, requestJson } from './http'

export async function createCart() {
  return requestJson(buildUrl(ORDERS_API_BASE, '/api/carts'), { method: 'POST' })
}

export async function getCart(sessionId) {
  return requestJson(buildUrl(ORDERS_API_BASE, `/api/carts/${sessionId}`))
}

export async function getCartItems(sessionId) {
  return requestJson(buildUrl(ORDERS_API_BASE, `/api/carts/${sessionId}/items`))
}

export async function addCartItem(sessionId, payload) {
  return requestJson(buildUrl(ORDERS_API_BASE, `/api/carts/${sessionId}/items`), {
    method: 'POST',
    body: payload,
  })
}

export async function updateCartItem(sessionId, itemId, quantity) {
  return requestJson(buildUrl(ORDERS_API_BASE, `/api/carts/${sessionId}/items/${itemId}`), {
    method: 'PATCH',
    body: { quantity },
  })
}

export async function deleteCartItem(sessionId, itemId) {
  return requestJson(buildUrl(ORDERS_API_BASE, `/api/carts/${sessionId}/items/${itemId}`), {
    method: 'DELETE',
  })
}

export async function clearCart(sessionId) {
  return requestJson(buildUrl(ORDERS_API_BASE, `/api/carts/${sessionId}/items`), {
    method: 'DELETE',
  })
}

export async function createDeliveryOrder(payload) {
  return requestJson(buildUrl(ORDERS_API_BASE, '/api/orders'), {
    method: 'POST',
    body: payload,
  })
}

export async function trackOrder(payload) {
  return requestJson(buildUrl(ORDERS_API_BASE, '/api/orders/track'), {
    method: 'POST',
    body: payload,
  })
}

export async function loadOrdersBySession(sessionId) {
  return requestJson(buildUrl(ORDERS_API_BASE, `/api/orders/session/${sessionId}`))
}
