import path from "path"
import { Global } from "../../global"
import { Filesystem } from "../../util/filesystem"
import { Log } from "../../util/log"
import z from "zod"

export namespace ThemeEngine {
  const log = Log.create({ service: "themes" })

  export const Theme = z.object({
    name: z.string(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      success: z.string(),
      warning: z.string(),
      error: z.string(),
      info: z.string(),
      dim: z.string(),
      bg: z.string(),
      fg: z.string(),
    }),
  })
  export type Theme = z.infer<typeof Theme>

  export const BUILTIN: Record<string, Theme> = {
    default: {
      name: "Default",
      colors: {
        primary: "\x1b[96m",
        secondary: "\x1b[95m",
        accent: "\x1b[93m",
        success: "\x1b[92m",
        warning: "\x1b[93m",
        error: "\x1b[91m",
        info: "\x1b[94m",
        dim: "\x1b[90m",
        bg: "\x1b[40m",
        fg: "\x1b[37m",
      },
    },
    dracula: {
      name: "Dracula",
      colors: {
        primary: "\x1b[38;2;189;147;249m",
        secondary: "\x1b[38;2;255;121;198m",
        accent: "\x1b[38;2;241;250;140m",
        success: "\x1b[38;2;80;250;123m",
        warning: "\x1b[38;2;255;184;108m",
        error: "\x1b[38;2;255;85;85m",
        info: "\x1b[38;2;139;233;253m",
        dim: "\x1b[38;2;98;114;164m",
        bg: "\x1b[48;2;40;42;54m",
        fg: "\x1b[38;2;248;248;242m",
      },
    },
    monokai: {
      name: "Monokai",
      colors: {
        primary: "\x1b[38;2;102;217;239m",
        secondary: "\x1b[38;2;249;38;114m",
        accent: "\x1b[38;2;230;219;116m",
        success: "\x1b[38;2;166;226;46m",
        warning: "\x1b[38;2;253;151;31m",
        error: "\x1b[38;2;249;38;114m",
        info: "\x1b[38;2;102;217;239m",
        dim: "\x1b[38;2;117;113;94m",
        bg: "\x1b[48;2;39;40;34m",
        fg: "\x1b[38;2;248;248;242m",
      },
    },
    nord: {
      name: "Nord",
      colors: {
        primary: "\x1b[38;2;136;192;208m",
        secondary: "\x1b[38;2;180;142;173m",
        accent: "\x1b[38;2;235;203;139m",
        success: "\x1b[38;2;163;190;140m",
        warning: "\x1b[38;2;235;203;139m",
        error: "\x1b[38;2;191;97;106m",
        info: "\x1b[38;2;129;161;193m",
        dim: "\x1b[38;2;76;86;106m",
        bg: "\x1b[48;2;46;52;64m",
        fg: "\x1b[38;2;236;239;244m",
      },
    },
    solarized: {
      name: "Solarized",
      colors: {
        primary: "\x1b[38;2;38;139;210m",
        secondary: "\x1b[38;2;211;54;130m",
        accent: "\x1b[38;2;181;137;0m",
        success: "\x1b[38;2;133;153;0m",
        warning: "\x1b[38;2;203;75;22m",
        error: "\x1b[38;2;220;50;47m",
        info: "\x1b[38;2;42;161;152m",
        dim: "\x1b[38;2;88;110;117m",
        bg: "\x1b[48;2;0;43;54m",
        fg: "\x1b[38;2;131;148;150m",
      },
    },
    gruvbox: {
      name: "Gruvbox",
      colors: {
        primary: "\x1b[38;2;131;165;152m",
        secondary: "\x1b[38;2;211;134;155m",
        accent: "\x1b[38;2;250;189;47m",
        success: "\x1b[38;2;184;187;38m",
        warning: "\x1b[38;2;254;128;25m",
        error: "\x1b[38;2;251;73;52m",
        info: "\x1b[38;2;131;165;152m",
        dim: "\x1b[38;2;146;131;116m",
        bg: "\x1b[48;2;40;40;40m",
        fg: "\x1b[38;2;235;219;178m",
      },
    },
    catppuccin: {
      name: "Catppuccin",
      colors: {
        primary: "\x1b[38;2;137;180;250m",
        secondary: "\x1b[38;2;245;194;231m",
        accent: "\x1b[38;2;249;226;175m",
        success: "\x1b[38;2;166;227;161m",
        warning: "\x1b[38;2;250;179;135m",
        error: "\x1b[38;2;243;139;168m",
        info: "\x1b[38;2;148;226;213m",
        dim: "\x1b[38;2;108;112;134m",
        bg: "\x1b[48;2;30;30;46m",
        fg: "\x1b[38;2;205;214;244m",
      },
    },
    ocean: {
      name: "Ocean",
      colors: {
        primary: "\x1b[38;2;0;191;255m",
        secondary: "\x1b[38;2;127;255;212m",
        accent: "\x1b[38;2;255;215;0m",
        success: "\x1b[38;2;0;255;127m",
        warning: "\x1b[38;2;255;165;0m",
        error: "\x1b[38;2;255;69;0m",
        info: "\x1b[38;2;100;149;237m",
        dim: "\x1b[38;2;70;130;180m",
        bg: "\x1b[48;2;15;25;50m",
        fg: "\x1b[38;2;200;220;255m",
      },
    },
  }

  let current: Theme = BUILTIN.default

  export function get() {
    return current
  }

  export function set(name: string) {
    const theme = BUILTIN[name]
    if (!theme) return false
    current = theme
    return true
  }

  export function list() {
    return Object.entries(BUILTIN).map(([id, t]) => ({ id, name: t.name }))
  }

  export function preview(theme: Theme) {
    const c = theme.colors
    const reset = "\x1b[0m"
    return [
      "",
      `  \x1b[1m🎨 ${theme.name}\x1b[0m`,
      `  ${c.primary}primary${reset} ${c.secondary}secondary${reset} ${c.accent}accent${reset}`,
      `  ${c.success}success${reset} ${c.warning}warning${reset} ${c.error}error${reset} ${c.info}info${reset}`,
      `  ${c.dim}dim text${reset} ${c.fg}foreground${reset}`,
      "",
    ].join("\n")
  }

  export function showcase() {
    const lines = ["", "  \x1b[1m🎨 Available Themes\x1b[0m", ""]
    for (const [id, theme] of Object.entries(BUILTIN)) {
      lines.push(preview(theme))
    }
    return lines.join("\n")
  }
}
