import path from "path"
import { Global } from "../../global"
import { Filesystem } from "../../util/filesystem"
import { Log } from "../../util/log"
import { mkdir } from "fs/promises"
import z from "zod"

export namespace ContextMemory {
  const log = Log.create({ service: "memory" })

  const Entry = z.object({
    id: z.string(),
    key: z.string(),
    value: z.string(),
    category: z.enum(["preference", "fact", "context", "note"]).default("note"),
    created: z.number(),
    accessed: z.number(),
    hits: z.number().default(0),
  })
  export type Entry = z.infer<typeof Entry>

  function dir() {
    return path.join(Global.Path.data, "memory")
  }

  function file() {
    return path.join(dir(), "store.json")
  }

  async function load(): Promise<Entry[]> {
    try {
      const text = await Filesystem.readText(file())
      return JSON.parse(text)
    } catch {
      return []
    }
  }

  async function save(entries: Entry[]) {
    await mkdir(dir(), { recursive: true })
    await Filesystem.write(file(), JSON.stringify(entries, null, 2))
  }

  export async function remember(key: string, value: string, category: Entry["category"] = "note") {
    const entries = await load()
    const now = Date.now()
    const existing = entries.find((e) => e.key === key)
    if (existing) {
      existing.value = value
      existing.category = category
      existing.accessed = now
    } else {
      entries.push({
        id: `mem_${now}_${Math.random().toString(36).slice(2, 8)}`,
        key,
        value,
        category,
        created: now,
        accessed: now,
        hits: 0,
      })
    }
    await save(entries)
  }

  export async function recall(key: string): Promise<string | undefined> {
    const entries = await load()
    const entry = entries.find((e) => e.key === key)
    if (!entry) return undefined
    entry.hits++
    entry.accessed = Date.now()
    await save(entries)
    return entry.value
  }

  export async function search(query: string): Promise<Entry[]> {
    const entries = await load()
    const q = query.toLowerCase()
    return entries.filter(
      (e) => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q),
    )
  }

  export async function forget(key: string) {
    const entries = await load()
    const filtered = entries.filter((e) => e.key !== key)
    await save(filtered)
    return filtered.length < entries.length
  }

  export async function all(): Promise<Entry[]> {
    return load()
  }

  export async function clear() {
    await save([])
  }

  export async function inject(): Promise<string> {
    const entries = await load()
    if (entries.length === 0) return ""

    const lines = [
      "## Context Memory",
      "The following are remembered facts and preferences from previous sessions:",
      "",
    ]
    for (const e of entries.slice(-20)) {
      lines.push(`- **${e.key}**: ${e.value}`)
    }
    return lines.join("\n")
  }

  export function format(entries: Entry[]) {
    if (entries.length === 0) return "  No memories stored yet. Use 'opencli remember <key> <value>' to add one."

    const lines: string[] = ["", "  \x1b[1m🧠 Context Memory\x1b[0m", ""]
    for (const e of entries) {
      const age = Math.floor((Date.now() - e.created) / 86400000)
      const badge = e.category === "preference" ? "⚙️" : e.category === "fact" ? "📌" : e.category === "context" ? "🔗" : "📝"
      lines.push(`  ${badge} \x1b[96m${e.key}\x1b[0m = ${e.value}  \x1b[90m(${age}d ago, ${e.hits} hits)\x1b[0m`)
    }
    lines.push("")
    return lines.join("\n")
  }
}
