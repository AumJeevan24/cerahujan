import { describe, expect, it } from 'vitest'
import {
  autopilot,
  autopilotHeight,
  type Bird,
  bearing,
  cruiseSpeed,
  distance,
  headingDiff,
  MIN_ABOVE_GROUND,
  moveAlong,
  NO_INPUT,
  REGION,
  step,
} from './flight'

const kl: Bird = { lng: 101.6942, lat: 3.1517, alt: 300, heading: 0, bank: 0, speed: 0 }

describe('geometry helpers', () => {
  it('measures distances and bearings', () => {
    // KL to Kuching is roughly 1,000 km, heading east-south-east.
    const d = distance(101.6942, 3.1517, 110.3442, 1.5536)
    expect(d / 1000).toBeGreaterThan(950)
    expect(d / 1000).toBeLessThan(1000)
    expect(bearing(101.6942, 3.1517, 110.3442, 1.5536)).toBeGreaterThan(95)
    expect(bearing(101.6942, 3.1517, 110.3442, 1.5536)).toBeLessThan(105)
  })

  it('moves north and east by the right amount', () => {
    const [, lat] = moveAlong(101, 3, 0, 1113.2)
    expect(lat).toBeCloseTo(3.01, 4)
    const [lng] = moveAlong(101, 0, 90, 1113.2)
    expect(lng).toBeCloseTo(101.01, 4)
  })

  it('gives the shortest way round between headings', () => {
    expect(headingDiff(350, 10)).toBe(20)
    expect(headingDiff(10, 350)).toBe(-20)
    expect(headingDiff(0, 180)).toBe(-180)
  })
})

describe('step', () => {
  it('glides on with no input: same heading and height, moving forward', () => {
    const next = step(kl, NO_INPUT, 1, 50)
    expect(next.heading).toBe(0)
    expect(next.alt).toBe(300)
    expect(next.lat).toBeGreaterThan(kl.lat)
    expect(next.speed).toBe(cruiseSpeed(250))
  })

  it('flies faster when higher, and faster again with boost', () => {
    expect(cruiseSpeed(2000)).toBeGreaterThan(cruiseSpeed(100))
    expect(step(kl, { ...NO_INPUT, boost: true }, 1, 50).speed).toBeCloseTo(cruiseSpeed(250) * 2.5)
  })

  it('turns and banks into the turn', () => {
    const next = step(kl, { turn: 1, climb: 0, boost: false }, 0.5, 50)
    expect(next.heading).toBeCloseTo(27.5)
    expect(next.bank).toBeGreaterThan(0)
  })

  it('never goes below the minimum height above the ground', () => {
    const low = { ...kl, alt: 100 }
    const next = step(low, { turn: 0, climb: -1, boost: false }, 5, 80)
    expect(next.alt).toBe(80 + MIN_ABOVE_GROUND)
  })

  it('stays inside the flying region', () => {
    const edge = { ...kl, lng: REGION.east - 0.0001, heading: 90 }
    expect(step(edge, NO_INPUT, 10, 0).lng).toBe(REGION.east)
  })
})

describe('autopilot', () => {
  it('cruises high for long trips and low near the end', () => {
    expect(autopilotHeight(1_000_000)).toBe(2500)
    expect(autopilotHeight(1000)).toBe(150)
  })

  it('turns towards the target and climbs for a long trip', () => {
    const a = autopilot(kl, 110.3442, 1.5536, 50)
    expect(a.arrived).toBe(false)
    expect(a.controls.turn).toBe(1) // target is to the east, bird faces north
    expect(a.controls.climb).toBeGreaterThan(0)
    expect(a.controls.speedFactor).toBeGreaterThan(1)
  })

  it('reaches any town in Malaysia in well under a minute', () => {
    let bird: Bird = { ...kl }
    let seconds = 0
    for (; seconds < 120; seconds += 0.1) {
      const a = autopilot(bird, 110.3442, 1.5536, 0)
      if (a.arrived) break
      bird = step(bird, a.controls, 0.1, 0)
    }
    expect(seconds).toBeLessThan(60)
    expect(distance(bird.lng, bird.lat, 110.3442, 1.5536)).toBeLessThan(1000)
  })

  it('reports arrival when close and low', () => {
    const near = { ...kl, alt: 200 }
    expect(autopilot(near, kl.lng + 0.001, kl.lat, 50).arrived).toBe(true)
  })
})
