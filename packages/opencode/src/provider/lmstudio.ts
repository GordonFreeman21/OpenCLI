import z from "zod"

export namespace LMStudio {
  export const DEFAULT_URL = "http://127.0.0.1:1234/v1"

  export const Config = z.object({
    url: z.string().default(DEFAULT_URL),
    model: z.string().default("lmstudio/local-model"),
    timeout: z.number().default(120000),
  })
  export type Config = z.infer<typeof Config>

  interface Entry {
    id: string
  }

  function trim(url: string) {
    return url.endsWith("/") ? url.slice(0, -1) : url
  }

  export async function check(url = DEFAULT_URL): Promise<boolean> {
    try {
      const res = await fetch(`${trim(url)}/models`, {
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  export async function models(url = DEFAULT_URL): Promise<string[]> {
    try {
      const res = await fetch(`${trim(url)}/models`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) return []
      const data = (await res.json()) as { data?: Entry[] }
      return (data.data ?? []).map((item) => item.id).filter(Boolean)
    } catch {
      return []
    }
  }

  export function statusBanner(running: boolean, available: string[]) {
    if (!running) {
      return [
        "\x1b[91m┌──────────────────────────────────────────┐\x1b[0m",
        "\x1b[91m│\x1b[0m  ⚠️  LM Studio is not serving models.    \x1b[91m│\x1b[0m",
        "\x1b[91m│\x1b[0m  Start the local server on port 1234.    \x1b[91m│\x1b[0m",
        "\x1b[91m└──────────────────────────────────────────┘\x1b[0m",
      ].join("\n")
    }

    if (available.length === 0) {
      return [
        "\x1b[93m┌──────────────────────────────────────────┐\x1b[0m",
        "\x1b[93m│\x1b[0m  No LM Studio models are loaded yet.     \x1b[93m│\x1b[0m",
        "\x1b[93m│\x1b[0m  Load one in LM Studio and try again.    \x1b[93m│\x1b[0m",
        "\x1b[93m└──────────────────────────────────────────┘\x1b[0m",
      ].join("\n")
    }

    const lines = [
      "\x1b[92m┌──────────────────────────────────────────┐\x1b[0m",
      `\x1b[92m│\x1b[0m  ✅ LM Studio running (${available.length} models)`.padEnd(43) + `\x1b[92m│\x1b[0m`,
    ]
    for (const item of available.slice(0, 5)) {
      lines.push(`\x1b[92m│\x1b[0m    • ${item}`.padEnd(43) + `\x1b[92m│\x1b[0m`)
    }
    if (available.length > 5) {
      lines.push(`\x1b[92m│\x1b[0m    ... and ${available.length - 5} more`.padEnd(43) + `\x1b[92m│\x1b[0m`)
    }
    lines.push("\x1b[92m└──────────────────────────────────────────┘\x1b[0m")
    return lines.join("\n")
  }
}
