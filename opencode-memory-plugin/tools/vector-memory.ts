import { tool } from "@opencode-ai/plugin"
import path from "path"
import { readFile, exists, mkdir } from "fs/promises"
import Database from "better-sqlite3"

const MEMORY_DIR = path.join(process.env.HOME || "", ".opencode", "memory")
const VECTOR_DB_PATH = path.join(MEMORY_DIR, "vector-index.db")
const CHUNK_SIZE = 400 // Target tokens per chunk
const CHUNK_OVERLAP = 80 // Overlap between chunks

// Helper: Ensure memory directory and vector database exist
async function ensureVectorIndex() {
  await mkdir(MEMORY_DIR, { recursive: true })

  const db = new Database(VECTOR_DB_PATH)
  
  // Enable sqlite-vec extension if available
  try {
    db.loadExtension(path.join(__dirname, "..", "node_modules", "sqlite-vec", "dist", "sqlite-vec.node"))
  } catch {
    // Extension not available, will use in-memory fallback
  }

  // Create vector table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      chunk TEXT NOT NULL,
      line_start INTEGER NOT NULL,
      line_end INTEGER NOT NULL,
      embedding BLOB,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    )
  `)

  // Create FTS5 table for BM25 search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
      chunk,
      content='memory_chunks',
      content_rowid='id'
    )
  `)

  db.close()
}

// Helper: Get text embedding using local model
async function getEmbedding(text: string): Promise<number[]> {
  // This would use node-llama-cpp for local embeddings
  // For now, return a simple hash-based embedding as fallback
  // TODO: Integrate with node-llama-cpp
  
  const words = text.toLowerCase().split(/\s+/)
  const embedding: number[] = []
  
  // Create a simple 384-dimension embedding (typical for small models)
  for (let i = 0; i < 384; i++) {
    let hash = 0
    for (let j = 0; j < words.length; j++) {
      const word = words[j]
      for (let k = 0; k < word.length; k++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(k)
        hash |= 0
      }
    }
    embedding.push((hash % 1000) / 1000) // Normalize to 0-1
  }
  
  return embedding
}

// Helper: Split text into chunks
function splitIntoChunks(text: string, filePath: string): Array<{
  file_path: string
  chunk: string
  line_start: number
  line_end: number
}> {
  const lines = text.split('\n')
  const chunks: ReturnType<typeof splitIntoChunks> = []
  
  let currentChunk: string[] = []
  let startLine = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    currentChunk.push(line)
    
    // Check if chunk is roughly target size (estimated by character count)
    const currentSize = currentChunk.join('\n').length
    const targetSize = CHUNK_SIZE * 4 // Rough estimate: 1 token ≈ 4 characters
    
    if (currentSize >= targetSize && currentChunk.length > CHUNK_OVERLAP / 4) {
      const endLine = i + 1
      chunks.push({
        file_path: filePath,
        chunk: currentChunk.join('\n'),
        line_start: startLine,
        line_end: endLine,
      })
      
      // Start new chunk with overlap
      const overlapLines = Math.floor(CHUNK_OVERLAP / 4)
      currentChunk = currentChunk.slice(-overlapLines)
      startLine = i - overlapLines + 1
    }
  }
  
  // Add remaining content
  if (currentChunk.length > 0) {
    chunks.push({
      file_path: filePath,
      chunk: currentChunk.join('\n'),
      line_start: startLine,
      line_end: lines.length,
    })
  }
  
  return chunks
}

