# 🔊 Audio Architecture

> **Note**: This document provides a comprehensive overview of the application's audio system architecture, including Web Audio API integration, state management, and audio processing flow.

---

## 📋 System Overview

```mermaid
graph TD
    subgraph Client["Client Layer"]
        direction TB
        A[AudioPlayer Component]:::component
        B[AudioWaveform Component]:::component
        C[useAudioAnalyser Hook]:::hook
        D[useAudioPlayer Hook]:::hook
        E[useAudioGeneration Hook]:::hook
        
        A --> C
        B --> C
        C --> F[AudioContextManager]
        D --> F
        E --> G[ElevenLabsService]
    end

    subgraph Core["Core Services"]
        direction TB
        F[AudioContextManager]:::service
        G[ElevenLabsService]:::service
        H[AudioService]:::service
        
        F --> I[Web Audio API]
        G --> J[ElevenLabs API]
        H --> G
    end

    subgraph State["State Management"]
        direction TB
        K[Audio Atoms]:::state
        L[Audio Generation State]:::state
        M[Audio Playback State]:::state
        
        K --> N[Global State]
        L --> N
        M --> N
    end

    subgraph Storage["Storage Layer"]
        direction TB
        O[Supabase Storage]:::storage
        P[Audio Cache]:::storage
        Q[Alignment Data]:::storage
    end

    classDef component fill:#3B82F6,stroke:#2563EB,color:white
    classDef hook fill:#EC4899,stroke:#DB2777,color:white
    classDef service fill:#8B5CF6,stroke:#7C3AED,color:white
    classDef state fill:#10B981,stroke:#059669,color:white
    classDef storage fill:#F59E0B,stroke:#D97706,color:white
    classDef api fill:#EF4444,stroke:#DC2626,color:white
```

---

## 🔡 Audio Alignment System

### 📊 Data Structures

```typescript
// Raw alignment data from ElevenLabs
interface RawAudioAlignment {
  characters: Array<{
    char: string
    start: number
    end: number
  }>
}

// Normalized alignment data used by the app
interface NormalizedAudioAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

// Database format (matches what we store in Supabase)
interface DBAudioAlignment extends RawAudioAlignment {}
```

### 🔄 Alignment Flow

```mermaid
sequenceDiagram
    participant ElevenLabs as ElevenLabs API
    participant Service as AudioService
    participant DB as Database
    participant UI as UI Layer

    ElevenLabs-->>Service: Raw Alignment Data
    Service->>Service: Normalize Alignment
    Service->>DB: Store Normalized Data
    DB-->>UI: Fetch Alignment
    UI->>UI: Transform for Display
```

### 🔄 Normalization Process

The alignment data goes through several transformations:

1. **Raw Format** (from ElevenLabs):
```typescript
{
  characters: [
    { char: "H", start: 0.0, end: 0.1 },
    { char: "e", start: 0.1, end: 0.2 },
    // ...
  ]
}
```

2. **Normalized Format** (used by the app):
```typescript
{
  characters: ["H", "e", "l", "l", "o"],
  character_start_times_seconds: [0.0, 0.1, 0.2, 0.3, 0.4],
  character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5]
}
```

3. **Database Format** (stored in Supabase):
```typescript
{
  characters: [
    { char: "H", start: 0.0, end: 0.1 },
    { char: "e", start: 0.1, end: 0.2 },
    // ...
  ]
}
```

### ✅ Validation

The system includes robust validation for alignment data:

```typescript
function isValidNormalizedAlignment(alignment: NormalizedAudioAlignment): boolean {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment

  // Check array lengths match
  if (characters.length !== character_start_times_seconds.length || 
      characters.length !== character_end_times_seconds.length) {
    return false
  }

  // Check for invalid values
  return characters.every((char, i) => {
    const start = character_start_times_seconds[i]
    const end = character_end_times_seconds[i]
    return (
      typeof char === 'string' &&
      typeof start === 'number' &&
      typeof end === 'number' &&
      start >= 0 &&
      end >= start
    )
  })
}
```

### 🧩 Usage in Components

The alignment data is used in several components:

