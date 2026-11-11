import { describe, expect, it } from 'vitest'
import { chaseCamera, drawnWingspan, followDistance } from './chase'
import { bearing, type Bird, distance } from './flight'

const bird: Bird = { lng: 101.69, lat: 3.15, alt: 140, heading: 90, bank: 20, speed: 60 }

describe('chaseCamera', () => {
  it('sits behind the bird (opposite its heading), facing the same way', () => {
    const cam = chaseCamera(bird, 60, 60)
    expect(cam.bearing).toBe(90)
    // Bird flies east, so the camera is west of it.
    expect(cam.lng).toBeLessThan(bird.lng)
    expect(bearing(cam.lng, cam.lat, bird.lng, bird.lat)).toBeCloseTo(90, 0)
    expect(distance(cam.lng, cam.lat, bird.lng, bird.lat)).toBeCloseTo(followDistance(80), -1)
  })

  it('is above the bird and looks slightly downwards', () => {
    const cam = chaseCamera(bird, 60, 60)
    expect(cam.alt).toBeGreaterThan(bird.alt)
    expect(cam.pitch).toBeGreaterThan(70)
    expect(cam.pitch).toBeLessThan(85)
  })

  it('never goes into a hill behind the bird', () => {
    const cam = chaseCamera(bird, 60, 500)
    expect(cam.alt).toBeGreaterThanOrEqual(520)
  })

  it('leans into turns a little', () => {
    expect(chaseCamera(bird, 60, 60).roll).toBeCloseTo(7)
  })

  it('pulls back when high up, and Kenyalang is drawn bigger to match', () => {
    expect(followDistance(2000)).toBeGreaterThan(followDistance(100))
    expect(drawnWingspan(2000)).toBeGreaterThan(drawnWingspan(100))
  })
})
