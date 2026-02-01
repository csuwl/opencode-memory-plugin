import { tool } from "@opencode-ai/plugin"
import path from "path"
import { readFile, writeFile, mkdir, readdir, stat, exists } from "fs/promises"

const MEMORY_DIR = path.join(process.env.HOME || "", ".opencode", "memory")
const DAILY_DIR = path.join(MEMORY_DIR, "daily")

// Helper: Ensure memory directory structure exists
async function ensureMemoryDirs() {
  await mkdir(MEMORY_DIR, { recursive: true })
  await mkdir(DAILY_DIR, { recursive: true })
}

// Helper: Get today's date string
function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

// Helper: Format timestamp for memory entries
function formatTimestamp() {
  return new Date().toISOString()
}

// Helper: Get file path by memory type
function getMemoryFilePath(type: string, date?: string): string {
  switch (type) {
    case "long-term":
      return path.join(MEMORY_DIR, "MEMORY.md")
    case "preference":
      return path.join(MEMORY_DIR, "PREFERENCES.md")
    case "personality":
      return path.join(MEMORY_DIR, "SOUL.md")
    case "context":
      return path.join(MEMORY_DIR, "CONTEXT.md")
    case "tools":
      return path.join(MEMORY_DIR, "TOOLS.md")
    case "identity":
      return path.join(MEMORY_DIR, "IDENTITY.md")
    case "user":
      return path.join(MEMORY_DIR, "USER.md")
    case "daily":
      const dateStr = date || getTodayDate()
      return path.join(DAILY_DIR, `${dateStr}.md`)
    default:
      throw new Error(`Unknown memory type: ${type}`)
  }
}

// Tool 1: Write memory
export const write = tool({
  description: "Write a memory entry to the memory system. Use this to store important information that should be remembered across sessions and projects. Types: long-term (MEMORY.md), daily (today's log), preference (PREFERENCES.md), personality (SOUL.md), context (CONTEXT.md), tools (TOOLS.md), identity (IDENTITY.md), user (USER.md).",
  args: {
    content: tool.schema.string().describe("The memory content to write. Include as much context as possible."),
    type: tool.schema.enum(["long-term", "daily", "preference", "personality", "context", "tools", "identity", "user"]).describe("Type of memory to write to"),
    tags: tool.schema.array(tool.schema.string()).optional().describe("Optional tags for categorization (e.g., ['code-style', 'project-xyz'])"),
  },
  async execute(args) {
    await ensureMemoryDirs()

    const filePath = getMemoryFilePath(args.type)
    const timestamp = formatTimestamp()
    let entry = ""

    // Format entry with metadata
    if (args.tags && args.tags.length > 0) {
      entry += `\n\n## ${timestamp} ${args.tags.map((t) => `#${t}`).join(' ')}\n`
    } else {
      entry += `\n\n## ${timestamp}\n`
    }
    entry += `${args.content}\n`

    // Append to file
    try {
      if (await exists(filePath)) {
        await writeFile(filePath, entry, { flag: "a" })
      } else {
        await writeFile(filePath, entry)
      }
      return `✓ Memory saved to ${path.basename(filePath)}`
    } catch (error) {
      return `✗ Failed to write memory: ${(error as Error).message}`
    }
  },
})

// Tool 2: Read memory
export const read = tool({
  description: "Read memory from the memory system. Use this to retrieve stored preferences, long-term memory, daily logs, or configuration files.",
  args: {
    type: tool.schema.enum(["long-term", "daily", "preference", "personality", "context", "tools", "identity", "user"]).describe("Type of memory to read"),
    date: tool.schema.string().optional().describe("Specific date for daily memory (YYYY-MM-DD format). Defaults to today."),
    lines: tool.schema.number().optional().describe("Number of lines to return. Defaults to all lines."),
  },
  async execute(args) {
    await ensureMemoryDirs()

    const filePath = getMemoryFilePath(args.type, args.date)
    const limit = args.lines

    try {
      let content = await readFile(filePath, "utf-8")
      
      // Truncate if limit specified
      if (limit && content.split('\n').length > limit) {
        const lines = content.split('\n')
        content = lines.slice(-limit).join('\n')
        content += `\n\n[... Showed last ${limit} lines. Use read without limit to see full content.]\n`
      }

      return content
    } catch (error) {
      return `Memory file not found: ${path.basename(filePath)}. You can create it using the write tool.`
    }
  },
})

