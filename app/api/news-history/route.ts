export async function GET() {
  try {
    const response = await fetch('/api/news-history')
    if (!response.ok) throw new Error('Failed to fetch history')
    
    const data = await response.json()
    return Response.json(data)
  } catch (err) {
    console.error('Failed to fetch news history:', err)
    return Response.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
} 