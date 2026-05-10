import { products as mockProducts, categories as mockCategories } from '../mock/products'
import { PRODUCTS_API_BASE, buildUrl, requestJson } from './http'

function toMockCategoryRows() {
  return mockCategories.slice(1).map((name, index) => ({
    id: index + 1,
    name,
    slug: name.toLowerCase(),
    parent_id: null,
    created_at: null,
  }))
}

function toMockProductRows() {
  const categoryByName = new Map(toMockCategoryRows().map((category) => [category.name, category.id]))

  return mockProducts.map((product) => ({
    id: product.id,
    category_id: categoryByName.get(product.category) || null,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stock_quantity: product.stock_quantity,
    is_active: true,
    created_at: null,
    updated_at: null,
  }))
}

function filterMockProducts(filters = {}) {
  const search = (filters.search || '').trim().toLowerCase()
  const categoryId = filters.categoryId ? Number(filters.categoryId) : null

  return toMockProductRows().filter((product) => {
    if (categoryId && product.category_id !== categoryId) {
      return false
    }

    if (!search) {
      return true
    }

    return [product.name, product.description, product.slug].some((value) =>
      String(value).toLowerCase().includes(search)
    )
  })
}

export async function loadCategories() {
  try {
    const payload = await requestJson(buildUrl(PRODUCTS_API_BASE, '/api/categories/', { limit: 100 }))
    return payload?.data?.length ? payload.data : toMockCategoryRows()
  } catch {
    return toMockCategoryRows()
  }
}

export async function loadProducts(filters = {}) {
  try {
    const payload = await requestJson(
      buildUrl(PRODUCTS_API_BASE, '/api/products/', {
        limit: 100,
        is_active: true,
        search: filters.search,
        category_id: filters.categoryId,
      })
    )

    return payload?.data?.length ? payload.data : filterMockProducts(filters)
  } catch {
    return filterMockProducts(filters)
  }
}

export async function loadProductById(productId) {
  try {
    const payload = await requestJson(buildUrl(PRODUCTS_API_BASE, `/api/products/${productId}`))
    return payload?.data || toMockProductRows().find((product) => String(product.id) === String(productId)) || null
  } catch {
    return toMockProductRows().find((product) => String(product.id) === String(productId)) || null
  }
}
