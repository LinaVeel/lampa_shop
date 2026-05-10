import { createSelector } from '@reduxjs/toolkit'
import { resolveProductImage } from '../utils/productImages'

const selectProductItems = (state) => state.products.items
const selectCategoryItems = (state) => state.products.categories
const selectSelectedProductRaw = (state) => state.products.selectedItem
const selectCartItems = (state) => state.cart.items

export const selectCatalogProducts = createSelector(
  [selectProductItems, selectCategoryItems],
  (products, categories) => {
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]))

    return products.map((product) => ({
      ...product,
      image: resolveProductImage(product.id),
      categoryName: categoryMap.get(product.category_id) || 'Без категории',
    }))
  }
)

export const selectSelectedProduct = createSelector(
  [selectSelectedProductRaw, selectCategoryItems],
  (product, categories) => {
    if (!product) {
      return null
    }

    const categoryMap = new Map(categories.map((category) => [category.id, category.name]))

    return {
      ...product,
      image: resolveProductImage(product.id),
      categoryName: categoryMap.get(product.category_id) || 'Без категории',
    }
  }
)

export const selectCartViewItems = createSelector(
  [selectCartItems, selectCatalogProducts],
  (cartItems, products) => {
    const productById = new Map(products.map((product) => [product.id, product]))

    return cartItems.map((item) => {
      const product = productById.get(item.product_id)
      const unitPrice = Number(item.price_snapshot)

      return {
        ...item,
        product,
        productId: item.product_id,
        productName: product?.name || item.product_name,
        categoryName: product?.categoryName || 'Без категории',
        image: product?.image || resolveProductImage(item.product_id),
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      }
    })
  }
)

export const selectCartCount = createSelector([selectCartItems], (items) => {
  return items.reduce((sum, item) => sum + item.quantity, 0)
})

export const selectCartTotal = createSelector([selectCartViewItems], (items) => {
  return items.reduce((sum, item) => sum + item.lineTotal, 0)
})

export const selectProductListStatus = (state) => state.products.listStatus
export const selectProductDetailStatus = (state) => state.products.detailStatus
export const selectCategories = (state) => state.products.categories
export const selectProductsError = (state) => state.products.error
export const selectProductsCategoriesStatus = (state) => state.products.categoriesStatus
export const selectCartStatus = (state) => state.cart.status
export const selectCartError = (state) => state.cart.error
export const selectCartSessionId = (state) => state.cart.sessionId
export const selectCartLastMutation = (state) => state.cart.lastMutation
export const selectCurrentOrder = (state) => state.orders.currentOrder
export const selectOrdersHistory = (state) => state.orders.history
export const selectTrackedOrder = (state) => state.orders.trackedOrder
export const selectOrdersStatus = (state) => state.orders.status
export const selectOrdersTrackStatus = (state) => state.orders.trackStatus
export const selectOrdersHistoryStatus = (state) => state.orders.historyStatus
