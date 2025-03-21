import { useAtom } from 'jotai'
import { imageGenerationAtom, currentNewsAtom, userLimitAtom } from '../lib/atoms'

export function useImageGeneration() {
  const [imageState, setImageState] = useAtom(imageGenerationAtom)
  const [currentNews] = useAtom(currentNewsAtom)
  const [userLimit, setUserLimit] = useAtom(userLimitAtom)

  const generateImage = async (style?: string) => {
    if (!currentNews) return

    setImageState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch('/api/generateImages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentNews.headline,
          iterativeMode: false,
          style
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      
      setImageState({
        loading: false,
        error: null,
        imageUrl: `data:image/png;base64,${data}`
      })

      // Update user's remaining limit
      setUserLimit(prev => prev - 1)

    } catch (error) {
      setImageState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
        imageUrl: null
      })
    }
  }

  return {
    generateImage,
    imageState,
    remainingLimit: userLimit
  }
} 