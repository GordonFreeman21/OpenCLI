import { Log } from "../util/log"

export namespace DiffSummary {
  const log = Log.create({ service: "diff-summary" })

  export const SYSTEM_PROMPT = `You are a code reviewer. Summarize the git diff in a clear, structured format.

Format:
## Summary
Brief one-line summary of all changes.

## Changes
- file.ts: Description of what changed
- other.ts: Description of what changed

## Impact
Brief assessment of the impact and risk level (low/medium/high).`

  export async function diff(ref = "HEAD"): Promise<string> {
    const { Process } = await import("../util/process")
    const result = await Process.run(["git", "diff", ref], { nothrow: true })
    if (result.code !== 0) return ""
    return result.stdout.toString()
  }

  export async function staged(): Promise<string> {
    const { Process } = await import("../util/process")
    const result = await Process.run(["git", "diff", "--cached"], { nothrow: true })
    if (result.code !== 0) return ""
    return result.stdout.toString()
  }

  export async function summarize(d: string, url: string, model: string): Promise<string> {
    if (!d.trim()) return "No changes to summarize."
    const prompt = `Summarize this git diff:\n\n${d.slice(0, 12000)}`
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
        signal: AbortSignal.timeout(60000),
      })
      if (!res.ok) return "Failed to generate summary."
      const data = (await res.json()) as { response?: string }
      return (data.response ?? "").trim()
    } catch {
      return "Failed to connect to Ollama."
    }
  }
}