// Tool 3: Search memory (keyword-based)
export const search = tool({
  description: "Search memory files for relevant information using keywords and simple pattern matching. Returns matching entries with file paths and line numbers. For semantic search, use vector_memory_search.",
  args: {
    query: tool.schema.string().describe("Search query - use keywords to find relevant memories. Multiple keywords can be separated by spaces."),
    scope: tool.schema.enum(["all", "long-term", "daily", "preference", "personality", "context", "tools", "identity", "user"]).describe("Search scope: all memory files or specific type"),
    days: tool.schema.number().optional().describe("Number of recent daily files to search. Defaults to 7 (last 7 days)."),
    limit: tool.schema.number().optional().describe("Maximum number of results per file to return. Defaults to 5."),
  },
  async execute(args) {
    await ensureMemoryDirs()

    const filesToSearch: string[] = []
    const keywords = args.query.toLowerCase().split(/\s+/).filter(kw => kw.length > 0)

    if (keywords.length === 0) {
      return "Please provide at least one keyword to search for."
    }

    // Determine files to search
    if (args.scope === "all" || args.scope === "long-term") {
      filesToSearch.push(getMemoryFilePath("long-term"))
    }
    if (args.scope === "all" || args.scope === "preference") {
      filesToSearch.push(getMemoryFilePath("preference"))
    }
    if (args.scope === "all" || args.scope === "personality") {
      filesToSearch.push(getMemoryFilePath("personality"))
    }
    if (args.scope === "all" || args.scope === "context") {
      filesToSearch.push(getMemoryFilePath("context"))
    }
    if (args.scope === "all" || args.scope === "tools") {
      filesToSearch.push(getMemoryFilePath("tools"))
    }
    if (args.scope === "all" || args.scope === "identity") {
      filesToSearch.push(getMemoryFilePath("identity"))
    }
    if (args.scope === "all" || args.scope === "user") {
      filesToSearch.push(getMemoryFilePath("user"))
    }
    if (args.scope === "all" || args.scope === "daily") {
      const daysToSearch = args.days || 7
      for (let i = 0; i < daysToSearch; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        filesToSearch.push(getMemoryFilePath("daily", dateStr))
      }
    }

    const results: { file: string; matches: string[]; count: number }[] = []

    // Search each file
    for (const filePath of filesToSearch) {
      try {
        const content = await readFile(filePath, "utf-8")
        const lines = content.split('\n')
        const matches: string[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase()
          const matchedKeywords = keywords.filter(kw => line.includes(kw))

          // Only count as match if at least one keyword matches
          if (matchedKeywords.length > 0) {
            // Get context (2 lines before and after)
            const start = Math.max(0, i - 2)
            const end = Math.min(lines.length, i + 3)
            const context = lines.slice(start, end).join('\n')

            // Add match with line number
            matches.push(`Line ${i + 1}: ${context.trim()}`)
          }
        }

        if (matches.length > 0) {
          results.push({
            file: path.basename(filePath),
            matches: matches.slice(0, args.limit || 5),
            count: matches.length,
          })
        }
      } catch {
        // File doesn't exist, skip
      }
    }

    if (results.length === 0) {
      return `No matches found for: "${args.query}"\n\nSearched ${filesToSearch.length} file(s). Try different keywords or a broader scope.`
    }

    // Format output
    let output = `Found ${results.length} file(s) with matches:\n\n`
    for (const result of results) {
      output += `### ${result.file} (${result.count} match(es))\n`
      output += result.matches.join('\n') + '\n\n'
    }

    return output.trim()
  },
})

// Tool 4: List daily logs
export const list_daily = tool({
  description: "List available daily memory log files. Useful for finding recent activity and managing daily memory.",
  args: {
    days: tool.schema.number().optional().describe("Number of recent days to list. Defaults to 30 (last 30 days)."),
  },
  async execute(args) {
    await ensureMemoryDirs()

    const daysToList = args.days || 30
    const dailyFiles: { date: string; size: number; exists: boolean }[] = []

    for (let i = 0; i < daysToList; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const filePath = getMemoryFilePath("daily", dateStr)

      try {
        const stats = await stat(filePath)
        dailyFiles.push({
          date: dateStr,
          size: stats.size,
          exists: true,
        })
      } catch {
        dailyFiles.push({
          date: dateStr,
          size: 0,
          exists: false,
        })
      }
    }

    // Format output
    const existingFiles = dailyFiles.filter((f) => f.exists)
    if (existingFiles.length === 0) {
      return "No daily memory files found yet. Start by writing to daily memory!"
    }

    let output = `Daily Memory Files (last ${daysToList} days):\n\n`
    for (const file of existingFiles) {
      const sizeKB = (file.size / 1024).toFixed(2)
      output += `📄 ${file.date} (${sizeKB} KB)\n`
    }

    output += `\nTotal: ${existingFiles.length} file(s)`
    return output
  },
})

// Tool 5: Initialize daily log
export const init_daily = tool({
  description: "Initialize today's daily memory log file. Automatically called at start of sessions. Creates a new daily file with header if it doesn't exist.",
  args: {},
  async execute() {
    await ensureMemoryDirs()

    const today = getTodayDate()
    const filePath = getMemoryFilePath("daily", today)

    try {
      if (!(await exists(filePath))) {
        const header = `# Daily Memory Log - ${today}\n\n`
        header += `*Session starts: ${formatTimestamp()}*\n\n`
        header += `## Notes\n\n\n`
        header += `## Tasks\n\n\n`
        header += `## Learnings\n\n`
        header += `---\n`
        
        await writeFile(filePath, header)
        return `✓ Created daily memory file: ${today}.md`
      } else {
        return `✓ Daily memory file already exists: ${today}.md`
      }
    } catch (error) {
      return `✗ Failed to initialize daily log: ${(error as Error).message}`
    }
  },
})

// Export default tool for backward compatibility
export default {
  write,
  read,
  search,
  list_daily,
  init_daily,
}
