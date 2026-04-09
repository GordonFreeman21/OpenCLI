import type { CommandModule } from "yargs"
import { EOL } from "os"
import { Ollama } from "../../provider/ollama"

export const OllamaCommand: CommandModule = {
  command: "ollama",
  describe: "Check Ollama status and manage models",
  builder: (yargs) =>
    yargs
      .option("url", {
        describe: "Ollama URL",
        type: "string",
        default: Ollama.DEFAULT_URL,
      })
      .command("status", "Check Ollama connection status")
      .command("models", "List available models")
      .command("pull <model>", "Pull a model", (y) =>
        y.positional("model", { type: "string", demandOption: true }),
      )
      .command("catalog", "Show known model catalog"),
  handler: async (opts) => {
    const url = opts.url as string
    const running = await Ollama.check(url)
    const available = running ? await Ollama.models(url) : []

    process.stderr.write(EOL)
    process.stderr.write(Ollama.statusBanner(running, available))
    process.stderr.write(EOL)
  },
}
