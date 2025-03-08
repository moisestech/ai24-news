export const validateInput = {
  email: (email: string) => {
    if (!email) throw new Error('Email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format')
    }
    return true
  },

  newsHeadline: (headline: string) => {
    if (!headline?.trim()) throw new Error('Headline is required')
    if (headline.length > 200) throw new Error('Headline too long')
    return headline.trim()
  },

  imageUrl: (url: string) => {
    if (!url) throw new Error('Image URL is required')
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    if (!validExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
      throw new Error('Invalid image format')
    }
    return true
  }
}

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateImageUrl = (url: string): boolean => {
  return url.startsWith('https://') && (
    url.endsWith('.jpg') || 
    url.endsWith('.png') || 
    url.endsWith('.webp')
  )
}

export const sanitizeUserInput = (input: string): string => {
  return input.trim().slice(0, 1000) // Reasonable length limit
} 