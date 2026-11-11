import { createExpression, type Feature } from '@maplibre/maplibre-gl-style-spec'
import type { MultiPolygon } from 'geojson'
import { describe, expect, it } from 'vitest'
import { BUILDING_COLOUR, outsideRegion } from './mapStyle'
import outline from './region.json'

/** Runs the building colour rule with MapLibre's own expression engine, returning a hex colour. */
function buildingColour(properties: Record<string, unknown>, id?: number): string {
  const parsed = createExpression(BUILDING_COLOUR, 'fill-extrusion-color')
  if (parsed.result !== 'success') throw new Error(JSON.stringify(parsed.value))
  const feature = { type: 1, properties, id } as unknown as Feature
  return String(parsed.value.evaluate({ zoom: 15 }, feature))
}

/** True when blue outweighs red, e.g. glass rather than warm plaster. */
const blueish = (hex: string) => parseInt(hex.slice(5, 7), 16) > parseInt(hex.slice(1, 3), 16)

describe('BUILDING_COLOUR', () => {
  it('gives towers glass (blue-grey) and houses plaster (warm)', () => {
    expect(blueish(buildingColour({ render_height: 150 }, 7))).toBe(true)
    expect(blueish(buildingColour({ render_height: 6 }, 7))).toBe(false)
  })

  it('varies the shade between neighbouring buildings', () => {
    const shades = new Set([1, 2, 3, 4].map((id) => buildingColour({ render_height: 6 }, id)))
    expect(shades.size).toBeGreaterThan(1)
  })

  it('copes with buildings that have no height or id', () => {
    expect(() => buildingColour({})).not.toThrow()
  })
})

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
