import type { MultiPolygon } from 'geojson'
import { describe, expect, it } from 'vitest'
import { outsideRegion } from './mapStyle'
import outline from './region.json'

const square = (x: number, y: number) => [
  [x, y],
  [x + 1, y],
  [x + 1, y + 1],
  [x, y + 1],
  [x, y],
]

describe('outsideRegion', () => {
  it('cuts one hole per landmass out of a large rectangle', () => {
    const mp: MultiPolygon = { type: 'MultiPolygon', coordinates: [[square(100, 3)], [square(110, 2)]] }
    const mask = outsideRegion(mp)
    const [outer, ...holes] = mask.geometry.coordinates
    expect(holes).toEqual([square(100, 3), square(110, 2)])
    const xs = outer!.map((p) => p[0]!)
    const ys = outer!.map((p) => p[1]!)
    // Covers far more than the pannable area (lon 85–130, lat −15–22).
    expect(Math.min(...xs)).toBeLessThan(85)
    expect(Math.max(...xs)).toBeGreaterThan(130)
    expect(Math.min(...ys)).toBeLessThan(-15)
    expect(Math.max(...ys)).toBeGreaterThan(22)
  })

  it('accepts a single Polygon', () => {
    const mask = outsideRegion({ type: 'Polygon', coordinates: [square(100, 3)] })
    expect(mask.geometry.coordinates).toHaveLength(2)
  })

  it('works with the real outline (Malaysia, Singapore, Brunei and Indonesia merged)', () => {
    const mask = outsideRegion(outline as MultiPolygon)
    expect(mask.geometry.coordinates.length).toBeGreaterThanOrEqual(2)
  })
})
