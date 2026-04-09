import type { CommandModule } from "yargs"
import { EOL } from "os"
import { DiffSummary } from "../../features/diff-summary"
import { Ollama } from "../../provider/ollama"

export const DiffCommand: CommandModule = {
  command: "diff-summary [ref]",
  describe: "AI-powered git diff summary",
  builder: (yargs) =>
    yargs
      .positional("ref", {
        describe: "Git ref to diff against (default: HEAD)",
        type: "string",
        default: "HEAD",
      })
      .option("staged", {
        describe: "Summarize staged changes only",
        type: "boolean",
        alias: "s",
      })
      .option("model", {
        describe: "Ollama model to use",
        type: "string",
        default: "llama3.2",
      })
      .option("url", {
        describe: "Ollama URL",
        type: "string",
        default: Ollama.DEFAULT_URL,
      }),
  handler: async (opts) => {
    process.stderr.write(EOL + "  📝 Generating diff summary..." + EOL)

    const d = opts.staged ? await DiffSummary.staged() : await DiffSummary.diff(opts.ref as string)

    if (!d.trim()) {
      process.stderr.write("  No changes found." + EOL)
      return
    }

    const summary = await DiffSummary.summarize(d, opts.url as string, opts.model as string)
    process.stdout.write(EOL + summary + EOL)
  },
}
