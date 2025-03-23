import { NextResponse } from 'next/server'
import { validateElevenLabsApiKey, validateTogetherApiKey, getEnvironmentInfo } from '@/lib/utils/validation'
import { elevenLabsApi } from '@/lib/elevenlabs'

export async function GET() {
  try {
    const elevenLabsValidation = elevenLabsApi.getValidationDetails()
    const togetherValidation = validateTogetherApiKey()
    const environmentInfo = getEnvironmentInfo()

    return NextResponse.json({
      elevenLabsValidation,
      togetherValidation,
      environmentInfo
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check API status' },
      { status: 500 }
    )
  }
} 