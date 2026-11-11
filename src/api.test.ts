import { describe, expect, it } from 'vitest'
import { openMeteoUrl, parseOpenMeteo, roundCoord } from './api'

describe('roundCoord', () => {
  it('rounds to 0.05° so exact locations never leave the device', () => {
    expect(roundCoord(3.1517)).toBe(3.15)
    expect(roundCoord(101.6942)).toBe(101.7)
    expect(roundCoord(1.4776)).toBe(1.5)
  })
})

describe('openMeteoUrl', () => {
  it('asks for Malaysia time and only rounded coordinates', () => {
    const url = new URL(openMeteoUrl(3.1517, 101.6942))
    expect(url.searchParams.get('latitude')).toBe('3.15')
    expect(url.searchParams.get('longitude')).toBe('101.7')
    expect(url.searchParams.get('timezone')).toBe('Asia/Kuala_Lumpur')
    expect(url.searchParams.get('hourly')).toContain('cape')
  })
})

describe('parseOpenMeteo', () => {
  it('turns column arrays into hours and treats missing values as 0', () => {
    const series = (a: number | null, b: number | null) => [a, b]
    const json = {
      hourly: {
        time: ['2026-11-12T15:00', '2026-11-12T16:00'],
        temperature_2m: series(31.2, 30.1),
        apparent_temperature: series(37.5, 36),
        relative_humidity_2m: series(70, 75),
        precipitation_probability: series(40, null),
        precipitation: series(0, 1.2),
        weather_code: series(2, 95),
        cloud_cover: series(50, 90),
        wind_speed_10m: series(8, 12),
        wind_direction_10m: series(180, 200),
        uv_index: series(6.5, 3),
        cape: series(1800, 2100),
        is_day: series(1, 1),
      },
      current: {
        time: '2026-11-12T15:15',
        temperature_2m: 31,
        apparent_temperature: 37,
        weather_code: 2,
        is_day: 1,
        relative_humidity_2m: 70,
        wind_speed_10m: 8,
      },
    }
    const w = parseOpenMeteo(json, 123)
    expect(w.hours).toHaveLength(2)
    expect(w.hours[1]).toMatchObject({ time: '2026-11-12T16:00', code: 95, rainChance: 0, cape: 2100, isDay: true })
    expect(w.current).toMatchObject({ temp: 31, feelsLike: 37, isDay: true })
    expect(w.fetchedAt).toBe(123)
  })
})
