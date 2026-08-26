import { useSyncExternalStore } from "react"

/**
 * One shared timer per interval. Every subscriber to the same `intervalMs`
 * re-renders on the same beat, so a dashboard of live numbers breathes as one
 * system instead of flickering out of phase. The timer starts with the first
 * subscriber and stops with the last, so an idle page runs no timers.
 */
const tickers = new Map()

function ticker(intervalMs) {
  let t = tickers.get(intervalMs)
  if (t) return t
  t = {
    count: 0,
    listeners: new Set(),
    timer: null,
    subscribe(fn) {
      t.listeners.add(fn)
      if (!t.timer) {
        t.timer = setInterval(() => {
          t.count++
          t.listeners.forEach((listener) => listener())
        }, intervalMs)
      }
      return () => {
        t.listeners.delete(fn)
        if (t.listeners.size === 0 && t.timer) {
          clearInterval(t.timer)
          t.timer = null
        }
      }
    },
    getSnapshot: () => t.count,
  }
  tickers.set(intervalMs, t)
  return t
}

const getServerSnapshot = () => 0

// A null interval subscribes to nothing, so a component that only sometimes
// samples can call the hook unconditionally without starting a timer.
const idle = { subscribe: () => () => {}, getSnapshot: getServerSnapshot }

/**
 * Returns the number of ticks elapsed since the shared `intervalMs` timer
 * started. Tick 0 is the value before the first interval fires, so a sampler
 * keyed on the tick renders deterministically on first paint. Pass `null`
 * to subscribe to no timer and always read 0.
 */
export function useTicker(intervalMs) {
  const t = intervalMs > 0 ? ticker(intervalMs) : idle
  return useSyncExternalStore(t.subscribe, t.getSnapshot, getServerSnapshot)
}
