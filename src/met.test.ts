import { describe, expect, it } from 'vitest'
import { parseMetForecast, translateMet, translateWhen } from './met'

describe('translateMet', () => {
  it('keeps MET’s own BM text in BM', () => {
    expect(translateMet('Ribut petir di kebanyakan tempat', 'ms')).toBe('Ribut petir di kebanyakan tempat')
  })

  it('translates every phrase MET currently uses', () => {
    const cases: [string, string][] = [
      ['Hujan', 'Rain'],
      ['Hujan di beberapa tempat', 'Rain in a few places'],
      ['Hujan di beberapa tempat di kawasan pantai', 'Rain in a few coastal areas'],
      ['Hujan di beberapa tempat di kawasan pedalaman', 'Rain in a few inland areas'],
      ['Hujan di kebanyakan tempat', 'Rain in most places'],
      ['Hujan menyeluruh', 'Rain widespread'],
      ['Mendung', 'Cloudy'],
      ['Ribut petir', 'Thunderstorms'],
      ['Ribut petir di beberapa tempat', 'Thunderstorms in a few places'],
      ['Ribut petir di beberapa tempat di kawasan pantai', 'Thunderstorms in a few coastal areas'],
      ['Ribut petir di beberapa tempat di kawasan pedalaman', 'Thunderstorms in a few inland areas'],
      ['Ribut petir di kebanyakan tempat', 'Thunderstorms in most places'],
      ['Ribut petir di kebanyakan tempat di kawasan pedalaman', 'Thunderstorms in most inland areas'],
      ['Ribut petir menyeluruh', 'Thunderstorms widespread'],
      ['Tiada Hujan', 'No rain'],
    ]
    for (const [bm, en] of cases) expect(translateMet(bm, 'en'), bm).toBe(en)
  })

  it('handles combinations MET might add later', () => {
    expect(translateMet('Ribut petir menyeluruh di kawasan pantai', 'en')).toBe('Thunderstorms widespread in coastal areas')
    expect(translateMet('Hujan di kawasan pedalaman', 'en')).toBe('Rain in inland areas')
  })

  it('shows MET’s own words for anything it doesn’t recognise', () => {
    expect(translateMet('Jerebu tebal', 'en')).toBe('Jerebu tebal')
    expect(translateMet('Hujan lebat berterusan', 'en')).toBe('Hujan lebat berterusan')
  })
})

describe('translateWhen', () => {
  it('translates MET’s time-of-day words', () => {
    expect(translateWhen('Petang dan Malam', 'en')).toBe('Afternoon and night')
    expect(translateWhen('Sepanjang Hari', 'en')).toBe('All day')
    expect(translateWhen('Pagi', 'ms')).toBe('Pagi')
  })
})

describe('parseMetForecast', () => {
  it('turns MET rows into days in date order', () => {
    const row = (date: string) => ({
      location: { location_id: 'Tn079', location_name: 'Kuala Lumpur' },
      date,
      morning_forecast: 'Tiada Hujan',
      afternoon_forecast: 'Ribut petir di beberapa tempat',
      night_forecast: 'Hujan di beberapa tempat',
      summary_forecast: 'Ribut petir di beberapa tempat',
      summary_when: 'Petang',
      min_temp: 24,
      max_temp: 33,
    })
    const days = parseMetForecast([row('2026-11-13'), row('2026-11-12')])
    expect(days.map((d) => d.date)).toEqual(['2026-11-12', '2026-11-13'])
    expect(days[0]).toMatchObject({ locationId: 'Tn079', afternoon: 'Ribut petir di beberapa tempat', maxTemp: 33 })
  })
})