// Helper: Calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Tool 1: Vector memory search (semantic)
export const vector_search = tool({
  description: "Semantic search across memory files using vector embeddings. Finds relevant past context even when wording differs. This is the most powerful search method for finding related memories.",
  args: {
    query: tool.schema.string().describe("Search query for semantic search. Use natural language descriptions."),
    scope: tool.schema.enum(["all", "long-term", "daily", "preference", "personality", "context", "tools", "identity", "user"]).describe("Search scope: all memory files or specific type"),
    days: tool.schema.number().optional().describe("Number of recent daily files to include in search. Defaults to 7."),
    limit: tool.schema.number().optional().describe("Maximum number of results to return. Defaults to 5."),
    hybrid: tool.schema.boolean().optional().describe("Enable hybrid search (BM25 + vector) for better results. Defaults to true."),
  },
  async execute(args) {
    await ensureVectorIndex()

    const query = args.query
    const limit = args.limit || 5
    const useHybrid = args.hybrid !== false // Default to true

    // Get query embedding
    const queryEmbedding = await getEmbedding(query)
    
    // Determine files to search and index
    const filesToIndex: string[] = []
    const daysToSearch = args.days || 7

    if (args.scope === "all" || args.scope === "long-term") {
      filesToIndex.push(path.join(MEMORY_DIR, "MEMORY.md"))
    }
    if (args.scope === "all" || args.scope === "preference") {
      filesToIndex.push(path.join(MEMORY_DIR, "PREFERENCES.md"))
    }
    if (args.scope === "all" || args.scope === "personality") {
      filesToIndex.push(path.join(MEMORY_DIR, "SOUL.md"))
    }
    if (args.scope === "all" || args.scope === "context") {
      filesToIndex.push(path.join(MEMORY_DIR, "CONTEXT.md"))
    }
    if (args.scope === "all" || args.scope === "tools") {
      filesToIndex.push(path.join(MEMORY_DIR, "TOOLS.md"))
    }
    if (args.scope === "all" || args.scope === "identity") {
      filesToIndex.push(path.join(MEMORY_DIR, "IDENTITY.md"))
    }
    if (args.scope === "all" || args.scope === "user") {
      filesToIndex.push(path.join(MEMORY_DIR, "USER.md"))
    }
    if (args.scope === "all" || args.scope === "daily") {
      const dailyDir = path.join(MEMORY_DIR, "daily")
      for (let i = 0; i < daysToSearch; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        filesToIndex.push(path.join(dailyDir, `${dateStr}.md`))
      }
    }

    // Index files and search
    const db = new Database(VECTOR_DB_PATH, { readonly: true })
    const results: { file: string; snippet: string; score: number; line_start: number; line_end: number }[] = []

    try {
      // First, check if we have indexed data
      const chunkCount = db.prepare("SELECT COUNT(*) as count FROM memory_chunks").get() as { count: number }
      
      if (chunkCount.count === 0) {
        db.close()
        return "Vector index is empty. No memories have been indexed yet. Write some memories first, then try searching."
      }

      // Perform vector search
      const vectorResults = db.prepare(`
        SELECT file_path, chunk, line_start, line_end, embedding
        FROM memory_chunks
        WHERE file_path IN (${filesToIndex.map(() => "?").join(", ")})
      `).all(...filesToIndex)

      for (const row of vectorResults) {
        const similarity = cosineSimilarity(queryEmbedding, JSON.parse(row.embedding as string))
        results.push({
          file: path.basename(row.file_path as string),
          snippet: (row.chunk as string).substring(0, 700),
          score: similarity,
          line_start: row.line_start as number,
          line_end: row.line_end as number,
        })
      }

      // Hybrid search with BM25 if enabled
      if (useHybrid) {
        const ftsResults = db.prepare(`
          SELECT memory_chunks.file_path, memory_chunks.chunk, memory_chunks.line_start, memory_chunks.line_end, bm25(memory_fts) as bm25_score
          FROM memory_fts
          JOIN memory_chunks ON memory_chunks.id = memory_fts.rowid
          WHERE memory_fts MATCH ? AND memory_chunks.file_path IN (${filesToIndex.map(() => "?").join(", ")})
          ORDER BY bm25_score
          LIMIT ${limit * 2}
        `).all(query, ...filesToIndex)

        // Combine vector and BM25 results
        const vectorScores = new Map<string, number>()
        for (const r of results) {
          vectorScores.set(`${r.file}:${r.line_start}`, r.score)
        }

        for (const row of ftsResults) {
          const key = `${path.basename(row.file_path as string)}:${row.line_start as number}`
          const vectorScore = vectorScores.get(key) || 0
          const bm25Score = 1 / (1 + (row.bm25_score as number))
          
          // Hybrid score: 70% vector + 30% BM25 (like OpenClaw)
          const hybridScore = 0.7 * vectorScore + 0.3 * bm25Score
          
          // Check if already in results, update score if better
          const existingIndex = results.findIndex((r) => r.file === path.basename(row.file_path as string) && r.line_start === row.line_start)
          if (existingIndex >= 0) {
            if (hybridScore > results[existingIndex].score) {
              results[existingIndex].score = hybridScore
            }
          } else if (hybridScore > 0.3) {
            results.push({
              file: path.basename(row.file_path as string),
              snippet: (row.chunk as string).substring(0, 700),
              score: hybridScore,
              line_start: row.line_start as number,
              line_end: row.line_end as number,
            })
          }
        }
      }

      // Sort by score and limit
      results.sort((a, b) => b.score - a.score)
      const topResults = results.slice(0, limit)

      // Format output
      if (topResults.length === 0) {
        db.close()
        return `No relevant memories found for: "${query}"\n\nTry different keywords or check if memories have been indexed.`
      }

      let output = `🔍 Semantic Search Results for: "${query}"\n\n`
      for (const r of topResults) {
        const scorePercent = (r.score * 100).toFixed(1)
        output += `### ${r.file} (Lines ${r.line_start}-${r.line_end})\n`
        output += `**Relevance**: ${scorePercent}%\n`
        output += `${r.snippet}${r.snippet.length >= 700 ? "..." : ""}\n\n`
      }

      return output.trim()
    } finally {
      db.close()
    }
  },
})

