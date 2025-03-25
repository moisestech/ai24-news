# Media Generation Flow

> **Note**: This document details the media generation process, including image and audio generation, storage, and delivery.

## Overview

The application supports various types of media generation, including audio, images, and video. This document focuses on the audio generation system, particularly the integration with ElevenLabs for text-to-speech generation.

## Audio Generation System

### Architecture

```mermaid
graph TD
    subgraph Client["Client Layer"]
        direction TB
        A[useAudioGeneration Hook]:::hook
        B[AudioGenerationForm]:::component
        C[GenerationProgress]:::component
        
        A --> D[AudioService]
        B --> A
        C --> A
    end

    subgraph Services["Service Layer"]
        direction TB
        D[AudioService]:::service
        E[ElevenLabsService]:::service
        F[StorageService]:::service
        
        D --> E
        D --> F
    end

    subgraph External["External Services"]
        direction TB
        G[ElevenLabs API]:::api
        H[Supabase Storage]:::storage
        
        E --> G
        F --> H
    end
```

### Core Components

#### 1. Audio Generation Hook

```typescript
interface AudioGenerationOptions {
  text: string
  voiceId: string
  modelId: string
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
}

interface AudioGenerationResult {
  audioUrl: string
  alignment: AudioAlignment
  duration: number
  metadata: {
    modelId: string
    voiceId: string
    timestamp: string
  }
}
```

#### 2. ElevenLabs Service

```typescript
class ElevenLabsService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.elevenlabs.io/v1'
  }

  async generateSpeech(options: AudioGenerationOptions): Promise<{
    audioData: ArrayBuffer
    alignment: RawAudioAlignment
  }> {
    // Implementation details
  }
}
```

#### 3. Audio Service

```typescript
class AudioService {
  constructor(
    private elevenLabs: ElevenLabsService,
    private storage: StorageService
  ) {}

  async generateAudio(options: AudioGenerationOptions): Promise<AudioGenerationResult> {
    // Implementation details
  }
}
```

### Generation Flow

```mermaid
sequenceDiagram
    participant UI as User Interface
    participant Hook as useAudioGeneration
    participant Service as AudioService
    participant ElevenLabs as ElevenLabs API
    participant Storage as Supabase Storage

    UI->>Hook: Start Generation
    Hook->>Service: generateAudio(options)
    Service->>ElevenLabs: generateSpeech(options)
    ElevenLabs-->>Service: Audio Data + Alignment
    Service->>Service: Process Alignment
    Service->>Storage: Store Audio
    Storage-->>Service: Audio URL
    Service-->>Hook: Generation Result
    Hook-->>UI: Update UI
```

### Alignment Processing

The audio generation process includes character-level alignment:

> ⚠️ **IMPORTANT**: The alignment data is critical for synchronized text highlighting and must be properly stored and processed.

1. **Raw Alignment** (from ElevenLabs):
```typescript
{
  characters: [
    { char: "H", start: 0.0, end: 0.1 },
    { char: "e", start: 0.1, end: 0.2 }
  ]
}
```

2. **Normalized Alignment**:
```typescript
{
  characters: ["H", "e"],
  character_start_times_seconds: [0.0, 0.1],
  character_end_times_seconds: [0.1, 0.2]
}
```

> 📝 **Note**: Our application always transforms between these formats automatically, so you don't need to handle conversion manually.

### Error Handling

```typescript
try {
  const result = await generateAudio(options)
  return result
} catch (error) {
  if (error instanceof ElevenLabsError) {
    // Handle API-specific errors
  } else if (error instanceof StorageError) {
    // Handle storage errors
  } else {
    // Handle general errors
  }
  throw error
}
```

### Progress Tracking

Generation progress is tracked through a callback system:

```typescript
interface GenerationProgress {
  status: 'idle' | 'generating' | 'processing' | 'complete' | 'error'
  progress: number
  message: string
  error?: Error
}

const [progress, setProgress] = useState<GenerationProgress>({
  status: 'idle',
  progress: 0,
  message: ''
})
```

### Storage Management

Generated audio is stored in Supabase with the following structure:

