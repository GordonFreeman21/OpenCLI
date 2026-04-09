import path from "path"
import { Global } from "../global"
import { Log } from "../util/log"

export namespace SessionExport {
  const log = Log.create({ service: "session-export" })

  export interface Message {
    role: "user" | "assistant" | "system"
    content: string
    timestamp?: number
  }

  export function toMarkdown(messages: Message[], title?: string) {
    const lines: string[] = []
    const date = new Date().toISOString().split("T")[0]

    lines.push(`# ${title ?? "opencli Session"}`)
    lines.push(`> Exported on ${date}`)
    lines.push("")
    lines.push("---")
    lines.push("")

    for (const msg of messages) {
      const icon = msg.role === "user" ? "👤 **You**" : msg.role === "assistant" ? "🤖 **opencli**" : "⚙️ **System**"
      if (msg.timestamp) {
        const time = new Date(msg.timestamp).toLocaleTimeString()
        lines.push(`### ${icon} \`${time}\``)
      } else {
        lines.push(`### ${icon}`)
      }
      lines.push("")
      lines.push(msg.content)
      lines.push("")
      lines.push("---")
      lines.push("")
    }

    return lines.join("\n")
  }

  export function toJSON(messages: Message[], title?: string) {
    return JSON.stringify(
      {
        title: title ?? "opencli Session",
        exported: new Date().toISOString(),
        messages,
      },
      null,
      2,
    )
  }

  export function toHTML(messages: Message[], title?: string) {
    const t = title ?? "opencli Session"
    const lines: string[] = [
      "<!DOCTYPE html>",
      '<html lang="en">',
      "<head>",
      `  <title>${t}</title>`,
      '  <meta charset="utf-8">',
      "  <style>",
      "    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee; }",
      "    .msg { margin: 16px 0; padding: 16px; border-radius: 8px; }",
      "    .user { background: #16213e; border-left: 3px solid #0f3460; }",
      "    .assistant { background: #1a1a2e; border-left: 3px solid #e94560; }",
      "    .role { font-weight: bold; margin-bottom: 8px; }",
      "    pre { background: #0d0d1a; padding: 12px; border-radius: 4px; overflow-x: auto; }",
      "    code { font-family: 'Fira Code', monospace; }",
      "  </style>",
      "</head>",
      "<body>",
      `  <h1>${t}</h1>`,
    ]

    for (const msg of messages) {
      const cls = msg.role === "user" ? "user" : "assistant"
      const label = msg.role === "user" ? "👤 You" : "🤖 opencli"
      const content = msg.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
      lines.push(`  <div class="msg ${cls}">`)
      lines.push(`    <div class="role">${label}</div>`)
      lines.push(`    <div>${content}</div>`)
      lines.push("  </div>")
    }

    lines.push("</body>", "</html>")
    return lines.join("\n")
  }
}
