import { describe, expect, it } from 'vitest'
import { type Hour, heatLevel, isStormHour, restOfToday, stormRisk, stormText, uvLevel } from './scores'

const hour = (time: string, over: Partial<Hour> = {}): Hour => ({
  time,
  temp: 30,
  feelsLike: 34,
  humidity: 70,
  rainChance: 10,
  rain: 0,
  code: 2,
  cloud: 40,
  wind: 8,
  windDir: 180,
  uv: 5,
  cape: 200,
  isDay: true,
  ...over,
})

describe('heatLevel', () => {
  it('uses the agreed thresholds', () => {
    expect(heatLevel(31.9)).toBe('normal')
    expect(heatLevel(32)).toBe('hot')
    expect(heatLevel(40.9)).toBe('hot')
    expect(heatLevel(41)).toBe('veryHot')
    expect(heatLevel(53.9)).toBe('veryHot')
    expect(heatLevel(54)).toBe('extreme')
  })
})

describe('uvLevel', () => {
  it('follows the WHO UV index bands, rounding first', () => {
    expect(uvLevel(2.4)).toBe('low')
    expect(uvLevel(2.5)).toBe('moderate')
    expect(uvLevel(5)).toBe('moderate')
    expect(uvLevel(6)).toBe('high')
    expect(uvLevel(7.4)).toBe('high')
    expect(uvLevel(8)).toBe('veryHigh')
    expect(uvLevel(10.4)).toBe('veryHigh')
    expect(uvLevel(11)).toBe('extreme')
  })
})

describe('isStormHour', () => {
  it('counts thunderstorm weather codes', () => {
    expect(isStormHour(hour('2026-11-12T16:00', { code: 95 }))).toBe(true)
    expect(isStormHour(hour('2026-11-12T16:00', { code: 99 }))).toBe(true)
  })

  it('counts high storm energy with a good chance of rain', () => {
    expect(isStormHour(hour('2026-11-12T16:00', { cape: 2000, rainChance: 50 }))).toBe(true)
    expect(isStormHour(hour('2026-11-12T16:00', { cape: 2000, rainChance: 49 }))).toBe(false)
    expect(isStormHour(hour('2026-11-12T16:00', { cape: 1500, rainChance: 90 }))).toBe(false)
  })
})

describe('stormRisk and stormText', () => {
  const day = Array.from({ length: 48 }, (_, i) => {
    const d = i < 24 ? '12' : '13'
    const t = `2026-11-${d}T${String(i % 24).padStart(2, '0')}:00`
    return hour(t)
  })

  it('finds the first stormy hour from now, ignoring earlier hours', () => {
    const hours = day.map((h) => (h.time === '2026-11-12T09:00' || h.time === '2026-11-12T16:00' ? { ...h, code: 95 } : h))
    const risk = stormRisk(hours, '2026-11-12T10:20')
    expect(risk).toEqual({ firstHour: '2026-11-12T16:00', hours: 1 })
    expect(stormText(risk, '2026-11-12T10:20', 'en')).toBe('Thunderstorm likely around 16:00')
    expect(stormText(risk, '2026-11-12T10:20', 'ms')).toBe('Ribut petir mungkin sekitar 16:00')
  })

  it('says "tomorrow" when the storm is after midnight', () => {
    const hours = day.map((h) => (h.time === '2026-11-13T03:00' ? { ...h, code: 96 } : h))
    const risk = stormRisk(hours, '2026-11-12T20:00')
    expect(stormText(risk, '2026-11-12T20:00', 'en')).toBe('Thunderstorm likely around 03:00 tomorrow')
    expect(stormText(risk, '2026-11-12T20:00', 'ms')).toBe('Ribut petir mungkin sekitar 03:00 esok')
  })

  it('only looks 24 hours ahead', () => {
    const hours = day.map((h) => (h.time === '2026-11-13T12:00' ? { ...h, code: 95 } : h))
    expect(stormRisk(hours, '2026-11-12T10:00').firstHour).toBeNull()
  })

  it('says "now" for the current hour', () => {
    const hours = day.map((h) => (h.time === '2026-11-12T10:00' ? { ...h, code: 95 } : h))
    expect(stormText(stormRisk(hours, '2026-11-12T10:45'), '2026-11-12T10:45', 'en')).toBe('Thunderstorm likely now')
  })

  it('reassures when nothing is expected', () => {
    expect(stormText(stormRisk(day, '2026-11-12T10:00'), '2026-11-12T10:00', 'en')).toBe(
      'No thunderstorms expected in the next 24 hours',
    )
  })
})

describe('restOfToday', () => {
  it('summarises only the remaining hours of today', () => {
    const hours = [
      hour('2026-11-12T09:00', { temp: 40, uv: 11 }),
      hour('2026-11-12T13:00', { temp: 33, feelsLike: 41, uv: 9, rainChance: 60 }),
      hour('2026-11-12T22:00', { temp: 26 }),
      hour('2026-11-13T13:00', { temp: 35 }),
    ]
    expect(restOfToday(hours, '2026-11-12T12:30')).toEqual({
      maxTemp: 33,
      minTemp: 26,
      maxFeelsLike: 41,
      maxUv: 9,
      maxRainChance: 60,
    })
  })

  it('returns null when today has no hours left', () => {
    expect(restOfToday([hour('2026-11-12T09:00')], '2026-11-12T23:30')).toBeNull()
  })
})
