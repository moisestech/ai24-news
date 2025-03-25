# 🎙️ ElevenLabs Integration

## 📋 Quick Reference

| Component | Purpose | Documentation Link |
|:----------|:--------|:-------------------|
| **ElevenLabsService** | Core service for TTS generation | [Service Architecture](#api-integration) |
| **AudioAlignment** | Character timing data | [Audio Alignment System](#audio-visualization) |
| **AnimatedTranscript** | Text highlighting component | [Transcript Animation](#transcript-animation) |

```typescript
// Quick implementation example
const { generateAudio } = useAudioGeneration();

// Generate audio with default voice
const result = await generateAudio("Hello, world!");

// Access alignment data
const { audioUrl, alignment } = result;
```

---

## Overview

This document outlines how we integrate and use ElevenLabs' Text-to-Speech API in our application, including our custom audio visualization and transcript animation features.

## API Integration

### Service Layer
We maintain a singleton service (`ElevenLabsService`) that handles all API interactions:

```typescript
class ElevenLabsService {
  private readonly BASE_URL = 'https://api.elevenlabs.io/v1'
  private readonly DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
  
  // Generates speech with character-level timing
  public async generateSpeech({
    text,
    voiceId,
    onProgress
  }): Promise<ElevenLabsResponse>
}
```

Key features:
- Uses the `/text-to-speech/{voice_id}/with-timestamps` endpoint
- Returns both audio data and character-level timing information
- Supports progress callbacks for UI feedback
- Handles error cases and logging

## Audio Visualization

### 1. Waveform Visualization
We implement two types of audio visualizations:

#### 2D Canvas Visualization (`AudioVisualizer`)
- Real-time frequency analysis using Web Audio API
- Dynamic bar visualization with gradient effects
- Responsive to audio playback state
- Smooth animations with spring physics

#### 3D Three.js Visualization (`ThreeCanvas`)
- 3D bar visualization using Three.js
- Dynamic scaling based on frequency data
- Ambient and point lighting effects
- Smooth transitions and animations

### 2. Transcript Animation (`AnimatedTranscript`)
Our `AnimatedTranscript` component provides character-level highlighting:

```typescript
interface AudioAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}
```

Features:
- Character-level timing accuracy
- Word-level context preservation
- Smooth transitions between states
- Customizable colors and animations
- Fallback text support

## Audio Processing Flow

1. **Generation**
   ```typescript
   // 1. Generate speech with timing
   const data = await elevenLabsService.generateSpeech({
     text,
     voiceId,
     onProgress
   })

   // 2. Convert to blob and upload
   const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audio_base64}`)
     .then(r => r.blob())
   
   // 3. Store in Supabase
   const { data: uploadData } = await supabase.storage
     .from('news-media')
     .upload(filename, audioBlob)
   ```

2. **Playback**
   - Audio is served through our `/api/serve-audio` endpoint
   - Supports caching and proper content types
   - Handles CORS and security headers

3. **Analysis**
   - Uses Web Audio API for real-time analysis
   - Provides frequency data for visualizations
   - Maintains synchronization with transcript

## State Management

We maintain several state types for audio handling:

```typescript
interface AudioState {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  error: Error | null
  audioUrl: string | null
  alignment: AudioAlignment | null
}

interface AudioGenerationState {
  isGenerating: boolean
  error: Error | null
  audioUrl: string | null
  alignment: AudioAlignment | null
}
```

## Configuration

Audio features can be configured through the app config:

```typescript
features: {
  audio: {
    enabled: boolean
    fallbackMode: boolean
    availableVoices: Array<{
      id: string
      name: string
    }>
  }
}
```

## Best Practices

1. **Error Handling**
   - Comprehensive error states
   - Fallback modes for degraded service
   - Detailed logging for debugging

2. **Performance**
   - Lazy loading of heavy components
   - Efficient audio storage and delivery
   - Optimized animations

3. **User Experience**
   - Smooth transitions
   - Responsive visualizations
   - Clear feedback on state changes

## Future Improvements

1. **Planned Features**
   - Voice selection UI
   - Custom voice training
   - Enhanced visualization options
   - Multi-language support

2. **Technical Debt**
   - Optimize audio storage
   - Improve error recovery
   - Enhance visualization performance
   - Add more test coverage 