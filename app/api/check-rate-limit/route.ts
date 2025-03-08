import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { z } from 'zod'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '1440 m'), // 5 requests per day
  analytics: true,
  prefix: 'ai-news'
})

const schema = z.object({
  email: z.string().email()
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { email } = schema.parse(json)

    const identifier = `email:${email}`
    const { success, remaining } = await ratelimit.limit(identifier)

    if (!success) {
      return Response.json(
        { error: 'Rate limit exceeded', remaining: 0 },
        { status: 429 }
      )
    }

    return Response.json({ success: true, remaining })
  } catch (err) {
    console.error('Rate limit check failed:', err)
    return Response.json({ error: 'Failed to check rate limit' }, { status: 500 })
  }
} 