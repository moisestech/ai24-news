# State Management

> **Note**: This document details the application's state management approach, including global state, component state, and state synchronization.

## Overview

```mermaid
graph TD
    subgraph State["State Management"]
        direction TB
        A[Global State]:::global
        B[Component State]:::component
        C[Context State]:::context
        D[Server State]:::server
        
        A --> E[State Updates]
        B --> E
        C --> E
        D --> E
    end

    subgraph Global["Global State"]
        direction LR
        F[Jotai Atoms]:::global
        G[Store]:::global
        H[Cache]:::global
    end

    subgraph Component["Component State"]
        direction LR
        I[useState]:::component
        J[useReducer]:::component
        K[useRef]:::component
    end

    subgraph Context["Context State"]
        direction LR
        L[Theme]:::context
        M[Auth]:::context
        N[Settings]:::context
    end
```

## State Architecture

```mermaid
graph TD
    subgraph Atoms["Jotai Atoms"]
        direction TB
        A[userEmailAtom]:::atom
        B[imageGenerationAtom]:::atom
        C[newsStateAtom]:::atom
        D[mediaStateAtom]:::atom
        
        A --> E[User State]
        B --> F[Media State]
        C --> G[News State]
        D --> F
    end

    subgraph Contexts["React Contexts"]
        direction TB
        H[ThemeContext]:::context
        I[AuthContext]:::context
        J[SettingsContext]:::context
        
        H --> K[UI State]
        I --> L[Auth State]
        J --> M[App State]
    end

    subgraph Components["Component State"]
        direction TB
        N[HomePage]:::component
        O[NewsCard]:::component
        P[AudioPlayer]:::component
        
        N --> Q[Page State]
        O --> R[Card State]
        P --> S[Player State]
    end
```

## State Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Component as Component
    participant Jotai as Jotai State
    participant Context as Context
    participant API as API

    User->>Component: Trigger Action
    Component->>Jotai: Update Global State
    Jotai->>Context: Sync Context
    Context->>API: Fetch Data
    API-->>Context: Return Data
    Context-->>Jotai: Update State
    Jotai-->>Component: Re-render
    Component-->>User: Update UI
```

## Implementation Details

### 1. Global State (Jotai)

```typescript
// Atoms
const userEmailAtom = atom<string | null>(null)
const imageGenerationAtom = atom<ImageGenerationState>({
  loading: false,
  error: null,
  imageUrl: null,
  status: 'idle'
})

// Derived Atoms
const userNewsHistoryAtom = atom(async (get) => {
  const email = get(userEmailAtom)
  if (!email) return []
  return await fetchUserNewsHistory(email)
})

// Write-only Atoms
const updateNewsAtom = atom(
  null,
  async (get, set, news: NewsItem) => {
    const email = get(userEmailAtom)
    if (!email) return
    await saveNewsToHistory(news, email)
  }
)
```

### 2. Context State

```typescript
// Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  colors: ThemeColors
}

// Auth Context
interface AuthContextType {
  user: User | null
  login: (email: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

// Settings Context
interface SettingsContextType {
  settings: UserSettings
  updateSettings: (settings: Partial<UserSettings>) => void
  resetSettings: () => void
}
```

### 3. Component State

```typescript
// Page State
interface PageState {
  isLoading: boolean
  error: Error | null
  data: NewsItem | null
  filters: NewsFilters
}

// Card State
interface CardState {
  isExpanded: boolean
  isPlaying: boolean
  progress: number
  error: Error | null
}

// Player State
interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}
```

## State Updates

```mermaid
graph TD
    A[State Update] --> B{Update Type}
    B -->|Global| C[Jotai Update]
    B -->|Context| D[Context Update]
    B -->|Local| E[Component Update]
    
    C --> F[Batch Updates]
    D --> F
    E --> F
    
    F --> G[Re-render]
    G --> H[UI Update]
```

## Performance Optimizations

### 1. Selective Updates

```mermaid
graph TD
    A[State Change] --> B{Update Scope}
    B -->|Global| C[All Components]
    B -->|Context| D[Context Consumers]
    B -->|Local| E[Single Component]
    
    C --> F[Performance Impact]
    D --> F
    E --> F
```

### 2. State Splitting

```mermaid
graph TD
    A[Large State] --> B[Split State]
    B --> C[Independent Updates]
    B --> D[Reduced Re-renders]
    B --> E[Better Performance]
```

### 3. Batch Updates

```mermaid
graph TD
    A[Multiple Updates] --> B[Batch Processing]
    B --> C[Single Re-render]
    B --> D[Performance Gain]
    B --> E[State Consistency]
```

## Error Handling

```mermaid
graph TD
    A[Error Types] --> B{Error Category}
    B -->|State| C[State Recovery]
    B -->|API| D[API Retry]
    B -->|Validation| E[User Feedback]
    
    C --> F[Error State]
    D --> F
    E --> F
    
    F --> G[Error UI]
    G --> H[Recovery Action]
```

## Testing Strategy

### 1. Unit Tests

```typescript
describe('State Management', () => {
  test('Jotai atom updates', () => {
    const store = createStore()
    store.set(userEmailAtom, 'test@example.com')
    expect(store.get(userEmailAtom)).toBe('test@example.com')
  })

  test('Context updates', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')
  })
})
```

### 2. Integration Tests

```typescript
describe('State Integration', () => {
  test('News generation flow', async () => {
    const { result } = renderHook(() => useNews())
    await act(async () => {
      await result.current.fetchAndSaveNews()
    })
    expect(result.current.data).toBeTruthy()
  })
})
```

## Future Improvements

### 1. State Persistence

```mermaid
graph TD
    A[State Persistence] --> B[Local Storage]
    A --> C[Session Storage]
    A --> D[IndexedDB]
    
    B --> E[Quick Access]
    C --> F[Session Data]
    D --> G[Large Data]
```

### 2. Performance

```mermaid
graph TD
    A[Performance] --> B[State Memoization]
    A --> C[Lazy Loading]
    A --> D[Code Splitting]
    
    B --> E[Reduced Updates]
    C --> F[Faster Initial Load]
    D --> G[Optimized Bundle]
```

### 3. Developer Experience

```mermaid
graph TD
    A[Developer Experience] --> B[Dev Tools]
    A --> C[Type Safety]
    A --> D[Documentation]
    
    B --> E[Debugging]
    C --> F[Error Prevention]
    D --> G[Easy Integration]
```

> **Note**: The color scheme used in the diagrams follows a consistent pattern:
> - Global State: Purple (#8B5CF6)
> - Component State: Blue (#3B82F6)
> - Context State: Green (#10B981)
> - Server State: Orange (#F59E0B)
> - Atoms: Pink (#EC4899)
> - Error: Red (#EF4444)
> - Success: Green (#10B981)
> - Warning: Yellow (#F59E0B) 