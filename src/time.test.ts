import { describe, expect, it } from 'vitest'
import { dateOf, hourLabel, hourOf, malaysiaNow } from './time'

describe('malaysiaNow', () => {
  it('converts to Malaysia time (UTC+8), 24-hour', () => {
    expect(malaysiaNow(new Date('2026-11-12T08:05:00Z'))).toBe('2026-11-12T16:05')
  })

  it('rolls over to the next day after 16:00 UTC', () => {
    expect(malaysiaNow(new Date('2026-11-12T16:30:00Z'))).toBe('2026-11-13T00:30')
  })
})

describe('time helpers', () => {
  it('extracts parts of a local time', () => {
    expect(hourLabel('2026-11-12T16:00')).toBe('16:00')
    expect(dateOf('2026-11-12T16:00')).toBe('2026-11-12')
    expect(hourOf('2026-11-12T16:37')).toBe('2026-11-12T16:00')
  })
})