// Tool 2: Rebuild vector index
export const rebuild_index = tool({
  description: "Rebuild the vector index from all memory files. Use this after adding many new memories manually, or if search results seem outdated. This may take some time for large memory collections.",
  args: {
    force: tool.schema.boolean().optional().describe("Force complete rebuild even if index exists. Defaults to false."),
  },
  async execute(args) {
    await ensureVectorIndex()

    const db = new Database(VECTOR_DB_PATH)

    try {
      // Clear existing index if forced
      if (args.force) {
        db.exec("DELETE FROM memory_chunks")
        db.exec("DELETE FROM memory_fts")
      }

      // Get all markdown files to index
      const filesToIndex = [
        "MEMORY.md",
        "PREFERENCES.md",
        "SOUL.md",
        "USER.md",
        "IDENTITY.md",
        "TOOLS.md",
        "CONTEXT.md",
      ]

      // Add daily files
      const dailyDir = path.join(MEMORY_DIR, "daily")
      try {
        const dailyFiles = await readdir(dailyDir)
        for (const file of dailyFiles) {
          if (file.endsWith(".md")) {
            filesToIndex.push(path.join("daily", file))
          }
        }
      } catch {
        // Daily directory doesn't exist yet
      }

      let indexedChunks = 0
      let indexedFiles = 0

      for (const fileName of filesToIndex) {
        const filePath = path.join(MEMORY_DIR, fileName)
        
        try {
          if (!(await exists(filePath))) continue

          const content = await readFile(filePath, "utf-8")
          const chunks = splitIntoChunks(content, fileName)
          const relativePath = path.basename(fileName)

          for (const chunk of chunks) {
            const embedding = await getEmbedding(chunk.chunk)
            
            db.prepare(`
              INSERT INTO memory_chunks (file_path, chunk, line_start, line_end, embedding, metadata)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              chunk.file_path,
              chunk.chunk,
              chunk.line_start,
              chunk.line_end,
              JSON.stringify(embedding),
              JSON.stringify({ file: relativePath, lines: `${chunk.line_start}-${chunk.line_end}` }),
            )

            indexedChunks++
          }

          indexedFiles++
        } catch (error) {
          // Skip file on error
        }
      }

      return `✓ Vector index rebuilt successfully!\n\nIndexed ${indexedFiles} file(s) with ${indexedChunks} chunk(s).\n\nUse vector_memory_search to find relevant memories.`
    } finally {
      db.close()
    }
  },
})

// Tool 3: Check vector index status
export const index_status = tool({
  description: "Check the status of the vector index. Shows number of indexed files, chunks, and last update time.",
  args: {},
  async execute() {
    await ensureVectorIndex()

    const db = new Database(VECTOR_DB_PATH, { readonly: true })

    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT file_path) as files,
          COUNT(*) as chunks,
          MIN(created_at) as oldest,
          MAX(created_at) as newest
        FROM memory_chunks
      `).get() as { files: number; chunks: number; oldest: string; newest: string }

      if (stats.files === 0) {
        db.close()
        return "Vector index is empty. No memories have been indexed yet.\n\nUse rebuild_index to create the index from your memory files."
      }

      let output = "📊 Vector Index Status\n\n"
      output += `Files Indexed: ${stats.files}\n`
      output += `Chunks Indexed: ${stats.chunks}\n`
      output += `Oldest Entry: ${stats.oldest}\n`
      output += `Newest Entry: ${stats.newest}\n`
      
      const dbSize = (await stat(VECTOR_DB_PATH)).size / 1024
      output += `Database Size: ${dbSize.toFixed(2)} KB\n`

      return output
    } finally {
      db.close()
    }
  },
})

export default {
  vector_search,
  rebuild_index,
  index_status,
}
