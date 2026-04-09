import type { CommandModule } from "yargs"
import { EOL } from "os"
import { SnippetLib } from "../../features/snippets"

export const SnippetCommand: CommandModule = {
  command: "snippet",
  describe: "Manage your code snippet library",
  builder: (yargs) =>
    yargs
      .command("add <title>", "Save a new snippet", (y) =>
        y
          .positional("title", { type: "string", demandOption: true })
          .option("lang", { describe: "Language", type: "string", default: "text", alias: "l" })
          .option("tags", { describe: "Comma-separated tags", type: "string", alias: "t" })
          .option("code", { describe: "Code content (or pipe from stdin)", type: "string", alias: "c" }),
      )
      .command("list", "List all snippets", (y) =>
        y.option("tag", { describe: "Filter by tag", type: "string" }),
      )
      .command("search <query>", "Search snippets", (y) =>
        y.positional("query", { type: "string", demandOption: true }),
      )
      .command("remove <id>", "Remove a snippet", (y) =>
        y.positional("id", { type: "string", demandOption: true }),
      )
      .demandCommand(1),
  handler: async () => {},
}

export const SnippetAddHandler = async (opts: Record<string, unknown>) => {
  const code = (opts.code as string) || (await readStdin())
  if (!code) {
    process.stderr.write("No code provided. Use --code or pipe from stdin." + EOL)
    process.exit(1)
  }
  const tags = opts.tags ? (opts.tags as string).split(",").map((t: string) => t.trim()) : []
  const id = await SnippetLib.add(opts.title as string, opts.lang as string, code, tags)
  process.stderr.write(`✅ Saved snippet: ${id}` + EOL)
}

export const SnippetListHandler = async (opts: Record<string, unknown>) => {
  const snippets = await SnippetLib.list(opts.tag as string | undefined)
  process.stderr.write(SnippetLib.format(snippets) + EOL)
}

export const SnippetSearchHandler = async (opts: Record<string, unknown>) => {
  const snippets = await SnippetLib.search(opts.query as string)
  process.stderr.write(SnippetLib.format(snippets) + EOL)
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return ""
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString()
}
