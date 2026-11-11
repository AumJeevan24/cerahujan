import { describe, expect, it } from 'vitest'
import { cameraFor } from './camera'
import type { Town } from './towns'

const town = (type: Town['type']): Town => ({ id: 'x', name: 'X', type, state: 'Perak', lat: 4.6, lon: 101.08 })

describe('cameraFor', () => {
  it('centres on the place (MapLibre wants lon, lat)', () => {
    expect(cameraFor(town('Tn')).center).toEqual([101.08, 4.6])
  })

  it('zooms close for towns and wider for districts and divisions', () => {
    expect(cameraFor(town('Tn')).zoom).toBeGreaterThanOrEqual(14)
    expect(cameraFor(town('Ds')).zoom).toBeLessThan(cameraFor(town('Tn')).zoom)
    expect(cameraFor(town('Dv')).zoom).toBeLessThan(cameraFor(town('Ds')).zoom)
  })

  it('keeps a tilted 3D view', () => {
    expect(cameraFor(town('Rc')).pitch).toBe(60)
  })
})
