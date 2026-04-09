import { Log } from "../util/log"

export namespace LearningMode {
  const log = Log.create({ service: "learning" })

  let enabled = false

  export function isEnabled() {
    return enabled
  }

  export function enable() {
    enabled = true
    log.info("learning mode enabled")
  }

  export function disable() {
    enabled = false
  }

  export function toggle() {
    enabled = !enabled
    return enabled
  }

  export const INSTRUCTION = `You are in LEARNING MODE. For every action you take, explain:
1. **What** you're about to do (in plain English)
2. **Why** you're doing it (the reasoning)
3. **How** it works (technical details for learning)
4. **Alternatives** you considered but didn't choose

Format explanations in collapsible sections:
<details>
<summary>🎓 Learning: [action name]</summary>

**What**: Brief description
**Why**: Reasoning
**How**: Technical explanation
**Alternatives**: Other approaches

</details>

Then proceed with the actual action. This helps the user learn programming concepts as they work.`

  export function wrap(action: string, what: string, why: string, how: string, alt?: string) {
    const lines = [
      "",
      "  \x1b[93m┌─ 🎓 Learning ─────────────────────────────┐\x1b[0m",
      `  \x1b[93m│\x1b[0m  \x1b[1mAction:\x1b[0m ${action}`.padEnd(46) + "\x1b[93m│\x1b[0m",
      `  \x1b[93m│\x1b[0m  \x1b[1mWhat:\x1b[0m ${what}`.padEnd(46) + "\x1b[93m│\x1b[0m",
      `  \x1b[93m│\x1b[0m  \x1b[1mWhy:\x1b[0m ${why}`.padEnd(46) + "\x1b[93m│\x1b[0m",
      `  \x1b[93m│\x1b[0m  \x1b[1mHow:\x1b[0m ${how}`.padEnd(46) + "\x1b[93m│\x1b[0m",
    ]
    if (alt) {
      lines.push(`  \x1b[93m│\x1b[0m  \x1b[1mAlt:\x1b[0m ${alt}`.padEnd(46) + "\x1b[93m│\x1b[0m")
    }
    lines.push("  \x1b[93m└──────────────────────────────────────────┘\x1b[0m")
    lines.push("")
    return lines.join("\n")
  }

  export function banner() {
    return [
      "",
      "  \x1b[93m🎓 LEARNING MODE ACTIVE\x1b[0m",
      "  \x1b[90mThe AI will explain each step as it works.\x1b[0m",
      "  \x1b[90mUse /learn off to disable.\x1b[0m",
      "",
    ].join("\n")
  }
}
