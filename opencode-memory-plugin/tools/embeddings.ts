import { MemoryConfig } from './config'

/**
 * Simple in-memory cache for embeddings
 */
class EmbeddingCache {
  private cache = new Map<string, number[]>()
  private maxSize = 1000

  set(key: string, value: number[]): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (first key)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  get(key: string): number[] | undefined {
    return this.cache.get(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

const cache = new EmbeddingCache()

/**
 * Simple hash function for fallback embedding
 */
function hashEmbedding(text: string, dimensions: number = 384): number[] {
  const words = text.toLowerCase().split(/\s+/)
  const embedding: number[] = []

  for (let i = 0; i < dimensions; i++) {
    let hash = 0
    for (let j = 0; j < words.length; j++) {
      const word = words[j]
      for (let k = 0; k < word.length; k++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(k)
        hash |= 0
      }
    }
    embedding.push((hash % 1000) / 1000)
  }

  return embedding
}

/**
 * Simple TF-IDF based embedding as intermediate fallback
 */
function tfidfEmbedding(text: string, dimensions: number = 384): number[] {
  const words = text.toLowerCase().split(/\s+/)
  const wordFreq = new Map<string, number>()

  // Count word frequencies
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  }

  // Create embedding from word frequencies
  const embedding: number[] = []
  for (let i = 0; i < dimensions; i++) {
    const wordIndex = i % words.length
    const word = words[wordIndex] || ''
    const freq = wordFreq.get(word) || 0
    const normalized = freq / words.length
    embedding.push(normalized)
  }

  return embedding
}

/**
 * Call OpenAI Embeddings API
 */
async function getOpenAIEmbedding(
  text: string,
  apiKey: string,
  model: string = 'text-embedding-3-small',
  baseURL?: string
): Promise<number[]> {
  const url = baseURL
    ? `${baseURL}/v1/embeddings`
    : 'https://api.openai.com/v1/embeddings'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: model,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = await response.json()

  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error('Invalid response from OpenAI API')
  }

  return data.data[0].embedding
}

/**
 * Get text embedding with automatic provider selection
 *
 * This function tries multiple strategies in order:
 * 1. Check cache (if enabled)
 * 2. Use configured provider (OpenAI API)
 * 3. Fallback to hash-based embedding if all else fails
 *
 * @param text - Text to embed
 * @param config - Memory system configuration
 * @returns Promise<number[]> - Embedding vector
 */
export async function getEmbedding(
  text: string,
  config: MemoryConfig
): Promise<number[]> {
  const { embedding } = config

  // Create cache key from text (first 100 chars)
  const cacheKey = text.substring(0, 100)

  // Check cache first if enabled
  if (embedding.cacheEnabled) {
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached
    }
  }

  let embeddingVector: number[]

  // Try to use configured provider
  try {
    switch (embedding.provider) {
      case 'openai': {
        const apiKey = process.env.OPENAI_API_KEY || embedding.apiKey

        if (!apiKey) {
          console.warn(
            'OpenAI API key not found (set OPENAI_API_KEY env var or configure in memory-config.json). ' +
            'Falling back to hash-based embedding.'
          )
          embeddingVector = hashEmbedding(text)
          break
        }

        const model = embedding.model || 'text-embedding-3-small'
        const baseURL = embedding.baseURL

        embeddingVector = await getOpenAIEmbedding(text, apiKey, model, baseURL)
        break
      }

      case 'local':
        // TODO: Implement local embedding model (e.g., node-llama-cpp)
        console.warn(
          'Local embedding not yet implemented. ' +
          'Falling back to hash-based embedding.'
        )
        embeddingVector = hashEmbedding(text)
        break

      case 'none':
        // Use hash-based embedding
        embeddingVector = hashEmbedding(text)
        break

      default:
        embeddingVector = hashEmbedding(text)
        break
    }
  } catch (error) {
    // If API call fails, fall back to hash-based embedding
    console.error('Embedding generation failed, using fallback:', error)
    embeddingVector = hashEmbedding(text)
  }

  // Cache the result if enabled
  if (embedding.cacheEnabled) {
    cache.set(cacheKey, embeddingVector)
  }

  return embeddingVector
}

/**
 * Clear the embedding cache
 */
export function clearEmbeddingCache(): void {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: cache.size(),
    maxSize: 1000,
  }
}
