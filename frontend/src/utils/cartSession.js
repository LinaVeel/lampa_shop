import { createCart, getCart } from '../api/orders'

const STORAGE_KEY = 'lampashop_cart_session_id'
let sessionPromise = null

export function loadStoredCartSessionId() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(STORAGE_KEY) || ''
}

export function storeCartSessionId(sessionId) {
  if (typeof window === 'undefined') {
    return
  }

  if (sessionId) {
    window.localStorage.setItem(STORAGE_KEY, sessionId)
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export async function ensureCartSessionId() {
  if (sessionPromise) {
    return sessionPromise
  }

  sessionPromise = (async () => {
    const storedSessionId = loadStoredCartSessionId()

    if (storedSessionId) {
      try {
        await getCart(storedSessionId)
        return storedSessionId
      } catch {
        storeCartSessionId('')
      }
    }

    const createdCart = await createCart()
    storeCartSessionId(createdCart.session_id)
    return createdCart.session_id
  })()

  try {
    return await sessionPromise
  } finally {
    sessionPromise = null
  }
}