```typescript
interface StoredAudio {
  id: string
  url: string
  alignment: AudioAlignment
  metadata: {
    modelId: string
    voiceId: string
    timestamp: string
  }
}
```

### Usage Example

```typescript
const { generateAudio, progress } = useAudioGeneration()

const handleGenerate = async () => {
  try {
    const result = await generateAudio({
      text: "Hello, world!",
      voiceId: "voice-id",
      modelId: "model-id"
    })
    
    // Handle successful generation
  } catch (error) {
    // Handle error
  }
}
```

## Process Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as UI Layer
    participant Media as MediaService
    participant Image as ImageService
    participant Audio as AudioService
    participant Storage as Storage
    participant CDN as CDN

    User->>UI: Request Media Generation
    Note over UI: Validate Input
    UI->>Media: Initialize Generation
    Media->>Image: Generate Image
    Image->>Storage: Store Image
    Storage->>CDN: Cache Image
    Media->>Audio: Generate Audio
    Audio->>Storage: Store Audio
    Storage->>CDN: Cache Audio
    Media-->>UI: Update Progress
    UI-->>User: Display Results

    Note over User,CDN: Generation Flow
    Note over User,UI: User Interface
    Note over UI,Media: Application Logic
    Note over Media,CDN: External Services
```

## Service Architecture

```mermaid
classDiagram
    class MediaService {
        +generateMedia()
        +trackProgress()
        +handleErrors()
        -validateInput()
        -coordinateServices()
    }

    class ImageService {
        +generateImage()
        +optimizeImage()
        +storeImage()
        -validateStyle()
        -handleErrors()
    }

    class AudioService {
        +generateAudio()
        +createAlignment()
        +streamAudio()
        -validateVoice()
        -handleErrors()
    }

    class StorageService {
        +storeFile()
        +getUrl()
        +deleteFile()
        -validateFile()
        -handleErrors()
    }

    MediaService --> ImageService : uses
    MediaService --> AudioService : uses
    MediaService --> StorageService : uses
    ImageService --> StorageService : uses
    AudioService --> StorageService : uses

    class MediaService {
        <<interface>>
    }

    class ImageService {
        <<interface>>
    }

    class AudioService {
        <<interface>>
    }

    class StorageService {
        <<interface>>
    }
```

## Progress Tracking

```mermaid
stateDiagram-v2
    [*] --> PromptGeneration: Start
    PromptGeneration --> ImageGeneration: Success
    ImageGeneration --> AudioGeneration: Success
    AudioGeneration --> Storage: Success
    Storage --> [*]: Success
    
    PromptGeneration --> Error: Failed
    ImageGeneration --> Error: Failed
    AudioGeneration --> Error: Failed
    Storage --> Error: Failed
    
    Error --> Retry: Attempt Recovery
    Retry --> [*]: Success
    Retry --> Error: Failed

    state Error {
        [*] --> LogError
        LogError --> NotifyUser
        NotifyUser --> [*]
    }

    state Retry {
        [*] --> Backoff
        Backoff --> Attempt
        Attempt --> [*]
    }
```

## Technical Implementation

### 1. Media Service

```typescript
interface MediaGenerationConfig {
  headline: string;
  artStyle: ArtStyle;
  voiceId?: string;
  onProgress?: (status: GenerationStatus) => void;
}

interface GenerationStatus {
  stage: 'prompt' | 'image' | 'audio' | 'storage';
  progress: number;
  error?: string;
  data?: any;
}
```

### 2. Prompt Generation

```typescript
interface PromptConfig {
  headline: string;
  style: ArtStyle;
  constraints: {
    maxLength: number;
    styleGuidelines: string[];
  };
}

interface PromptResult {
  prompt: string;
  metadata: {
    style: ArtStyle;
    timestamp: string;
    version: string;
  };
}
```

### 3. Image Generation

```typescript
interface ImageConfig {
  prompt: string;
  style: ArtStyle;
  resolution: {
    width: number;
    height: number;
  };
  format: 'webp' | 'png' | 'jpg';
}

