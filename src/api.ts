import { type MetDay, parseMetForecast } from './met'
import type { Hour } from './scores'

/**
 * All data fetching lives here so sources can be swapped later (e.g. for cached Cloudflare
 * Functions). For now the browser calls the free, key-less APIs directly.
 */

/** Locations sent to any API are rounded to 0.05° (~5 km), never the exact position. */
export function roundCoord(value: number): number {
  return Math.round(value * 20) / 20
}

export interface Weather {
  hours: Hour[]
  current: { time: string; temp: number; feelsLike: number; code: number; isDay: boolean; humidity: number; wind: number }
  fetchedAt: number // ms since epoch
}

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'
const HOURLY = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'uv_index',
  'cape',
  'is_day',
] as const
const CURRENT = ['temperature_2m', 'apparent_temperature', 'weather_code', 'is_day', 'relative_humidity_2m', 'wind_speed_10m'] as const

export function openMeteoUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(roundCoord(lat)),
    longitude: String(roundCoord(lon)),
    hourly: HOURLY.join(','),
    current: CURRENT.join(','),
    timezone: 'Asia/Kuala_Lumpur',
    forecast_days: '3',
  })
  return `${OPEN_METEO}?${params}`
}

type Series = Record<(typeof HOURLY)[number], (number | null)[]> & { time: string[] }
interface OpenMeteoResponse {
  hourly: Series
  current: Record<(typeof CURRENT)[number], number> & { time: string }
}

const num = (v: number | null | undefined) => (typeof v === 'number' ? v : 0)

export function parseOpenMeteo(json: OpenMeteoResponse, fetchedAt: number): Weather {
  const h = json.hourly
  const hours: Hour[] = h.time.map((time, i) => ({
    time,
    temp: num(h.temperature_2m[i]),
    feelsLike: num(h.apparent_temperature[i]),
    humidity: num(h.relative_humidity_2m[i]),
    rainChance: num(h.precipitation_probability[i]),
    rain: num(h.precipitation[i]),
    code: num(h.weather_code[i]),
    cloud: num(h.cloud_cover[i]),
    wind: num(h.wind_speed_10m[i]),
    windDir: num(h.wind_direction_10m[i]),
    uv: num(h.uv_index[i]),
    cape: num(h.cape[i]),
    isDay: num(h.is_day[i]) === 1,
  }))
  const c = json.current
  return {
    hours,
    current: {
      time: c.time,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      code: c.weather_code,
      isDay: c.is_day === 1,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
    },
    fetchedAt,
  }
}

/** Small in-memory cache so flying back and forth between towns doesn't refetch within 10 minutes. */
const CACHE_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; value: unknown }>()

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`)
  const value = (await res.json()) as T
  cache.set(url, { at: Date.now(), value })
  return value
}

export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<Weather> {
  const url = openMeteoUrl(lat, lon)
  const json = await getJson<OpenMeteoResponse>(url, signal)
  return parseOpenMeteo(json, cache.get(url)?.at ?? Date.now())
}

/** MET Malaysia's official 7-day forecast for one of its forecast places (towns, districts…). */
export async function fetchMetForecast(locationId: string, signal?: AbortSignal): Promise<MetDay[]> {
  const url = `https://api.data.gov.my/weather/forecast/?contains=${encodeURIComponent(locationId)}@location__location_id`
  return parseMetForecast(await getJson(url, signal))
}
