import { Log } from "../util/log"

export namespace QuickFix {
  const log = Log.create({ service: "quickfix" })

  export interface Diagnostic {
    file: string
    line: number
    column: number
    message: string
    severity: "error" | "warning" | "info"
    source?: string
  }

  export const SYSTEM_PROMPT = `You are a code fix assistant. Given a diagnostic error/warning and the surrounding code, suggest a minimal fix.

Rules:
- Output ONLY the fixed code, no explanations
- Keep changes minimal — fix only the reported issue
- Preserve formatting and style of surrounding code
- If you can't fix it, output "NO_FIX" on a single line`

  export async function collect(dir: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = []
    const { Process } = await import("../util/process")

    // Try TypeScript compiler
    const tsc = await Process.run(["npx", "tsc", "--noEmit", "--pretty", "false"], {
      cwd: dir,
      nothrow: true,
    })
    if (tsc.stdout.toString().trim()) {
      const lines = tsc.stdout.toString().split("\n")
      for (const line of lines) {
        const match = /^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.+)$/.exec(line)
        if (match) {
          diagnostics.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            severity: match[4] as "error" | "warning",
            message: match[5],
            source: "typescript",
          })
        }
      }
    }

    return diagnostics
  }

  export async function suggest(diagnostic: Diagnostic, code: string, url: string, model: string): Promise<string> {
    const prompt = `Fix this ${diagnostic.severity} at line ${diagnostic.line}:
Error: ${diagnostic.message}

Code:
\`\`\`
${code}
\`\`\`

Output only the fixed code.`

    try {
      const res = await fetch(`${url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          system: SYSTEM_PROMPT,
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) return ""
      const data = (await res.json()) as { response?: string }
      const fix = (data.response ?? "").trim()
      if (fix === "NO_FIX") return ""
      return fix
    } catch {
      return ""
    }
  }

  export function format(diagnostics: Diagnostic[]) {
    if (diagnostics.length === 0) return "  ✨ No issues found!"

    const errors = diagnostics.filter((d) => d.severity === "error")
    const warnings = diagnostics.filter((d) => d.severity === "warning")

    const lines: string[] = [
      "",
      "  \x1b[1m🩹 Quick Fix Diagnostics\x1b[0m",
      "",
      `  🔴 ${errors.length} errors  🟡 ${warnings.length} warnings`,
      "",
    ]

    for (const d of diagnostics.slice(0, 20)) {
      const icon = d.severity === "error" ? "🔴" : "🟡"
      lines.push(`  ${icon} \x1b[96m${d.file}\x1b[0m:\x1b[93m${d.line}\x1b[0m`)
      lines.push(`     ${d.message}`)
      lines.push("")
    }

    if (diagnostics.length > 20) {
      lines.push(`  \x1b[90m... and ${diagnostics.length - 20} more\x1b[0m`)
    }

    return lines.join("\n")
  }
}
