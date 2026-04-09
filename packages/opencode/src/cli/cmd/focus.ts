import type { CommandModule } from "yargs"
import { EOL } from "os"
import { FocusMode } from "../../features/focus-mode"

export const FocusCommand: CommandModule = {
  command: "focus",
  describe: "Start a Pomodoro focus timer",
  builder: (yargs) =>
    yargs
      .option("duration", {
        describe: "Focus duration in minutes",
        type: "number",
        default: 25,
        alias: "d",
      })
      .option("break", {
        describe: "Break duration in minutes",
        type: "number",
        default: 5,
        alias: "b",
      })
      .option("sessions", {
        describe: "Number of sessions",
        type: "number",
        default: 4,
        alias: "s",
      }),
  handler: async (opts) => {
    process.stderr.write(EOL + "  ⏱️  Starting focus timer..." + EOL)

    const cfg = {
      duration: opts.duration as number,
      breakTime: opts.break as number,
      sessions: opts.sessions as number,
      sound: false,
    }

    const timer = FocusMode.start(
      cfg,
      (t) => {
        if (process.stderr.isTTY) {
          process.stderr.write("\r" + FocusMode.render(t).replace(/\n/g, "  "))
        }
      },
      (t) => {
        const label = t.type === "work" ? "🔥 Focus time over! Take a break." : "☕ Break over! Back to work."
        process.stderr.write(EOL + "  " + label + EOL)
      },
    )

    process.stderr.write(FocusMode.render(timer) + EOL)
    process.stderr.write("  Press Ctrl+C to stop." + EOL)

    await new Promise(() => {})
  },
}
