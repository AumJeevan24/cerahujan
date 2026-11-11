import { describe, expect, it } from 'vitest'
import { isLiteDevice, renderSettings } from './device'

describe('isLiteDevice', () => {
  it('treats 4 GB RAM or less as lite', () => {
    expect(isLiteDevice({ deviceMemory: 4, hardwareConcurrency: 8 })).toBe(true)
    expect(isLiteDevice({ deviceMemory: 2 })).toBe(true)
  })

  it('treats 4 CPU cores or fewer as lite', () => {
    expect(isLiteDevice({ deviceMemory: 8, hardwareConcurrency: 4 })).toBe(true)
  })

  it('treats strong devices as normal', () => {
    expect(isLiteDevice({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe(false)
  })

  it('assumes normal when the browser does not say (e.g. Safari, Firefox)', () => {
    expect(isLiteDevice({})).toBe(false)
  })
})

describe('renderSettings', () => {
  it('caps resolution and flattens terrain on lite devices', () => {
    expect(renderSettings({ deviceMemory: 3, devicePixelRatio: 3 })).toEqual({
      lite: true,
      pixelRatio: 1.25,
      terrainExaggeration: 1.0,
    })
  })

  it('caps resolution at 2x on normal devices', () => {
    expect(renderSettings({ deviceMemory: 8, hardwareConcurrency: 8, devicePixelRatio: 3 })).toEqual({
      lite: false,
      pixelRatio: 2,
      terrainExaggeration: 1.3,
    })
  })

  it('never upscales a 1x screen', () => {
    expect(renderSettings({ devicePixelRatio: 1 }).pixelRatio).toBe(1)
  })
})
