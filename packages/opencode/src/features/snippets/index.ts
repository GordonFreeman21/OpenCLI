import path from "path"
import { Global } from "../../global"
import { Filesystem } from "../../util/filesystem"
import { Log } from "../../util/log"
import { mkdir } from "fs/promises"
import z from "zod"

export namespace SnippetLib {
  const log = Log.create({ service: "snippets" })

  const Snippet = z.object({
    id: z.string(),
    title: z.string(),
    language: z.string(),
    code: z.string(),
    tags: z.string().array().default([]),
    created: z.number(),
    updated: z.number(),
  })
  export type Snippet = z.infer<typeof Snippet>

  function dir() {
    return path.join(Global.Path.data, "snippets")
  }

  function file() {
    return path.join(dir(), "library.json")
  }

  async function load(): Promise<Snippet[]> {
    try {
      const text = await Filesystem.readText(file())
      return JSON.parse(text)
    } catch {
      return []
    }
  }

  async function save(snippets: Snippet[]) {
    await mkdir(dir(), { recursive: true })
    await Filesystem.write(file(), JSON.stringify(snippets, null, 2))
  }

  export async function add(title: string, language: string, code: string, tags: string[] = []) {
    const snippets = await load()
    const now = Date.now()
    const id = `snip_${now}_${Math.random().toString(36).slice(2, 8)}`
    snippets.push({ id, title, language, code, tags, created: now, updated: now })
    await save(snippets)
    return id
  }

  export async function remove(id: string) {
    const snippets = await load()
    const filtered = snippets.filter((s) => s.id !== id)
    await save(filtered)
    return filtered.length < snippets.length
  }

  export async function list(tag?: string): Promise<Snippet[]> {
    const snippets = await load()
    if (!tag) return snippets
    return snippets.filter((s) => s.tags.includes(tag))
  }

  export async function search(query: string): Promise<Snippet[]> {
    const snippets = await load()
    const q = query.toLowerCase()
    return snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }

  export async function get(id: string): Promise<Snippet | undefined> {
    const snippets = await load()
    return snippets.find((s) => s.id === id)
  }

  export function format(snippets: Snippet[]) {
    if (snippets.length === 0) return "  No snippets saved yet. Use 'opencli snippet add' to save one."

    const lines: string[] = [""]
    for (const s of snippets) {
      const date = new Date(s.created).toLocaleDateString()
      const tags = s.tags.length ? ` \x1b[90m[${s.tags.join(", ")}]\x1b[0m` : ""
      lines.push(`  \x1b[96m${s.title}\x1b[0m  \x1b[90m(${s.language})\x1b[0m${tags}  ${date}`)
      const preview = s.code.split("\n").slice(0, 3).join("\n    ")
      lines.push(`    ${preview}`)
      if (s.code.split("\n").length > 3) lines.push(`    \x1b[90m... (${s.code.split("\n").length} lines)\x1b[0m`)
      lines.push("")
    }
    return lines.join("\n")
  }
}
