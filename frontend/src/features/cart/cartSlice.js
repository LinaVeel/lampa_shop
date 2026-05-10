import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  addCartItem,
  clearCart as clearCartRequest,
  deleteCartItem,
  getCartItems,
  updateCartItem,
} from '../../api/orders'
import { ensureCartSessionId, loadStoredCartSessionId, storeCartSessionId } from '../../utils/cartSession'

const LOCAL_CART_ITEMS_KEY = 'lampashop_local_cart_items'

const initialState = {
  sessionId: loadStoredCartSessionId(),
  items: [],
  status: 'idle',
  error: null,
  lastMutation: null,
}

function syncItems(state, item) {
  const index = state.items.findIndex((entry) => entry.id === item.id)

  if (index >= 0) {
    state.items[index] = item
    return
  }

  state.items.push(item)
}

function loadLocalCartItems() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawItems = window.localStorage.getItem(LOCAL_CART_ITEMS_KEY)
    const parsedItems = rawItems ? JSON.parse(rawItems) : []
    return Array.isArray(parsedItems) ? parsedItems : []
  } catch {
    return []
  }
}

function storeLocalCartItems(items) {
  if (typeof window === 'undefined') {
    return
  }

  if (items.length === 0) {
    window.localStorage.removeItem(LOCAL_CART_ITEMS_KEY)
    return
  }

  window.localStorage.setItem(LOCAL_CART_ITEMS_KEY, JSON.stringify(items))
}

function createLocalSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `local-${crypto.randomUUID()}`
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createLocalCartItem(product, quantity) {
  return {
    id: Date.now(),
    cart_id: 'local-cart',
    product_id: product.id,
    product_name: product.name,
    price_snapshot: product.price,
    quantity,
  }
}

function upsertLocalCartItem(items, product, quantity) {
  const existingIndex = items.findIndex((item) => item.product_id === product.id)

  if (existingIndex >= 0) {
    const nextItems = [...items]
    nextItems[existingIndex] = {
      ...nextItems[existingIndex],
      product_name: product.name,
      price_snapshot: product.price,
      quantity: nextItems[existingIndex].quantity + quantity,
    }
    return nextItems
  }

  return [...items, createLocalCartItem(product, quantity)]
}

function updateLocalCartItem(items, itemId, quantity) {
  return items
    .map((item) => (item.id === itemId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0)
}

function getLocalSessionId() {
  return loadStoredCartSessionId() || createLocalSessionId()
}

function clearLocalCartItems() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(LOCAL_CART_ITEMS_KEY)
}

export const bootstrapCart = createAsyncThunk('cart/bootstrap', async () => {
  try {
    const sessionId = await ensureCartSessionId()
    const items = await getCartItems(sessionId)
    storeLocalCartItems(items)
    return { sessionId, items }
  } catch {
    const sessionId = getLocalSessionId()
    const items = loadLocalCartItems()
    storeCartSessionId(sessionId)
    return { sessionId, items }
  }
})

export const addItemToCart = createAsyncThunk('cart/addItem', async ({ product, quantity = 1 }) => {
  try {
    const sessionId = await ensureCartSessionId()
    const item = await addCartItem(sessionId, {
      product_id: product.id,
      product_name: product.name,
      price_snapshot: product.price,
      quantity,
    })

    return { sessionId, item, productId: product.id, quantity }
  } catch {
    const sessionId = getLocalSessionId()
    const items = upsertLocalCartItem(loadLocalCartItems(), product, quantity)
    storeCartSessionId(sessionId)
    storeLocalCartItems(items)

    return {
      sessionId,
      item: items[items.length - 1],
      productId: product.id,
      quantity,
    }
  }
})

export const updateItemQuantity = createAsyncThunk(
  'cart/updateItemQuantity',
  async ({ itemId, quantity }) => {
    try {
      const sessionId = await ensureCartSessionId()
      const item = await updateCartItem(sessionId, itemId, quantity)
      return { sessionId, item }
    } catch {
      const sessionId = getLocalSessionId()
      const items = updateLocalCartItem(loadLocalCartItems(), itemId, quantity)
      storeCartSessionId(sessionId)
      storeLocalCartItems(items)
      const item = items.find((entry) => entry.id === itemId) || null
      return { sessionId, item }
    }
  }
)

export const removeItemFromCart = createAsyncThunk('cart/removeItem', async (itemId) => {
  try {
    const sessionId = await ensureCartSessionId()
    await deleteCartItem(sessionId, itemId)
    return { sessionId, itemId }
  } catch {
    const sessionId = getLocalSessionId()
    const items = loadLocalCartItems().filter((item) => item.id !== itemId)
    storeCartSessionId(sessionId)
    storeLocalCartItems(items)
    return { sessionId, itemId }
  }
})

export const clearCartOnServer = createAsyncThunk('cart/clearCartOnServer', async () => {
  try {
    const sessionId = await ensureCartSessionId()
    await clearCartRequest(sessionId)
    return { sessionId }
  } catch {
    const sessionId = getLocalSessionId()
    storeCartSessionId(sessionId)
    storeLocalCartItems([])
    return { sessionId }
  }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartState(state) {
      state.items = []
      state.lastMutation = null
      clearLocalCartItems()
    },
  },
  extraReducers(builder) {
    builder
      .addCase(bootstrapCart.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(bootstrapCart.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.sessionId = action.payload.sessionId
        state.items = action.payload.items
        storeCartSessionId(action.payload.sessionId)
        storeLocalCartItems(action.payload.items)
      })
      .addCase(bootstrapCart.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to load cart'
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        syncItems(state, action.payload.item)
        storeLocalCartItems(state.items)
        state.lastMutation = {
          productId: action.payload.productId,
          quantity: action.payload.quantity,
          timestamp: Date.now(),
        }
      })
      .addCase(updateItemQuantity.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        if (action.payload.item) {
          syncItems(state, action.payload.item)
        }
        storeLocalCartItems(state.items)
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        state.items = state.items.filter((item) => item.id !== action.payload.itemId)
        storeLocalCartItems(state.items)
      })
      .addCase(clearCartOnServer.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        state.items = []
        state.lastMutation = null
        storeLocalCartItems([])
      })
  },
})

export const { resetCartState } = cartSlice.actions

export default cartSlice.reducer
