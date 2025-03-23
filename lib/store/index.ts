import { createStore } from 'jotai'
import { devLog } from '../utils/log'

// Create a single store instance
const store = createStore()

// Log store creation
devLog('Created Jotai store', {
  prefix: 'jotai-store',
  level: 'debug'
})

export { store } 