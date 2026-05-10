import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loadCategories, loadProductById, loadProducts } from '../../api/products'

const initialState = {
  items: [],
  categories: [],
  selectedItem: null,
  listStatus: 'idle',
  detailStatus: 'idle',
  categoriesStatus: 'idle',
  error: null,
}

export const fetchCategories = createAsyncThunk('products/fetchCategories', async () => {
  return loadCategories()
})

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (filters = {}) => {
  return loadProducts(filters)
})

export const fetchProductById = createAsyncThunk('products/fetchProductById', async (productId) => {
  return loadProductById(productId)
})

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSelectedProduct(state) {
      state.selectedItem = null
      state.detailStatus = 'idle'
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesStatus = 'loading'
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesStatus = 'succeeded'
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesStatus = 'failed'
        state.error = action.error.message || 'Failed to load categories'
      })
      .addCase(fetchProducts.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error = action.error.message || 'Failed to load products'
      })
      .addCase(fetchProductById.pending, (state) => {
        state.detailStatus = 'loading'
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.selectedItem = action.payload
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.selectedItem = null
        state.error = action.error.message || 'Failed to load product'
      })
  },
})

export const { clearSelectedProduct } = productsSlice.actions

export default productsSlice.reducer
