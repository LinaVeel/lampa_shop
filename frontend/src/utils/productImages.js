const PRODUCT_IMAGES = {
  1: '/images/products/Screenshot%20from%202026-05-03%2014-26-58.png',
  2: '/images/products/Screenshot%20from%202026-05-03%2014-27-12.png',
  3: '/images/products/Screenshot%20from%202026-05-03%2014-27-34.png',
  4: '/images/products/Screenshot%20from%202026-05-03%2014-27-58.png',
  5: '/images/products/Screenshot%20from%202026-05-03%2014-28-07.png',
  6: '/images/products/Screenshot%20from%202026-05-03%2014-28-17.png',
  7: '/images/products/Screenshot%20from%202026-05-03%2014-28-38.png',
  8: '/images/products/Screenshot%20from%202026-05-03%2014-29-11.png',
  9: '/images/products/Screenshot%20from%202026-05-03%2014-30-27.png',
  10: '/images/products/Screenshot%20from%202026-05-03%2014-30-38.png',
  11: '/images/products/Screenshot%20from%202026-05-03%2014-30-50.png',
  12: '/images/products/Screenshot%20from%202026-05-03%2014-30-59.png',
}

export function resolveProductImage(productId) {
  return PRODUCT_IMAGES[productId] || '/images/products/Screenshot%20from%202026-05-03%2014-26-58.png'
}
