import { Log } from "../util/log"
import z from "zod"

export namespace Autopilot {
  const log = Log.create({ service: "autopilot" })

  export const Mode = z.enum(["ask", "autopilot"])
  export type Mode = z.infer<typeof Mode>

  let current: Mode = "ask"

  const stats = {
    granted: 0,
    permissions: new Map<string, number>(),
  }

  export const Schema = z.object({
    enabled: z.boolean().default(false),
    confirm: z.boolean().default(true),
    scope: z
      .enum(["all", "read-write", "read-only"])
      .default("all")
      .describe("Permission scope: all grants everything, read-write skips shell, read-only is safe mode"),
    maxSteps: z.number().int().positive().default(100).describe("Maximum autonomous steps before pausing"),
    summary: z.boolean().default(true).describe("Show summary of all changes when done"),
  })
  export type Schema = z.infer<typeof Schema>

  export function get() {
    return current
  }

  export function isEnabled() {
    return current === "autopilot"
  }

  export function isAsk() {
    return current === "ask"
  }

  export function set(mode: Mode) {
    current = mode
    log.info("mode changed", { mode })
  }

  export function enable() {
    set("autopilot")
  }

  export function disable() {
    set("ask")
  }

  export function track(permission: string, patterns: string[]) {
    stats.granted++
    stats.permissions.set(permission, (stats.permissions.get(permission) || 0) + 1)
    log.info("autopilot-granted", { permission, patterns, total: stats.granted })
  }

  export function granted() {
    return stats.granted
  }

  export function breakdown() {
    return Object.fromEntries(stats.permissions)
  }

  type Rule = { permission: string; pattern: string; action: "allow" | "deny" | "ask" }

  export function rules(): Rule[] {
    if (!isEnabled()) return []

    return [
      { permission: "read", pattern: "*", action: "allow" as const },
      { permission: "edit", pattern: "*", action: "allow" as const },
      { permission: "glob", pattern: "*", action: "allow" as const },
      { permission: "grep", pattern: "*", action: "allow" as const },
      { permission: "list", pattern: "*", action: "allow" as const },
      { permission: "bash", pattern: "*", action: "allow" as const },
      { permission: "task", pattern: "*", action: "allow" as const },
      { permission: "external_directory", pattern: "*", action: "allow" as const },
      { permission: "todowrite", pattern: "*", action: "allow" as const },
      { permission: "question", pattern: "*", action: "allow" as const },
      { permission: "webfetch", pattern: "*", action: "allow" as const },
      { permission: "websearch", pattern: "*", action: "allow" as const },
      { permission: "codesearch", pattern: "*", action: "allow" as const },
      { permission: "lsp", pattern: "*", action: "allow" as const },
      { permission: "skill", pattern: "*", action: "allow" as const },
    ]
  }

  export function banner() {
    const lines = [
      "",
      "\x1b[93m┌──────────────────────────────────────────┐\x1b[0m",
      "\x1b[93m│\x1b[0m  \x1b[1m🤖 AUTOPILOT MODE ACTIVE\x1b[0m                 \x1b[93m│\x1b[0m",
      "\x1b[93m│\x1b[0m                                          \x1b[93m│\x1b[0m",
      "\x1b[93m│\x1b[0m  All permissions auto-granted.            \x1b[93m│\x1b[0m",
      "\x1b[93m│\x1b[0m  AI will work autonomously until done.    \x1b[93m│\x1b[0m",
      "\x1b[93m│\x1b[0m  Press Ctrl+C to interrupt at any time.   \x1b[93m│\x1b[0m",
      "\x1b[93m└──────────────────────────────────────────┘\x1b[0m",
      "",
    ]
    return lines.join("\n")
  }

  export function reminder(input: { agent: string; plan: string; exists: boolean }) {
    if (isAsk()) {
      return `<system-reminder>
Execution mode is ask.
Ask the user for clarification when requirements are genuinely ambiguous.
When a tool requires approval, pause and wait for the user instead of assuming consent.
</system-reminder>`
    }

    const plan =
      input.agent === "plan"
        ? [
            `Use the session plan at ${input.plan} as your working document.`,
            input.exists
              ? "Read it first, refine it as needed, and keep execution aligned with it."
              : "Create it before major implementation work so the task has a concrete plan.",
          ].join("\n")
        : [
            `For any non-trivial task, use the session plan at ${input.plan}.`,
            input.exists
              ? "Read it before major work and update it if the scope changes."
              : "Create it before major edits so implementation follows a concrete plan.",
          ].join("\n")

    return `<system-reminder>
Execution mode is autopilot.
Work autonomously until the task is complete.
Do not use the question tool for routine clarification. Make reasonable assumptions and continue.
${plan}
Deploy specialized agents with the task tool when parallel research or focused execution will help.
Do not stop to ask for confirmation between planning and implementation unless you are truly blocked by missing external information.
</system-reminder>`
  }

  export interface Summary {
    filesRead: number
    filesWritten: number
    commands: number
    steps: number
    elapsed: number
  }

  export function formatSummary(s: Summary) {
    const mins = Math.floor(s.elapsed / 60000)
    const secs = Math.floor((s.elapsed % 60000) / 1000)
    const lines = [
      "",
      "\x1b[92m┌──────────────────────────────────────────┐\x1b[0m",
      "\x1b[92m│\x1b[0m  \x1b[1m✅ AUTOPILOT COMPLETE\x1b[0m                    \x1b[92m│\x1b[0m",
      "\x1b[92m│\x1b[0m                                          \x1b[92m│\x1b[0m",
      `\x1b[92m│\x1b[0m  Files read:    ${String(s.filesRead).padEnd(25)}\x1b[92m│\x1b[0m`,
      `\x1b[92m│\x1b[0m  Files written: ${String(s.filesWritten).padEnd(25)}\x1b[92m│\x1b[0m`,
      `\x1b[92m│\x1b[0m  Commands run:  ${String(s.commands).padEnd(25)}\x1b[92m│\x1b[0m`,
      `\x1b[92m│\x1b[0m  Total steps:   ${String(s.steps).padEnd(25)}\x1b[92m│\x1b[0m`,
      `\x1b[92m│\x1b[0m  Time elapsed:  ${(mins + "m " + secs + "s").padEnd(25)}\x1b[92m│\x1b[0m`,
      "\x1b[92m└──────────────────────────────────────────┘\x1b[0m",
      "",
    ]
    return lines.join("\n")
  }
}
