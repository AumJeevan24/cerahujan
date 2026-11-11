import type { Controls } from './flight'

/** Keys we use, by KeyboardEvent.code (layout-independent). */
const LEFT = ['ArrowLeft', 'KeyA']
const RIGHT = ['ArrowRight', 'KeyD']
const UP = ['ArrowUp', 'KeyW', 'Space']
const DOWN = ['ArrowDown', 'KeyS', 'KeyC']
const BOOST = ['ShiftLeft', 'ShiftRight']
export const FLIGHT_KEYS = new Set([...LEFT, ...RIGHT, ...UP, ...DOWN, ...BOOST])

/** Turn the set of held keys into flight controls. */
export function keysToControls(held: ReadonlySet<string>): Controls {
  const any = (codes: string[]) => codes.some((c) => held.has(c))
  return {
    turn: (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0),
    climb: (any(UP) ? 1 : 0) - (any(DOWN) ? 1 : 0),
    boost: any(BOOST),
  }
}

/** Combine keyboard and touch input: whichever is pushed further wins on each axis. */
export function combineControls(a: Controls, b: Controls): Controls {
  const pick = (x: number, y: number) => (Math.abs(x) >= Math.abs(y) ? x : y)
  return { turn: pick(a.turn, b.turn), climb: pick(a.climb, b.climb), boost: a.boost || b.boost }
}

export function isSteering(c: Controls): boolean {
  return c.turn !== 0 || c.climb !== 0 || c.boost
}