interface ImageResult {
  url: string;
  metadata: {
    size: number;
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
}
```

### 4. Audio Generation

```typescript
interface AudioConfig {
  text: string;
  voiceId: string;
  format: 'mp3' | 'wav';
  quality: 'low' | 'medium' | 'high';
}

interface AudioResult {
  url: string;
  alignment: AudioAlignment;
  metadata: {
    duration: number;
    format: string;
    quality: string;
  };
}
```

## Error Handling

```mermaid
graph TD
    A[Error Detection] --> B{Error Type}
    B -->|API Error| C[API Error Handler]
    B -->|Storage Error| D[Storage Error Handler]
    B -->|Validation Error| E[Validation Error Handler]
    
    C --> F[Retry Logic]
    D --> F
    E --> G[User Feedback]
    
    F --> H{Retry Count}
    H -->|Under Limit| I[Retry Operation]
    H -->|Exceeded| J[Fallback Mode]
    
    I --> K[Success]
    I --> L[Failure]
    J --> M[Error State]
```

## Performance Considerations

### 1. Resource Management

```mermaid
graph LR
    A[Resource Management] --> B[Memory Usage]
    A --> C[CPU Usage]
    A --> D[Network Bandwidth]
    A --> E[Storage Space]
    
    B --> F[Garbage Collection]
    C --> G[Task Scheduling]
    D --> H[Rate Limiting]
    E --> I[Cleanup Jobs]
```

### 2. Caching Strategy

```mermaid
graph TD
    A[Caching Strategy] --> B[Browser Cache]
    A --> C[CDN Cache]
    A --> D[Memory Cache]
    
    B --> E[Cache-Control]
    C --> F[Cache Invalidation]
    D --> G[LRU Cache]
```

### 3. Monitoring

```mermaid
graph TD
    A[Monitoring] --> B[Performance Metrics]
    A --> C[Error Tracking]
    A --> D[Usage Analytics]
    
    B --> E[Response Times]
    C --> F[Error Rates]
    D --> G[Resource Usage]
```

## Security Measures

### 1. Input Validation

```mermaid
graph TD
    A[Input Validation] --> B[Content Filtering]
    A --> C[Size Limits]
    A --> D[Format Validation]
    
    B --> E[Sanitization]
    C --> F[Compression]
    D --> G[Type Checking]
```

### 2. API Security

```mermaid
graph TD
    A[API Security] --> B[Authentication]
    A --> C[Rate Limiting]
    A --> D[Request Validation]
    
    B --> E[API Keys]
    C --> F[Quota Management]
    D --> G[Schema Validation]
```

### 3. Storage Security

```mermaid
graph TD
    A[Storage Security] --> B[Access Control]
    A --> C[Encryption]
    A --> D[Backup]
    
    B --> E[Permissions]
    C --> F[At Rest]
    D --> G[Recovery]
```

## Future Enhancements

### 1. Scalability

```mermaid
graph TD
    A[Scalability] --> B[Load Balancing]
    A --> C[Auto-scaling]
    A --> D[Queue System]
    
    B --> E[Distribution]
    C --> F[Resource Scaling]
    D --> G[Job Processing]
```

### 2. Features

```mermaid
graph TD
    A[Features] --> B[Batch Processing]
    A --> C[Advanced Styles]
    A --> D[Custom Voices]
    
    B --> E[Parallel Processing]
    C --> F[Style Mixing]
    D --> G[Voice Training]
```

### 3. Optimization

```mermaid
graph TD
    A[Optimization] --> B[Compression]
    A --> C[Format Selection]
    A --> D[Delivery Strategy]
    
    B --> E[Size Reduction]
    C --> F[Quality Balance]
    D --> G[CDN Selection]
```

> **Note**: The color scheme used in the diagrams follows a consistent pattern:
> - Input: Blue (#3B82F6)
> - Processing: Purple (#8B5CF6)
> - Storage: Green (#10B981)
> - Delivery: Orange (#F59E0B)
> - Error: Red (#EF4444)
> - Success: Green (#10B981)
> - Warning: Yellow (#F59E0B)
> - Info: Blue (#3B82F6) 