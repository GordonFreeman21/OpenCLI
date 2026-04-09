import path from "path"
import { Log } from "../util/log"

export namespace CodeStats {
  const log = Log.create({ service: "code-stats" })

  const EXTENSIONS: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript (JSX)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (JSX)",
    ".py": "Python",
    ".rs": "Rust",
    ".go": "Go",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C Header",
    ".hpp": "C++ Header",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".scala": "Scala",
    ".cs": "C#",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".less": "Less",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".xml": "XML",
    ".md": "Markdown",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Bash",
    ".zsh": "Zsh",
    ".fish": "Fish",
    ".lua": "Lua",
    ".zig": "Zig",
    ".ex": "Elixir",
    ".exs": "Elixir Script",
    ".erl": "Erlang",
    ".hs": "Haskell",
    ".ml": "OCaml",
    ".clj": "Clojure",
    ".dart": "Dart",
    ".r": "R",
    ".jl": "Julia",
  }

  export interface Stats {
    totalFiles: number
    totalLines: number
    languages: Record<string, { files: number; lines: number; blank: number; comment: number }>
    largest: Array<{ file: string; lines: number }>
  }

  export async function scan(dir: string): Promise<Stats> {
    const { Process } = await import("../util/process")
    const result: Stats = {
      totalFiles: 0,
      totalLines: 0,
      languages: {},
      largest: [],
    }

    try {
      const find = await Process.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        { cwd: dir, nothrow: true },
      )
      if (find.code !== 0) return result

      const files = find.stdout
        .toString()
        .split("\n")
        .filter((f: string) => f.trim())

      const sizes: Array<{ file: string; lines: number }> = []

      for (const file of files) {
        const ext = path.extname(file).toLowerCase()
        const lang = EXTENSIONS[ext]
        if (!lang) continue

        try {
          const content = await Bun.file(path.join(dir, file)).text()
          const lines = content.split("\n")
          const total = lines.length
          const blank = lines.filter((l) => !l.trim()).length
          const comment = lines.filter((l) => {
            const t = l.trim()
            return t.startsWith("//") || t.startsWith("#") || t.startsWith("/*") || t.startsWith("*")
          }).length

          if (!result.languages[lang]) {
            result.languages[lang] = { files: 0, lines: 0, blank: 0, comment: 0 }
          }
          result.languages[lang].files++
          result.languages[lang].lines += total
          result.languages[lang].blank += blank
          result.languages[lang].comment += comment
          result.totalFiles++
          result.totalLines += total
          sizes.push({ file, lines: total })
        } catch {
          continue
        }
      }

      result.largest = sizes.sort((a, b) => b.lines - a.lines).slice(0, 10)
    } catch {
      log.error("failed to scan")
    }

    return result
  }

  export function format(stats: Stats) {
    const lines: string[] = []
    const bar = "━".repeat(50)
    lines.push("")
    lines.push(`\x1b[96m${bar}\x1b[0m`)
    lines.push(`\x1b[1m  📊 Code Statistics\x1b[0m`)
    lines.push(`\x1b[96m${bar}\x1b[0m`)
    lines.push("")
    lines.push(`  Total files: \x1b[93m${stats.totalFiles.toLocaleString()}\x1b[0m`)
    lines.push(`  Total lines: \x1b[93m${stats.totalLines.toLocaleString()}\x1b[0m`)
    lines.push("")

    const sorted = Object.entries(stats.languages).sort((a, b) => b[1].lines - a[1].lines)
    const maxName = Math.max(...sorted.map(([n]) => n.length), 10)
    const maxLines = stats.totalLines || 1

    lines.push(`  ${"Language".padEnd(maxName)}  ${"Lines".padStart(8)}  ${"Files".padStart(6)}  Bar`)
    lines.push(`  ${"─".repeat(maxName)}  ${"─".repeat(8)}  ${"─".repeat(6)}  ${"─".repeat(20)}`)

    for (const [lang, data] of sorted.slice(0, 15)) {
      const pct = data.lines / maxLines
      const barLen = Math.max(1, Math.round(pct * 20))
      const block = "█".repeat(barLen) + "░".repeat(20 - barLen)
      lines.push(
        `  ${lang.padEnd(maxName)}  ${data.lines.toLocaleString().padStart(8)}  ${String(data.files).padStart(6)}  \x1b[96m${block}\x1b[0m`,
      )
    }

    if (stats.largest.length > 0) {
      lines.push("")
      lines.push(`  \x1b[1m📁 Largest files:\x1b[0m`)
      for (const f of stats.largest.slice(0, 5)) {
        lines.push(`    ${f.lines.toLocaleString().padStart(6)} lines  ${f.file}`)
      }
    }

    lines.push("")
    return lines.join("\n")
  }
}