1. **AudioPlayer**: Manages playback and timing
2. **AnimatedTranscript**: Provides character-level highlighting
3. **AudioWaveform**: Visualizes audio frequency data

```mermaid
graph TD
    subgraph Components["Component Usage"]
        direction TB
        A[AudioPlayer] --> B[Playback Control]
        A --> C[Time Tracking]
        D[AnimatedTranscript] --> E[Character Highlighting]
        D --> F[Word Context]
        G[AudioWaveform] --> H[Frequency Analysis]
        G --> I[Visual Feedback]
    end
```

### 🔄 State Management

Alignment data is managed through Jotai atoms:

```typescript
interface AudioTrack {
  id: string
  url: string
  alignment: AudioAlignment | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

// Base state atom
export const audioContextStateAtom = atom<AudioContextState>({
  isInitialized: false,
  error: null,
  activeTrack: null,
  availableTracks: new Map()
})
```

### ⚠️ Error Handling

The system includes comprehensive error handling for alignment data:

```typescript
try {
  const normalized = normalizeAudioAlignment(rawAlignment)
  if (!normalized) {
    throw new Error('Invalid alignment data')
  }
  
  // Store normalized data
  await storeAlignment(normalized)
} catch (error) {
  devLog('Alignment processing failed', {
    prefix: 'audio-alignment',
    level: 'error'
  }, { error })
  
  // Handle error appropriately
}
```

---

## 🧩 Component Architecture

### 🎛️ AudioContextManager

The `AudioContextManager` is a singleton service that manages the Web Audio API context and audio connections:

```typescript
interface AudioConnection {
  analyzer: AnalyserNode
  dataArray: Uint8Array
  source: MediaElementAudioSourceNode
  gainNode: GainNode
  audioElement: HTMLAudioElement
}

interface AudioContextState {
  isInitialized: boolean
  error: Error | null
  activeConnections: Map<string, AudioConnection>
  currentVolume: number
}
```

**Key features**:
- ✅ Singleton pattern for global audio context management
- ✅ Handles audio node connections and cleanup
- ✅ Manages audio analyzer for visualization
- ✅ Provides volume control and state management

### 🎵 Audio Player Components

```mermaid
graph TD
    subgraph Components["Audio Components"]
        direction TB
        A[AudioPlayer] --> B[AudioWaveform]
        A --> C[AnimatedTranscript]
        A --> D[PlaybackControls]
        
        B --> E[useAudioAnalyser]
        C --> F[useAudioAlignment]
        D --> G[useAudioPlayer]
    end
```

#### AudioPlayer Component
- 🎮 Manages audio element lifecycle
- ⏯️ Handles playback controls
- 🔄 Coordinates with audio context
- 📢 Provides event callbacks

#### AudioWaveform Component
- 📊 Real-time frequency visualization
- 🔍 Uses Web Audio API analyzer
- 📱 Responsive canvas rendering
- 🎨 Dynamic bar visualization

### 🪝 Custom Hooks

```mermaid
graph TD
    subgraph Hooks["Audio Hooks"]
        direction TB
        A[useAudioAnalyser] --> B[AudioContextManager]
        C[useAudioPlayer] --> B
        D[useAudioGeneration] --> E[ElevenLabsService]
        
        A --> F[Frequency Analysis]
        C --> G[Playback Control]
        D --> H[Audio Generation]
    end
```

---

## 🔄 Audio Processing Flow

### 1️⃣ Generation Flow

```mermaid
sequenceDiagram
    participant UI as UI Layer
    participant Hook as useAudioGeneration
    participant API as API Route
    participant Service as ElevenLabsService
    participant Storage as Supabase Storage

    UI->>Hook: Request Audio Generation
    Hook->>API: POST /api/generate-audio
    API->>Service: Generate Speech
    Service->>ElevenLabs: API Call
    ElevenLabs-->>Service: Audio Data + Alignment
    Service->>Storage: Upload Audio
    Storage-->>API: Audio URL
    API-->>Hook: Response
    Hook-->>UI: Update State
```

### 2️⃣ Playback Flow

