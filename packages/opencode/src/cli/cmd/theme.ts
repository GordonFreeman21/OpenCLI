import type { CommandModule } from "yargs"
import { EOL } from "os"
import { ThemeEngine } from "../../features/themes"

export const ThemeCommand: CommandModule = {
  command: "theme [name]",
  describe: "View or switch terminal themes",
  builder: (yargs) =>
    yargs
      .positional("name", {
        describe: "Theme name to activate",
        type: "string",
      })
      .option("list", {
        describe: "List all available themes",
        type: "boolean",
        alias: "l",
      })
      .option("preview", {
        describe: "Preview a specific theme",
        type: "string",
        alias: "p",
      }),
  handler: async (opts) => {
    if (opts.list || (!opts.name && !opts.preview)) {
      process.stderr.write(ThemeEngine.showcase())
      return
    }

    if (opts.preview) {
      const name = opts.preview as string
      const theme = ThemeEngine.BUILTIN[name]
      if (!theme) {
        process.stderr.write(`Unknown theme: ${name}` + EOL)
        process.stderr.write("Available: " + ThemeEngine.list().map((t) => t.id).join(", ") + EOL)
        process.exit(1)
      }
      process.stderr.write(ThemeEngine.preview(theme))
      return
    }

    if (opts.name) {
      const ok = ThemeEngine.set(opts.name as string)
      if (!ok) {
        process.stderr.write(`Unknown theme: ${opts.name}` + EOL)
        process.stderr.write("Available: " + ThemeEngine.list().map((t) => t.id).join(", ") + EOL)
        process.exit(1)
      }
      process.stderr.write(`✅ Theme set to: ${opts.name}` + EOL)
    }
  },
}
