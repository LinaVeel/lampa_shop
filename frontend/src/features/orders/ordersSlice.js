import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createDeliveryOrder, loadOrdersBySession, trackOrder } from '../../api/orders'

const LAST_ORDER_STORAGE_KEY = 'lampashop_last_order'

function loadLastOrder() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(LAST_ORDER_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

const initialState = {
  currentOrder: loadLastOrder(),
  history: [],
  trackedOrder: null,
  status: 'idle',
  historyStatus: 'idle',
  trackStatus: 'idle',
  error: null,
}

export const fetchOrdersBySession = createAsyncThunk(
  'orders/fetchOrdersBySession',
  async (sessionId) => {
    if (!sessionId) {
      return []
    }

    return loadOrdersBySession(sessionId)
  }
)

export const submitDeliveryOrder = createAsyncThunk(
  'orders/submitDeliveryOrder',
  async ({ sessionId, recipientName, recipientPhone, deliveryAddress, paymentMethod, comment }) => {
    const order = await createDeliveryOrder({
      session_id: sessionId,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      delivery_type: 'delivery',
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      comment,
    })

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order))
    }

    return order
  }
)

export const submitOrderTracking = createAsyncThunk(
  'orders/submitOrderTracking',
  async ({ orderId, recipientPhone }) => {
    return trackOrder({
      order_id: Number(orderId),
      recipient_phone: recipientPhone,
    })
  }
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearTrackedOrder(state) {
      state.trackedOrder = null
      state.trackStatus = 'idle'
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchOrdersBySession.pending, (state) => {
        state.historyStatus = 'loading'
        state.error = null
      })
      .addCase(fetchOrdersBySession.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded'
        state.history = action.payload
      })
      .addCase(fetchOrdersBySession.rejected, (state, action) => {
        state.historyStatus = 'failed'
        state.error = action.error.message || 'Failed to load orders'
      })
      .addCase(submitDeliveryOrder.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(submitDeliveryOrder.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.currentOrder = action.payload
        state.history = [action.payload, ...state.history.filter((order) => order.id !== action.payload.id)]
      })
      .addCase(submitDeliveryOrder.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to create order'
      })
      .addCase(submitOrderTracking.pending, (state) => {
        state.trackStatus = 'loading'
        state.error = null
      })
      .addCase(submitOrderTracking.fulfilled, (state, action) => {
        state.trackStatus = 'succeeded'
        state.trackedOrder = action.payload
      })
      .addCase(submitOrderTracking.rejected, (state, action) => {
        state.trackStatus = 'failed'
        state.trackedOrder = null
        state.error = action.error.message || 'Failed to track order'
      })
  },
})

export const { clearTrackedOrder } = ordersSlice.actions

export default ordersSlice.reducer