```mermaid
sequenceDiagram
    participant UI as UI Layer
    participant Player as AudioPlayer
    participant Context as AudioContextManager
    participant API as Web Audio API

    UI->>Player: Play Audio
    Player->>Context: Initialize Context
    Context->>API: Create Audio Nodes
    API-->>Context: Audio Nodes
    Context->>API: Connect Nodes
    API-->>Context: Connected Graph
    Context-->>Player: Ready
    Player->>API: Start Playback
```

---

## 🔄 State Management

### 🌐 Global State (Jotai Atoms)

```typescript
// Base state atom
export const audioContextStateAtom = atom<AudioContextState>({
  isInitialized: false,
  error: null,
  activeTrack: null,
  availableTracks: new Map()
})

// Action atoms
export const playTrackAtom = atom(
  null,
  async (get, set, trackId: string) => {
    // Playback logic
  }
)

export const pauseTrackAtom = atom(
  null,
  async (get, set) => {
    // Pause logic
  }
)
```

### 🧩 Component State

```typescript
interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  error: Error | null
}

interface AudioGenerationState {
  isGenerating: boolean
  error: Error | null
  audioUrl: string | null
  alignment: AudioAlignment | null
}
```

---

## 🔊 Web Audio API Integration

### 📊 Audio Graph

```mermaid
graph LR
    A[Audio Source] --> B[Gain Node]
    B --> C[Analyser Node]
    C --> D[Destination]
    
    B --> E[Volume Control]
    C --> F[Visualization]
```

### ⚙️ Node Configuration

```typescript
// Analyzer configuration
analyzer.fftSize = 256
analyzer.smoothingTimeConstant = 0.8
analyzer.minDecibels = -90
analyzer.maxDecibels = -10

// Gain node configuration
gainNode.gain.value = volume
```

---

## ⚠️ Error Handling

### 🚫 Error Types

```mermaid
graph TD
    A[Audio Errors] --> B[Initialization Errors]
    A --> C[Playback Errors]
    A --> D[Generation Errors]
    
    B --> E[Context Creation]
    C --> F[Node Connection]
    D --> G[API Failures]
```

### 🔄 Error Recovery

```typescript
try {
  await manager.initialize()
} catch (error) {
  // Log error
  devLog('Failed to initialize AudioContext', {
    prefix: 'audio-context',
    level: 'error'
  }, { error })
  
  // Update state
  set(audioContextStateAtom, {
    ...get(audioContextStateAtom),
    error: error as Error
  })
  
  // Attempt recovery
  await retryInitialization()
}
```

---

## ⚡ Performance Considerations

### 🔋 Resource Management

```mermaid
graph TD
    A[Resource Management] --> B[Memory Usage]
    A --> C[CPU Usage]
    A --> D[Network Bandwidth]
    
    B --> E[Cleanup]
    C --> F[Optimization]
    D --> G[Streaming]
```

### 🚀 Optimization Techniques

- ✅ Lazy loading of audio context
- ✅ Efficient audio node cleanup
- ✅ Optimized analyzer settings
- ✅ Smart caching strategies

---

## 🔮 Future Improvements

### 🌟 Features

```mermaid
graph TD
    A[Future Features] --> B[Advanced Visualization]
    A --> C[Multi-track Support]
    A --> D[Custom Effects]
    
    B --> E[3D Visualization]
    C --> F[Track Mixing]
    D --> G[Audio Processing]
```

### 🔧 Technical Debt

```mermaid
graph TD
    A[Technical Debt] --> B[Code Organization]
    A --> C[Error Handling]
    A --> D[Testing]
    
    B --> E[Modularization]
    C --> F[Recovery]
    D --> G[Coverage]
```

> 💡 **Pro Tip**: All color schemes in diagrams follow a consistent pattern:
> - 🔵 Components: Blue (#3B82F6)
> - 🟣 Services: Purple (#8B5CF6)
> - 🌸 Hooks: Pink (#EC4899)
> - 🟢 State: Green (#10B981)
> - 🟠 Storage: Orange (#F59E0B)
> - 🔴 Error: Red (#EF4444)
> - 🟢 Success: Green (#10B981) 