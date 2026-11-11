import type { Bird } from './flight'

const KEY = 'cerahujan.bird'

/** First flight over Kuala Lumpur: south-west of the city centre, heading towards the towers. */
export const KL_START: Bird = { lng: 101.678, lat: 3.128, alt: 320, heading: 35, bank: 0, speed: 0 }

/** Where Kenyalang was last time (on this device only). */
export function loadBird(): Bird | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const b = JSON.parse(raw) as Partial<Bird>
    if ([b.lng, b.lat, b.alt, b.heading].every((v) => typeof v === 'number' && Number.isFinite(v))) {
      return { lng: b.lng!, lat: b.lat!, alt: b.alt!, heading: b.heading!, bank: 0, speed: 0 }
    }
  } catch {
    // Storage blocked or corrupted: start fresh.
  }
  return null
}

export function saveBird(bird: Bird): void {
  try {
    const { lng, lat, alt, heading } = bird
    localStorage.setItem(KEY, JSON.stringify({ lng, lat, alt, heading }))
  } catch {
    // Not critical.
  }
}
