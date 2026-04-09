import { Log } from "../util/log"

export namespace FocusMode {
  const log = Log.create({ service: "focus" })

  export interface Config {
    duration: number // minutes
    breakTime: number // minutes
    sessions: number
    sound: boolean
  }

  export const DEFAULT: Config = {
    duration: 25,
    breakTime: 5,
    sessions: 4,
    sound: false,
  }

  interface Timer {
    remaining: number // seconds
    total: number // seconds
    type: "work" | "break"
    session: number
    running: boolean
    interval?: ReturnType<typeof setInterval>
    onTick?: (t: Timer) => void
    onComplete?: (t: Timer) => void
  }

  let active: Timer | undefined

  export function start(cfg = DEFAULT, onTick?: (t: Timer) => void, onComplete?: (t: Timer) => void): Timer {
    stop()
    const timer: Timer = {
      remaining: cfg.duration * 60,
      total: cfg.duration * 60,
      type: "work",
      session: 1,
      running: true,
      onTick,
      onComplete,
    }

    timer.interval = setInterval(() => {
      if (!timer.running) return
      timer.remaining--
      timer.onTick?.(timer)

      if (timer.remaining <= 0) {
        timer.onComplete?.(timer)
        if (timer.type === "work") {
          timer.type = "break"
          timer.remaining = cfg.breakTime * 60
          timer.total = cfg.breakTime * 60
        } else {
          timer.session++
          if (timer.session > cfg.sessions) {
            stop()
            return
          }
          timer.type = "work"
          timer.remaining = cfg.duration * 60
          timer.total = cfg.duration * 60
        }
      }
    }, 1000)

    active = timer
    return timer
  }

  export function stop() {
    if (active?.interval) clearInterval(active.interval)
    if (active) active.running = false
    active = undefined
  }

  export function pause() {
    if (active) active.running = false
  }

  export function resume() {
    if (active) active.running = true
  }

  export function current() {
    return active
  }

  export function render(timer: Timer) {
    const mins = Math.floor(timer.remaining / 60)
    const secs = timer.remaining % 60
    const pct = (timer.total - timer.remaining) / timer.total
    const width = 30
    const filled = Math.round(pct * width)
    const bar = "█".repeat(filled) + "░".repeat(width - filled)
    const icon = timer.type === "work" ? "🔥" : "☕"
    const color = timer.type === "work" ? "\x1b[91m" : "\x1b[92m"
    const label = timer.type === "work" ? "FOCUS" : "BREAK"

    return [
      "",
      `  ${icon} ${color}${label}\x1b[0m  Session ${timer.session}`,
      `  ${color}${bar}\x1b[0m  ${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
      "",
    ].join("\n")
  }
}
