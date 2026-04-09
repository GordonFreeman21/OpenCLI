import { Log } from "../util/log"
import z from "zod"

export namespace Autopilot {
  const log = Log.create({ service: "autopilot" })

  let enabled = false

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

  export function isEnabled() {
    return enabled
  }

  export function enable() {
    enabled = true
    log.info("autopilot enabled — all permissions auto-granted")
  }

  export function disable() {
    enabled = false
    log.info("autopilot disabled")
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
    if (!enabled) return []

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
