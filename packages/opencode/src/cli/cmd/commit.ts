import type { CommandModule } from "yargs"
import { EOL } from "os"
import { SmartCommit } from "../../features/smart-commit"
import { Ollama } from "../../provider/ollama"

export const CommitCommand: CommandModule = {
  command: "commit",
  describe: "Generate an AI-powered commit message from staged changes",
  builder: (yargs) =>
    yargs
      .option("model", {
        describe: "Ollama model to use",
        type: "string",
        default: "llama3.2",
      })
      .option("url", {
        describe: "Ollama URL",
        type: "string",
        default: Ollama.DEFAULT_URL,
      })
      .option("apply", {
        describe: "Apply the generated commit message directly",
        type: "boolean",
        alias: "a",
        default: false,
      }),
  handler: async (opts) => {
    const d = await SmartCommit.diff()
    if (!d.trim()) {
      process.stderr.write("No staged changes found. Use 'git add' first." + EOL)
      process.exit(1)
    }

    process.stderr.write("🤖 Generating commit message..." + EOL)
    const msg = await SmartCommit.generate(d, opts.url as string, opts.model as string)

    if (!msg) {
      process.stderr.write("Failed to generate commit message. Is Ollama running?" + EOL)
      process.exit(1)
    }

    process.stdout.write(msg + EOL)

    if (opts.apply) {
      const { Process } = await import("../../util/process")
      await Process.run(["git", "commit", "-m", msg])
      process.stderr.write("✅ Committed!" + EOL)
    }
  },
}
