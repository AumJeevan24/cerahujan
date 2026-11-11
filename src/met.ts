import type { Lang } from './i18n'

/** One day of MET Malaysia's official forecast for a place (api.data.gov.my/weather/forecast). */
export interface MetDay {
  locationId: string
  date: string // YYYY-MM-DD, Malaysia time
  morning: string // BM text exactly as MET publishes it
  afternoon: string
  night: string
  summary: string
  summaryWhen: string
  minTemp: number
  maxTemp: number
}

interface MetRow {
  location: { location_id: string; location_name: string }
  date: string
  morning_forecast: string
  afternoon_forecast: string
  night_forecast: string
  summary_forecast: string
  summary_when: string
  min_temp: number
  max_temp: number
}

export function parseMetForecast(rows: MetRow[]): MetDay[] {
  return rows
    .map((r) => ({
      locationId: r.location.location_id,
      date: r.date,
      morning: r.morning_forecast,
      afternoon: r.afternoon_forecast,
      night: r.night_forecast,
      summary: r.summary_forecast,
      summaryWhen: r.summary_when,
      minTemp: r.min_temp,
      maxTemp: r.max_temp,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * MET publishes forecasts in BM only, built from parts: weather ("Hujan", "Ribut petir", "Mendung", "Tiada Hujan"),
 * how widespread ("di beberapa tempat", "di kebanyakan tempat", "menyeluruh") and sometimes where
 * ("di kawasan pantai", "di kawasan pedalaman"). Translating the parts covers combinations MET adds later too.
 */
const WEATHER: [string, string][] = [
  ['tiada hujan', 'No rain'],
  ['ribut petir', 'Thunderstorms'],
  ['hujan', 'Rain'],
  ['mendung', 'Cloudy'],
]
/** [BM, English on its own, English before an area word ("in a few ___ areas")] */
const EXTENT: [string, string, string][] = [
  ['di beberapa tempat', 'in a few places', 'in a few'],
  ['di kebanyakan tempat', 'in most places', 'in most'],
  ['menyeluruh', 'widespread', 'widespread in'],
]
const AREA: [string, string][] = [
  ['di kawasan pantai', 'coastal'],
  ['di kawasan pedalaman', 'inland'],
]

export function translateMet(text: string, lang: Lang): string {
  if (lang === 'ms') return text
  let rest = text.trim().toLowerCase()
  const weather = WEATHER.find(([bm]) => rest.startsWith(bm))
  if (!weather) return text // unknown phrase: show MET's own words rather than guess
  rest = rest.slice(weather[0].length).trim()

  const extent = EXTENT.find(([bm]) => rest.startsWith(bm))
  if (extent) rest = rest.slice(extent[0].length).trim()
  const area = AREA.find(([bm]) => rest.startsWith(bm))
  if (area) rest = rest.slice(area[0].length).trim()
  if (rest) return text // something we don't recognise: show MET's own words

  // "Rain in a few coastal areas", "Thunderstorms widespread in inland areas", "Rain in coastal areas".
  if (area) return `${weather[1]} ${extent ? extent[2] : 'in'} ${area[1]} areas`
  return extent ? `${weather[1]} ${extent[1]}` : weather[1]
}

const WHEN: Record<string, Record<Lang, string>> = {
  pagi: { ms: 'Pagi', en: 'Morning' },
  petang: { ms: 'Petang', en: 'Afternoon' },
  malam: { ms: 'Malam', en: 'Night' },
  'pagi dan petang': { ms: 'Pagi dan petang', en: 'Morning and afternoon' },
  'pagi dan malam': { ms: 'Pagi dan malam', en: 'Morning and night' },
  'petang dan malam': { ms: 'Petang dan malam', en: 'Afternoon and night' },
  'sepanjang hari': { ms: 'Sepanjang hari', en: 'All day' },
}

export function translateWhen(when: string, lang: Lang): string {
  return WHEN[when.trim().toLowerCase()]?.[lang] ?? when
}
