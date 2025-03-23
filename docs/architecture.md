# Architecture Overview

> **Note**: This document provides a comprehensive overview of the application's architecture, including system design, component relationships, and key technical decisions.

## System Architecture

```mermaid
graph TD
    subgraph Client["Client Layer"]
        direction TB
        A[Next.js App Router]:::nextjs
        B[Pages]:::nextjs
        C[Components]:::components
        D[Custom Hooks]:::hooks
        E[Services]:::services
        
        A --> B
        B --> C
        C --> D
        D --> E
    end

    subgraph Server["Server Layer"]
        direction TB
        F[API Routes]:::api
        G[External Services]:::services
        H[ElevenLabs API]:::external
        I[TogetherAI API]:::external
        J[Supabase]:::supabase
        
        F --> G
        G --> H
        G --> I
        G --> J
    end

    subgraph Database["Data Layer"]
        direction TB
        J --> K[PostgreSQL]:::supabase
        J --> L[Storage]:::supabase
    end

    C --> F
```

## Component Architecture

```mermaid
graph TD
    subgraph UI["UI Layer"]
        direction TB
        A[HomePage]:::components
        B[NewsCard]:::components
        C[FetchNewsButton]:::components
        D[NewsHistoryList]:::components
        E[NewsImage]:::components
        F[AudioPlayer]:::components
        
        A --> B
        A --> C
        A --> D
        B --> E
        B --> F
    end

    subgraph State["State Management"]
        direction TB
        G[Global State]:::state
        H[News State]:::state
        I[Media State]:::state
        J[User State]:::state
        
        G --> H
        G --> I
        G --> J
    end

    subgraph Services["Service Layer"]
        direction TB
        K[MediaService]:::services
        L[PromptService]:::services
        M[ImageService]:::services
        N[AudioService]:::services
        
        K --> L
        K --> M
        K --> N
    end

    B --> G
    C --> G
    D --> G
```

## Data Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as UI Layer
    participant State as State Management
    participant Service as Service Layer
    participant API as API Routes
    participant DB as Database

    User->>UI: Click Generate News
    Note over UI: Update Loading State
    UI->>State: Update Loading State
    State->>Service: Generate Media
    Service->>API: Fetch News
    API->>DB: Store News
    Service->>API: Generate Image
    Service->>API: Generate Audio
    API->>DB: Update Media URLs
    DB-->>UI: Update Display
    UI-->>User: Show Results
```

## Key Design Decisions

### 1. Service Layer Architecture

The application uses a service-based architecture to handle complex operations:

| Service | Purpose | Key Features |
|---------|---------|--------------|
| MediaService | Orchestrates media generation | - Progress tracking<br>- Error handling<br>- Resource management |
| PromptService | Handles AI prompt generation | - Style validation<br>- Context management<br>- Output formatting |
| ImageService | Manages image generation | - Format optimization<br>- Storage integration<br>- Caching |
| AudioService | Handles audio generation | - Streaming support<br>- Alignment data<br>- Format conversion |

Each service follows the Singleton pattern to ensure consistent state and resource management.

### 2. State Management

The application uses a hybrid state management approach:

```mermaid
graph TD
    subgraph State["State Management"]
        direction TB
        A[Jotai Atoms]:::state
        B[React Context]:::state
        C[Local State]:::state
        
        A --> D[Global State]
        B --> E[Theme/Auth]
        C --> F[Component State]
    end
```

### 3. API Integration

The application integrates with multiple external APIs:

| API | Purpose | Key Features |
|-----|---------|--------------|
| TogetherAI | Image generation | - Style transfer<br>- Resolution control<br>- Batch processing |
| ElevenLabs | Text-to-speech | - Voice selection<br>- Alignment data<br>- Streaming support |
| Supabase | Data/Storage | - Real-time updates<br>- Row-level security<br>- Storage management |

### 4. Database Design

The database schema is designed for:

```mermaid
graph LR
    A[Database Design] --> B[Efficient Querying]
    A --> C[Real-time Updates]
    A --> D[Scalability]
    A --> E[Data Integrity]
    
    B --> F[Indexed Fields]
    C --> G[WebSocket Support]
    D --> H[Partitioning]
    E --> I[Constraints]
```

### 5. UI/UX Considerations

The UI is built with:

```mermaid
graph TD
    subgraph UI["UI Features"]
        direction TB
        A[Responsive Design]:::ui
        B[Dark Mode]:::ui
        C[Loading States]:::ui
        D[Error Handling]:::ui
        E[Progress Indicators]:::ui
        F[Accessibility]:::ui
    end
```

## Performance Optimizations

### 1. Image Optimization

```mermaid
graph LR
    A[Image Optimization] --> B[Lazy Loading]
    A --> C[Responsive Images]
    A --> D[WebP Format]
    A --> E[CDN Caching]
```

### 2. Audio Streaming

```mermaid
graph LR
    A[Audio Streaming] --> B[Progressive Loading]
    A --> C[Buffer Management]
    A --> D[Alignment Data]
```

### 3. State Updates

```mermaid
graph LR
    A[State Updates] --> B[Batched Updates]
    A --> C[Memoization]
    A --> D[Selective Re-rendering]
```

### 4. API Calls

```mermaid
graph LR
    A[API Calls] --> B[Request Caching]
    A --> C[Rate Limiting]
    A --> D[Error Retry]
```

## Security Considerations

### 1. API Security

```mermaid
graph TD
    A[API Security] --> B[Environment Variables]
    A --> C[API Key Rotation]
    A --> D[Rate Limiting]
    A --> E[Input Validation]
```

### 2. Data Security

```mermaid
graph TD
    A[Data Security] --> B[SQL Injection Prevention]
    A --> C[XSS Protection]
    A --> D[CSRF Protection]
    A --> E[Input Sanitization]
```

### 3. User Security

```mermaid
graph TD
    A[User Security] --> B[Authentication]
    A --> C[Authorization]
    A --> D[Session Management]
    A --> E[Rate Limiting]
```

## Future Improvements

### 1. Scalability

```mermaid
graph TD
    A[Scalability] --> B[Microservices]
    A --> C[Load Balancing]
    A --> D[Caching Layer]
    A --> E[Queue System]
```

### 2. Features

```mermaid
graph TD
    A[Features] --> B[Real-time Updates]
    A --> C[Social Sharing]
    A --> D[User Preferences]
    A --> E[Advanced Analytics]
```

### 3. Performance

```mermaid
graph TD
    A[Performance] --> B[Edge Functions]
    A --> C[Static Generation]
    A --> D[ISR]
    A --> E[Service Workers]
```

> **Note**: The color scheme used in the diagrams follows a consistent pattern:
> - Supabase: Green (#10B981)
> - Next.js: Black (#000000)
> - TypeScript: Blue (#3178C6)
> - Services: Purple (#8B5CF6)
> - API Routes: Pink (#EC4899)
> - Hooks: Purple (#8B5CF6)
> - Components: Blue (#3B82F6)
> - State Management: Pink (#EC4899)
> - UI Elements: Red (#EF4444)
> - Layout: Orange (#F59E0B) 