import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  addCartItem,
  clearCart as clearCartRequest,
  deleteCartItem,
  getCartItems,
  updateCartItem,
} from '../../api/orders'
import { ensureCartSessionId, loadStoredCartSessionId, storeCartSessionId } from '../../utils/cartSession'

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

export const bootstrapCart = createAsyncThunk('cart/bootstrap', async () => {
  const sessionId = await ensureCartSessionId()
  const items = await getCartItems(sessionId)
  return { sessionId, items }
})

export const addItemToCart = createAsyncThunk('cart/addItem', async ({ product, quantity = 1 }) => {
  const sessionId = await ensureCartSessionId()
  const item = await addCartItem(sessionId, {
    product_id: product.id,
    product_name: product.name,
    price_snapshot: product.price,
    quantity,
  })

  return { sessionId, item, productId: product.id, quantity }
})

export const updateItemQuantity = createAsyncThunk(
  'cart/updateItemQuantity',
  async ({ itemId, quantity }) => {
    const sessionId = await ensureCartSessionId()
    const item = await updateCartItem(sessionId, itemId, quantity)
    return { sessionId, item }
  }
)

export const removeItemFromCart = createAsyncThunk('cart/removeItem', async (itemId) => {
  const sessionId = await ensureCartSessionId()
  await deleteCartItem(sessionId, itemId)
  return { sessionId, itemId }
})

export const clearCartOnServer = createAsyncThunk('cart/clearCartOnServer', async () => {
  const sessionId = await ensureCartSessionId()
  await clearCartRequest(sessionId)
  return { sessionId }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartState(state) {
      state.items = []
      state.lastMutation = null
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
      })
      .addCase(bootstrapCart.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to load cart'
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        syncItems(state, action.payload.item)
        state.lastMutation = {
          productId: action.payload.productId,
          quantity: action.payload.quantity,
          timestamp: Date.now(),
        }
      })
      .addCase(updateItemQuantity.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        syncItems(state, action.payload.item)
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        state.items = state.items.filter((item) => item.id !== action.payload.itemId)
      })
      .addCase(clearCartOnServer.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        storeCartSessionId(action.payload.sessionId)
        state.items = []
        state.lastMutation = null
      })
  },
})

export const { resetCartState } = cartSlice.actions

export default cartSlice.reducer
