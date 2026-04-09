import path from "path"
import { Log } from "../util/log"

export namespace HealthCheck {
  const log = Log.create({ service: "health" })

  export interface Result {
    score: number // 0-100
    issues: Issue[]
    suggestions: string[]
  }

  export interface Issue {
    severity: "info" | "warn" | "error"
    category: string
    message: string
    file?: string
  }

  export async function run(dir: string): Promise<Result> {
    const issues: Issue[] = []
    const suggestions: string[] = []

    // Check for common project files
    const checks = [
      { file: ".gitignore", msg: "No .gitignore found", sev: "warn" as const, cat: "git" },
      { file: "README.md", msg: "No README.md found", sev: "info" as const, cat: "docs" },
      { file: "LICENSE", msg: "No LICENSE file found", sev: "info" as const, cat: "legal" },
      { file: ".editorconfig", msg: "No .editorconfig — consider adding for consistent formatting", sev: "info" as const, cat: "style" },
    ]

    for (const check of checks) {
      try {
        await Bun.file(path.join(dir, check.file)).text()
      } catch {
        issues.push({ severity: check.sev, category: check.cat, message: check.msg })
      }
    }

    // Check package.json
    try {
      const pkg = JSON.parse(await Bun.file(path.join(dir, "package.json")).text())
      if (!pkg.scripts?.test || pkg.scripts.test.includes("no test")) {
        issues.push({ severity: "warn", category: "testing", message: "No test script configured" })
        suggestions.push("Add a test framework (vitest, jest, or bun test)")
      }
      if (!pkg.scripts?.lint) {
        issues.push({ severity: "info", category: "quality", message: "No lint script configured" })
        suggestions.push("Add a linter (eslint, biome, or oxlint)")
      }
      if (!pkg.engines) {
        issues.push({ severity: "info", category: "compat", message: "No engines field in package.json" })
      }

      // Check for outdated or known-vulnerable patterns
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (deps["moment"]) {
        suggestions.push("Consider replacing moment.js with date-fns or luxon (moment is in maintenance mode)")
      }
      if (deps["request"]) {
        issues.push({ severity: "warn", category: "deps", message: "Package 'request' is deprecated" })
      }
      if (deps["lodash"] && !deps["lodash-es"]) {
        suggestions.push("Consider using lodash-es for better tree-shaking or native Array methods")
      }
    } catch {}

    // Check for TypeScript config
    try {
      const tsconfig = JSON.parse(await Bun.file(path.join(dir, "tsconfig.json")).text())
      if (!tsconfig.compilerOptions?.strict) {
        issues.push({ severity: "info", category: "typescript", message: "TypeScript strict mode is disabled" })
        suggestions.push("Enable strict mode in tsconfig.json for better type safety")
      }
    } catch {}

    // Check for .env files committed
    try {
      const { Process } = await import("../util/process")
      const result = await Process.run(["git", "ls-files", ".env", ".env.local", ".env.production"], {
        cwd: dir,
        nothrow: true,
      })
      if (result.code === 0 && result.stdout.toString().trim()) {
        issues.push({ severity: "error", category: "security", message: ".env files are tracked by git — add them to .gitignore!" })
      }
    } catch {}

    // Check for large files
    try {
      const { Process } = await import("../util/process")
      const result = await Process.run(["git", "ls-files"], { cwd: dir, nothrow: true })
      if (result.code === 0) {
        const files = result.stdout.toString().split("\n").filter(Boolean)
        for (const f of files) {
          try {
            const stat = Bun.file(path.join(dir, f))
            if (stat.size > 1_000_000) {
              issues.push({
                severity: "warn",
                category: "size",
                message: `Large file: ${f} (${(stat.size / 1_000_000).toFixed(1)}MB)`,
                file: f,
              })
            }
          } catch {}
        }
      }
    } catch {}

    // Calculate score
    const errorCount = issues.filter((i) => i.severity === "error").length
    const warnCount = issues.filter((i) => i.severity === "warn").length
    const infoCount = issues.filter((i) => i.severity === "info").length
    const score = Math.max(0, 100 - errorCount * 20 - warnCount * 10 - infoCount * 2)

    return { score, issues, suggestions }
  }

  export function format(result: Result) {
    const lines: string[] = []
    const bar = "━".repeat(50)
    const scoreColor = result.score >= 80 ? "\x1b[92m" : result.score >= 50 ? "\x1b[93m" : "\x1b[91m"
    const emoji = result.score >= 80 ? "🟢" : result.score >= 50 ? "🟡" : "🔴"

    lines.push("")
    lines.push(`\x1b[96m${bar}\x1b[0m`)
    lines.push(`\x1b[1m  🏥 Project Health Check\x1b[0m`)
    lines.push(`\x1b[96m${bar}\x1b[0m`)
    lines.push("")
    lines.push(`  ${emoji} Health Score: ${scoreColor}${result.score}/100\x1b[0m`)
    lines.push("")

    if (result.issues.length > 0) {
      lines.push("  \x1b[1mIssues:\x1b[0m")
      for (const issue of result.issues) {
        const icon = issue.severity === "error" ? "🔴" : issue.severity === "warn" ? "🟡" : "ℹ️"
        lines.push(`    ${icon} \x1b[90m[${issue.category}]\x1b[0m ${issue.message}`)
      }
      lines.push("")
    }

    if (result.suggestions.length > 0) {
      lines.push("  \x1b[1m💡 Suggestions:\x1b[0m")
      for (const s of result.suggestions) {
        lines.push(`    → ${s}`)
      }
      lines.push("")
    }

    if (result.issues.length === 0 && result.suggestions.length === 0) {
      lines.push("  ✨ Everything looks great!")
      lines.push("")
    }

    return lines.join("\n")
  }
}
