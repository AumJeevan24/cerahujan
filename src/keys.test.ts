import { describe, expect, it } from 'vitest'
import { combineControls, isSteering, keysToControls } from './keys'

describe('keysToControls', () => {
  it('maps arrows and WASD to turn and climb', () => {
    expect(keysToControls(new Set(['ArrowLeft']))).toEqual({ turn: -1, climb: 0, boost: false })
    expect(keysToControls(new Set(['KeyD', 'KeyW']))).toEqual({ turn: 1, climb: 1, boost: false })
    expect(keysToControls(new Set(['Space']))).toMatchObject({ climb: 1 })
    expect(keysToControls(new Set(['KeyC']))).toMatchObject({ climb: -1 })
    expect(keysToControls(new Set(['ShiftLeft']))).toMatchObject({ boost: true })
  })

  it('cancels opposite keys', () => {
    expect(keysToControls(new Set(['ArrowLeft', 'ArrowRight'])).turn).toBe(0)
  })
})

describe('combineControls', () => {
  it('lets the stronger input win on each axis', () => {
    const keys = { turn: 1, climb: 0, boost: false }
    const stick = { turn: -0.3, climb: 0.6, boost: true }
    expect(combineControls(keys, stick)).toEqual({ turn: 1, climb: 0.6, boost: true })
  })
})

describe('isSteering', () => {
  it('is true only when something is pressed', () => {
    expect(isSteering({ turn: 0, climb: 0, boost: false })).toBe(false)
    expect(isSteering({ turn: 0, climb: 0, boost: true })).toBe(true)
  })
})
