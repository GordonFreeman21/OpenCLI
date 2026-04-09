import { Log } from "../util/log"
import z from "zod"

export namespace Ollama {
  const log = Log.create({ service: "ollama" })

  export const DEFAULT_URL = "http://localhost:11434"

  export const Config = z.object({
    url: z.string().default(DEFAULT_URL),
    model: z.string().default("llama3.2"),
    timeout: z.number().default(120000),
    keepAlive: z.string().default("5m"),
  })
  export type Config = z.infer<typeof Config>

  export const MODELS: Record<string, ModelInfo> = {
    "llama3.2": {
      id: "llama3.2",
      name: "Llama 3.2",
      context: 128000,
      toolCall: true,
      reasoning: false,
      family: "llama",
    },
    "llama3.2:1b": {
      id: "llama3.2:1b",
      name: "Llama 3.2 1B",
      context: 128000,
      toolCall: true,
      reasoning: false,
      family: "llama",
    },
    "llama3.1": {
      id: "llama3.1",
      name: "Llama 3.1",
      context: 128000,
      toolCall: true,
      reasoning: false,
      family: "llama",
    },
    "llama3.1:70b": {
      id: "llama3.1:70b",
      name: "Llama 3.1 70B",
      context: 128000,
      toolCall: true,
      reasoning: false,
      family: "llama",
    },
    codellama: {
      id: "codellama",
      name: "Code Llama",
      context: 16000,
      toolCall: false,
      reasoning: false,
      family: "codellama",
    },
    "codellama:70b": {
      id: "codellama:70b",
      name: "Code Llama 70B",
      context: 16000,
      toolCall: false,
      reasoning: false,
      family: "codellama",
    },
    "deepseek-coder-v2": {
      id: "deepseek-coder-v2",
      name: "DeepSeek Coder V2",
      context: 128000,
      toolCall: true,
      reasoning: false,
      family: "deepseek",
    },
    "deepseek-r1": {
      id: "deepseek-r1",
      name: "DeepSeek R1",
      context: 64000,
      toolCall: true,
      reasoning: true,
      family: "deepseek",
    },
    "qwen2.5-coder": {
      id: "qwen2.5-coder",
      name: "Qwen 2.5 Coder",
      context: 32000,
      toolCall: true,
      reasoning: false,
      family: "qwen",
    },
    "qwen2.5-coder:32b": {
      id: "qwen2.5-coder:32b",
      name: "Qwen 2.5 Coder 32B",
      context: 32000,
      toolCall: true,
      reasoning: false,
      family: "qwen",
    },
    "mistral": {
      id: "mistral",
      name: "Mistral 7B",
      context: 32000,
      toolCall: true,
      reasoning: false,
      family: "mistral",
    },
    "mixtral": {
      id: "mixtral",
      name: "Mixtral 8x7B",
      context: 32000,
      toolCall: true,
      reasoning: false,
      family: "mistral",
    },
    "phi3": {
      id: "phi3",
      name: "Phi-3",
      context: 128000,
      toolCall: true,
      reasoning: false,
      family: "phi",
    },
    "phi3:14b": {
      id: "phi3:14b",
      name: "Phi-3 14B",
      context: 128000,
      toolCall: true,
      reasoning: false,
      family: "phi",
    },
    "gemma2": {
      id: "gemma2",
      name: "Gemma 2",
      context: 8000,
      toolCall: true,
      reasoning: false,
      family: "gemma",
    },
    "gemma2:27b": {
      id: "gemma2:27b",
      name: "Gemma 2 27B",
      context: 8000,
      toolCall: true,
      reasoning: false,
      family: "gemma",
    },
    "starcoder2": {
      id: "starcoder2",
      name: "StarCoder 2",
      context: 16000,
      toolCall: false,
      reasoning: false,
      family: "starcoder",
    },
    "codegemma": {
      id: "codegemma",
      name: "CodeGemma",
      context: 8000,
      toolCall: true,
      reasoning: false,
      family: "gemma",
    },
  }

  interface ModelInfo {
    id: string
    name: string
    context: number
    toolCall: boolean
    reasoning: boolean
    family: string
  }

  export async function check(url = DEFAULT_URL): Promise<boolean> {
    try {
      const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) })
      return res.ok
    } catch {
      return false
    }
  }

  export async function models(url = DEFAULT_URL): Promise<string[]> {
    try {
      const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) return []
      const data = (await res.json()) as { models?: Array<{ name: string }> }
      return (data.models ?? []).map((m) => m.name)
    } catch {
      return []
    }
  }

  export async function pull(model: string, url = DEFAULT_URL): Promise<boolean> {
    try {
      const res = await fetch(`${url}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model, stream: false }),
        signal: AbortSignal.timeout(600000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  export function statusBanner(running: boolean, available: string[]) {
    if (!running) {
      return [
        "\x1b[91m┌──────────────────────────────────────────┐\x1b[0m",
        "\x1b[91m│\x1b[0m  ⚠️  Ollama is not running!               \x1b[91m│\x1b[0m",
        "\x1b[91m│\x1b[0m  Start it with: ollama serve              \x1b[91m│\x1b[0m",
        "\x1b[91m└──────────────────────────────────────────┘\x1b[0m",
      ].join("\n")
    }

    if (available.length === 0) {
      return [
        "\x1b[93m┌──────────────────────────────────────────┐\x1b[0m",
        "\x1b[93m│\x1b[0m  No models found! Pull one:              \x1b[93m│\x1b[0m",
        "\x1b[93m│\x1b[0m  ollama pull llama3.2                    \x1b[93m│\x1b[0m",
        "\x1b[93m└──────────────────────────────────────────┘\x1b[0m",
      ].join("\n")
    }

    const lines = [
      "\x1b[92m┌──────────────────────────────────────────┐\x1b[0m",
      `\x1b[92m│\x1b[0m  ✅ Ollama running (${available.length} models)`.padEnd(43) + `\x1b[92m│\x1b[0m`,
    ]
    for (const m of available.slice(0, 5)) {
      lines.push(`\x1b[92m│\x1b[0m    • ${m}`.padEnd(43) + `\x1b[92m│\x1b[0m`)
    }
    if (available.length > 5) {
      lines.push(`\x1b[92m│\x1b[0m    ... and ${available.length - 5} more`.padEnd(43) + `\x1b[92m│\x1b[0m`)
    }
    lines.push("\x1b[92m└──────────────────────────────────────────┘\x1b[0m")
    return lines.join("\n")
  }
}
