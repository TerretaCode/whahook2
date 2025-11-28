/**
 * Simple client-side cache with TTL support
 * Used for stale-while-revalidate pattern
 */

const CACHE_TTL = 30000 // 30 seconds

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// In-memory cache
const memoryCache: Map<string, CacheEntry<any>> = new Map()

/**
 * Get data from memory cache
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    memoryCache.delete(key)
    return null
  }
  return entry.data as T
}

/**
 * Set data in memory cache
 */
export function setCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
  memoryCache.delete(key)
}

/**
 * Clear all cache entries matching a prefix
 */
export function clearCacheByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key)
    }
  }
}

/**
 * Persist data to sessionStorage (survives page refresh)
 */
export function persistToSession<T>(key: string, data: T): void {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    sessionStorage.setItem(`cache:${key}`, JSON.stringify(cacheData))
  } catch (e) {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Get data from sessionStorage
 */
export function getFromSession<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(`cache:${key}`)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(`cache:${key}`)
      return null
    }
    
    return data as T
  } catch (e) {
    return null
  }
}

/**
 * Get from memory cache first, then sessionStorage
 */
export function getFromAnyCache<T>(key: string): T | null {
  return getCached<T>(key) || getFromSession<T>(key)
}

/**
 * Set in both memory and session cache
 */
export function setInAllCaches<T>(key: string, data: T): void {
  setCache(key, data)
  persistToSession(key, data)
}
