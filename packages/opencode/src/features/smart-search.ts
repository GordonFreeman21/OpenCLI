import { Log } from "../util/log"
import fuzzysort from "fuzzysort"
import path from "path"

export namespace SmartSearch {
  const log = Log.create({ service: "smart-search" })

  export interface Result {
    file: string
    line: number
    content: string
    score: number
    context: string[]
  }

  export async function search(query: string, dir: string, opts?: { limit?: number; fuzzy?: boolean }): Promise<Result[]> {
    const { Process } = await import("../util/process")
    const limit = opts?.limit ?? 20

    // Use ripgrep for initial search
    const args = ["rg", "--json", "--max-count", "50", "-i"]
    if (opts?.fuzzy) {
      // For fuzzy, split query into terms and use AND matching
      const terms = query.split(/\s+/).filter(Boolean)
      for (const term of terms) {
        args.push("-e", term)
      }
    } else {
      args.push(query)
    }
    args.push(dir)

    const result = await Process.run(args, { nothrow: true })
    if (result.code !== 0 && result.code !== 1) return []

    const lines = result.stdout.toString().split("\n").filter(Boolean)
    const results: Result[] = []

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        if (parsed.type !== "match") continue
        const data = parsed.data
        results.push({
          file: path.relative(dir, data.path.text),
          line: data.line_number,
          content: data.lines.text.trim(),
          score: 0,
          context: [],
        })
      } catch {
        continue
      }
    }

    // Apply fuzzy ranking if enabled
    if (opts?.fuzzy && results.length > 0) {
      const ranked = fuzzysort.go(
        query,
        results.map((r) => r.content),
        { limit, threshold: -10000 },
      )
      const rankedContents = new Set(ranked.map((r) => r.target))
      return results
        .filter((r) => rankedContents.has(r.content))
        .map((r) => {
          const match = ranked.find((m) => m.target === r.content)
          return { ...r, score: match?.score ?? 0 }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    }

    return results.slice(0, limit)
  }

  export function format(results: Result[], query: string) {
    if (results.length === 0) return `  No results for "${query}"`

    const lines: string[] = ["", `  \x1b[1m🔍 Search: "${query}"\x1b[0m  (${results.length} results)`, ""]

    for (const r of results) {
      const score = r.score ? ` \x1b[90m(${r.score})\x1b[0m` : ""
      lines.push(`  \x1b[96m${r.file}\x1b[0m:\x1b[93m${r.line}\x1b[0m${score}`)
      lines.push(`    ${highlight(r.content, query)}`)
      lines.push("")
    }
    return lines.join("\n")
  }

  function highlight(text: string, query: string) {
    const terms = query.split(/\s+/).filter(Boolean)
    let result = text
    for (const term of terms) {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      result = result.replace(regex, "\x1b[91m$1\x1b[0m")
    }
    return result
  }
}
