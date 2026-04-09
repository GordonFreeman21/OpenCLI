import { Log } from "../util/log"
import path from "path"
import { Global } from "../global"
import { Filesystem } from "../util/filesystem"
import z from "zod"

export namespace SmartCommit {
  const log = Log.create({ service: "smart-commit" })

  export const SYSTEM_PROMPT = `You are a git commit message generator. Given a git diff, write a concise, conventional commit message.

Rules:
- Use conventional commits format: type(scope): description
- Types: feat, fix, refactor, docs, style, test, chore, perf, ci, build
- Keep the subject line under 72 characters
- Add a body if the change is complex (separated by blank line)
- Be specific about what changed and why
- Do not include file paths in the subject line

Examples:
- feat(auth): add JWT token refresh logic
- fix(parser): handle empty input without crashing
- refactor(api): extract validation into middleware`

  export async function diff(): Promise<string> {
    const { Process } = await import("../util/process")
    const result = await Process.run(["git", "diff", "--cached"], { nothrow: true })
    if (result.code !== 0) return ""
    return result.stdout.toString()
  }

  export async function generate(d: string, url: string, model: string): Promise<string> {
    if (!d.trim()) return ""
    const prompt = `Generate a git commit message for this diff:\n\n${d.slice(0, 8000)}`
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
      return (data.response ?? "").trim()
    } catch {
      return ""
    }
  }
}
