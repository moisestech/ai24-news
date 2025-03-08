export async function GET() {
  try {
    const response = await fetch(`http://api.mediastack.com/v1/news`, {
      headers: {
        'Authorization': `Bearer ${process.env.MEDIASTACK_API_KEY}`
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch news')
    
    const data = await response.json()
    // Process and return top headline
    return Response.json({
      headline: data.headlines[0].title,
      source: data.headlines[0].source,
      url: data.headlines[0].url
    })
  } catch (err) {
    console.error('News fetch failed:', err)
    return Response.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
} 