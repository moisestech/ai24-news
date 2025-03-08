export const imageUtils = {
  optimizeUrl: (url: string, { width = 800, quality = 80 } = {}) => {
    // If it's already an optimized URL, return as is
    if (url.includes('imagekit.io')) return url
    
    // For demo, we'll use a simple resize parameter
    // In production, use a proper image optimization service
    return `${url}?w=${width}&q=${quality}`
  },

  getPlaceholder: (width = 800, height = 600) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3C/svg%3E`
  },

  preloadImage: (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = src
      img.onload = () => resolve(src)
      img.onerror = reject
    })
  }
} 