import type { CommandModule } from "yargs"
import { EOL } from "os"
import { LMStudio } from "../../provider/lmstudio"

export const LMStudioCommand: CommandModule = {
  command: "lmstudio",
  describe: "Check LM Studio status and loaded models",
  builder: (yargs) =>
    yargs
      .option("url", {
        describe: "LM Studio OpenAI-compatible URL",
        type: "string",
        default: LMStudio.DEFAULT_URL,
      })
      .command("status", "Check LM Studio connection status")
      .command("models", "List loaded models"),
  handler: async (opts) => {
    const url = opts.url as string
    const running = await LMStudio.check(url)
    const available = running ? await LMStudio.models(url) : []

    process.stderr.write(EOL)
    process.stderr.write(LMStudio.statusBanner(running, available))
    process.stderr.write(EOL)
  },
}
