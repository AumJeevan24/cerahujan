import type { Lang } from './i18n'
import { dateOf, hourLabel, hourOf } from './time'
import { isThunderstormCode } from './wmo'

/** One hour of forecast, in Malaysia time. */
export interface Hour {
  time: string // "YYYY-MM-DDTHH:00"
  temp: number // °C
  feelsLike: number // °C (apparent temperature)
  humidity: number // %
  rainChance: number // %
  rain: number // mm
  code: number // WMO weather code
  cloud: number // %
  wind: number // km/h
  windDir: number // degrees
  uv: number
  cape: number // J/kg, energy available for thunderstorms
  isDay: boolean
}

// ---------- Heat ----------

export type HeatLevel = 'normal' | 'hot' | 'veryHot' | 'extreme'

/**
 * From today's highest "feels like" temperature. Our own labels, deliberately not MET's
 * official alert words (Waspada / Amaran / Bahaya).
 */
export function heatLevel(maxFeelsLike: number): HeatLevel {
  if (maxFeelsLike >= 54) return 'extreme'
  if (maxFeelsLike >= 41) return 'veryHot'
  if (maxFeelsLike >= 32) return 'hot'
  return 'normal'
}

const HEAT_TEXT: Record<HeatLevel, Record<Lang, string>> = {
  normal: { ms: 'Biasa', en: 'Normal' },
  hot: { ms: 'Panas, minum air', en: 'Hot, drink water' },
  veryHot: { ms: 'Sangat panas', en: 'Very hot' },
  extreme: { ms: 'Panas melampau', en: 'Extreme heat' },
}

export function heatText(level: HeatLevel, lang: Lang): string {
  return HEAT_TEXT[level][lang]
}

// ---------- UV ----------

export type UvLevel = 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme'

export function uvLevel(uv: number): UvLevel {
  const u = Math.round(uv)
  if (u >= 11) return 'extreme'
  if (u >= 8) return 'veryHigh'
  if (u >= 6) return 'high'
  if (u >= 3) return 'moderate'
  return 'low'
}

const UV_TEXT: Record<UvLevel, Record<Lang, string>> = {
  low: { ms: 'Rendah', en: 'Low' },
  moderate: { ms: 'Sederhana', en: 'Moderate' },
  high: { ms: 'Tinggi', en: 'High' },
  veryHigh: { ms: 'Sangat tinggi', en: 'Very high' },
  extreme: { ms: 'Ekstrem', en: 'Extreme' },
}

export function uvText(level: UvLevel, lang: Lang): string {
  return UV_TEXT[level][lang]
}

// ---------- Storm risk ----------

/** A thunderstorm is likely in an hour with a thunderstorm code, or with lots of storm energy and a good chance of rain. */
export function isStormHour(h: Hour): boolean {
  return isThunderstormCode(h.code) || (h.cape > 1500 && h.rainChance >= 50)
}

export interface StormRisk {
  /** First likely hour in the next 24 hours ("YYYY-MM-DDTHH:00"), or null. */
  firstHour: string | null
  /** How many of the next 24 hours look stormy. */
  hours: number
}

export function stormRisk(hours: readonly Hour[], now: string): StormRisk {
  const from = hourOf(now)
  const next24 = hours.filter((h) => h.time >= from).slice(0, 24)
  const stormy = next24.filter(isStormHour)
  return { firstHour: stormy[0]?.time ?? null, hours: stormy.length }
}

export function stormText(risk: StormRisk, now: string, lang: Lang): string {
  if (!risk.firstHour) {
    return lang === 'ms' ? 'Tiada ribut petir dijangka dalam 24 jam' : 'No thunderstorms expected in the next 24 hours'
  }
  const time = hourLabel(risk.firstHour)
  const tomorrow = dateOf(risk.firstHour) !== dateOf(now)
  if (risk.firstHour === hourOf(now)) return lang === 'ms' ? 'Ribut petir mungkin sekarang' : 'Thunderstorm likely now'
  if (lang === 'ms') return `Ribut petir mungkin sekitar ${time}${tomorrow ? ' esok' : ''}`
  return `Thunderstorm likely around ${time}${tomorrow ? ' tomorrow' : ''}`
}

// ---------- Today's summary ----------

export interface DaySummary {
  maxTemp: number
  minTemp: number
  maxFeelsLike: number
  maxUv: number
  maxRainChance: number
}

/** Highs and lows for the rest of today (Malaysia time) from the hourly forecast. */
export function restOfToday(hours: readonly Hour[], now: string): DaySummary | null {
  const today = hours.filter((h) => dateOf(h.time) === dateOf(now) && h.time >= hourOf(now))
  if (!today.length) return null
  const max = (f: (h: Hour) => number) => Math.max(...today.map(f))
  return {
    maxTemp: max((h) => h.temp),
    minTemp: Math.min(...today.map((h) => h.temp)),
    maxFeelsLike: max((h) => h.feelsLike),
    maxUv: max((h) => h.uv),
    maxRainChance: max((h) => h.rainChance),
  }
}
