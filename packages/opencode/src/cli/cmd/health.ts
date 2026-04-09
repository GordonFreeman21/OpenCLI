import type { CommandModule } from "yargs"
import { EOL } from "os"
import { HealthCheck } from "../../features/health-check"

export const HealthCommand: CommandModule = {
  command: "health",
  describe: "Run a project health check",
  builder: (yargs) =>
    yargs.option("dir", {
      describe: "Project directory",
      type: "string",
      default: process.cwd(),
      alias: "d",
    }),
  handler: async (opts) => {
    process.stderr.write(EOL + "  🏥 Running health check..." + EOL)
    const result = await HealthCheck.run(opts.dir as string)
    process.stderr.write(HealthCheck.format(result))
  },
}
