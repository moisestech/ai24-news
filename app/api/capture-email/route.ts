import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const emailSchema = z.object({
  email: z.string().email()
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { email } = emailSchema.parse(json)

    const { error } = await supabase
      .from('emails')
      .insert([{ email }])
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Email capture failed:', err)
    return Response.json({ error: 'Failed to capture email' }, { status: 500 })
  }
} 