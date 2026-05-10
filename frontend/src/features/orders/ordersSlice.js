import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createDeliveryOrder, loadOrdersBySession, trackOrder } from '../../api/orders'

const LAST_ORDER_STORAGE_KEY = 'lampashop_last_order'
const LOCAL_ORDERS_STORAGE_KEY = 'lampashop_local_orders'
const LOCAL_ORDER_SEQUENCE_KEY = 'lampashop_local_order_sequence'

function loadJsonFromStorage(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  const rawValue = window.localStorage.getItem(key)
  if (!rawValue) {
    return fallbackValue
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return fallbackValue
  }
}

function saveJsonToStorage(key, value) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function loadLastOrder() {
  return loadJsonFromStorage(LAST_ORDER_STORAGE_KEY, null)
}

function loadLocalOrders() {
  const orders = loadJsonFromStorage(LOCAL_ORDERS_STORAGE_KEY, [])
  return Array.isArray(orders) ? orders : []
}

function storeLocalOrders(orders) {
  saveJsonToStorage(LOCAL_ORDERS_STORAGE_KEY, orders)
}

function loadLocalOrderSequence() {
  const value = loadJsonFromStorage(LOCAL_ORDER_SEQUENCE_KEY, 10000)
  return Number.isFinite(Number(value)) ? Number(value) : 10000
}

function storeLocalOrderSequence(value) {
  saveJsonToStorage(LOCAL_ORDER_SEQUENCE_KEY, value)
}

function nextLocalOrderId() {
  const nextId = loadLocalOrderSequence() + 1
  storeLocalOrderSequence(nextId)
  return nextId
}

function toOrderItem(item, index) {
  const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price_snapshot ?? 0)
  const quantity = Number(item.quantity ?? 1)
  const lineTotal = unitPrice * quantity

  return {
    id: item.id ?? index + 1,
    product_id: item.productId ?? item.product_id ?? null,
    product_name: item.productName ?? item.product_name ?? 'Товар',
    productName: item.productName ?? item.product_name ?? 'Товар',
    quantity,
    unit_price: unitPrice,
    unitPrice,
    line_total: lineTotal,
    lineTotal,
  }
}

function createLocalOrder(payload) {
  const orderItems = (payload.items || []).map(toOrderItem)
  const totalAmount = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const now = new Date().toISOString()
  const order = {
    id: nextLocalOrderId(),
    session_id: payload.session_id,
    recipient_name: payload.recipient_name,
    recipient_phone: payload.recipient_phone,
    tracking_number: null,
    delivery_type: payload.delivery_type,
    delivery_address: payload.delivery_address || null,
    pickup_point_id: payload.pickup_point_id || null,
    payment_method: payload.payment_method,
    payment_status: 'pending',
    status: 'pending',
    status_updated_at: now,
    total_amount: totalAmount,
    totalAmount,
    comment: payload.comment || null,
    created_at: now,
    updated_at: now,
    items: orderItems,
  }

  const existingOrders = loadLocalOrders().filter((item) => item.id !== order.id)
  const nextOrders = [order, ...existingOrders]
  storeLocalOrders(nextOrders)
  saveJsonToStorage(LAST_ORDER_STORAGE_KEY, order)

  return order
}

function findLocalOrder(orderId, recipientPhone) {
  const numericOrderId = Number(orderId)
  return loadLocalOrders().find(
    (order) => Number(order.id) === numericOrderId && String(order.recipient_phone) === String(recipientPhone)
  ) || null
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

    try {
      return await loadOrdersBySession(sessionId)
    } catch {
      return loadLocalOrders().filter((order) => order.session_id === sessionId)
    }
  }
)

export const submitDeliveryOrder = createAsyncThunk(
  'orders/submitDeliveryOrder',
  async ({ sessionId, recipientName, recipientPhone, deliveryAddress, paymentMethod, comment }) => {
    const requestPayload = {
      session_id: sessionId,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      delivery_type: 'delivery',
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      comment,
    }

    try {
      const order = await createDeliveryOrder(requestPayload)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order))
      }

      return order
    } catch {
      const localOrder = createLocalOrder({
        ...requestPayload,
        items: loadJsonFromStorage('lampashop_local_cart_items', []),
      })
      return localOrder
    }
  }
)

export const submitOrderTracking = createAsyncThunk(
  'orders/submitOrderTracking',
  async ({ orderId, recipientPhone }) => {
    try {
      return await trackOrder({
        order_id: Number(orderId),
        recipient_phone: recipientPhone,
      })
    } catch {
      const localOrder = findLocalOrder(orderId, recipientPhone)

      if (!localOrder) {
        throw new Error('Заказ не найден, проверьте корректность вводных данных.')
      }

      return localOrder
    }
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
