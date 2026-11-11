/**
 * Kenyalang's flight: pure maths, no map or rendering, so it can be unit-tested.
 * Positions are longitude/latitude, heights in metres above sea level, heading in degrees
 * (0 = north, 90 = east), speed in metres per second.
 */

export interface Bird {
  lng: number
  lat: number
  alt: number // metres above sea level
  heading: number // degrees, 0 = north, clockwise
  bank: number // degrees, positive = banking right
  speed: number // m/s, for display and camera
}

/** What the player (or the autopilot) is asking for this frame. */
export interface Controls {
  turn: number // -1 (left) … 1 (right)
  climb: number // -1 (dive) … 1 (climb)
  boost: boolean
  /** Autopilot only: multiply speed so long trips stay short. */
  speedFactor?: number
}

export const NO_INPUT: Controls = { turn: 0, climb: 0, boost: false }

/** Never lower than this above the ground. */
export const MIN_ABOVE_GROUND = 40
export const MAX_ALTITUDE = 4500
/** Where Kenyalang can fly: the haze region around Malaysia. */
export const REGION = { west: 94, east: 120, south: -6, north: 8 }

const METRES_PER_DEGREE = 111_320
const MAX_TURN_RATE = 55 // degrees per second at full stick
const MAX_BANK = 35 // degrees
const BOOST = 2.5

/** Faster when higher: rooftop flying is slow and detailed, soaring high covers ground quickly. */
export function cruiseSpeed(aboveGround: number): number {
  return Math.min(900, Math.max(30, 30 + aboveGround * 0.25))
}

/** Climb or dive rate at full stick, also scaled with height. */
function climbRate(aboveGround: number): number {
  return Math.min(400, 8 + aboveGround * 0.6)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const normaliseHeading = (h: number) => ((h % 360) + 360) % 360

/** Signed smallest difference from heading a to heading b, in −180…180. */
export function headingDiff(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180
}

/** Move a point a distance (metres) along a heading. Flat-earth approximation, fine for one frame. */
export function moveAlong(lng: number, lat: number, heading: number, metres: number): [number, number] {
  const rad = (heading * Math.PI) / 180
  const dLat = (metres * Math.cos(rad)) / METRES_PER_DEGREE
  const dLng = (metres * Math.sin(rad)) / (METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180))
  return [lng + dLng, lat + dLat]
}

/** Great-circle distance in metres. */
export function distance(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const r = Math.PI / 180
  const h =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h))
}

/** Initial compass bearing from point 1 to point 2, degrees. */
export function bearing(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const r = Math.PI / 180
  const y = Math.sin((lng2 - lng1) * r) * Math.cos(lat2 * r)
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lng2 - lng1) * r)
  return normaliseHeading((Math.atan2(y, x) * 180) / Math.PI)
}

/**
 * Advance the bird by dt seconds. `ground` is the terrain height (metres) under the bird.
 * With no input Kenyalang glides on: same heading, same height.
 */
export function step(bird: Bird, input: Controls, dt: number, ground: number): Bird {
  const aboveGround = Math.max(0, bird.alt - ground)
  const speed = cruiseSpeed(aboveGround) * (input.boost ? BOOST : 1) * (input.speedFactor ?? 1)

  const heading = normaliseHeading(bird.heading + clamp(input.turn, -1, 1) * MAX_TURN_RATE * dt)
  // Ease the bank angle towards the turn, so turns look smooth.
  const targetBank = clamp(input.turn, -1, 1) * MAX_BANK
  const bank = bird.bank + (targetBank - bird.bank) * Math.min(1, dt * 4)

  const [lng, lat] = moveAlong(bird.lng, bird.lat, heading, speed * dt)
  const alt = clamp(
    bird.alt + clamp(input.climb, -1, 1) * climbRate(aboveGround) * dt,
    ground + MIN_ABOVE_GROUND,
    MAX_ALTITUDE,
  )

  return {
    lng: clamp(lng, REGION.west, REGION.east),
    lat: clamp(lat, REGION.south, REGION.north),
    alt,
    heading,
    bank,
    speed,
  }
}

/** How high (above ground) the autopilot cruises for a given distance still to go. */
export function autopilotHeight(remaining: number): number {
  return clamp(remaining * 0.04, 150, 2500)
}

/** Roughly how many seconds of "distance left" the autopilot covers at full speed (trips shrink exponentially). */
const TRIP_SECONDS = 6

export interface Autopilot {
  controls: Controls
  arrived: boolean
}

/**
 * Steers towards a target: turns to face it, climbs high for long trips and swoops down on
 * arrival, and speeds up so any trip takes well under half a minute.
 */
export function autopilot(bird: Bird, targetLng: number, targetLat: number, ground: number): Autopilot {
  const remaining = distance(bird.lng, bird.lat, targetLng, targetLat)
  const aboveGround = bird.alt - ground
  const arrived = remaining < Math.max(250, aboveGround * 0.8) && aboveGround < 400
  const turn = clamp(headingDiff(bird.heading, bearing(bird.lng, bird.lat, targetLng, targetLat)) / 25, -1, 1)
  const targetHeight = autopilotHeight(remaining)
  const climb = clamp((targetHeight - aboveGround) / Math.max(50, aboveGround * 0.5), -1, 1)
  // Go fast only once high up (so the ground doesn't blur past), and slow down as the target gets close.
  const highEnough = clamp(aboveGround / targetHeight, 0, 1) ** 2
  const speedFactor = 1 + (remaining / (TRIP_SECONDS * cruiseSpeed(Math.max(aboveGround, 0)))) * highEnough
  return { controls: { turn, climb, boost: false, speedFactor }, arrived }
}
