/** All times in the app are Malaysia time (UTC+8, no daylight saving), shown in 24-hour format. */
export const MALAYSIA_TZ = 'Asia/Kuala_Lumpur'

/** Current Malaysia time as "YYYY-MM-DDTHH:mm" (the format Open-Meteo uses with timezone=Asia/Kuala_Lumpur). */
export function malaysiaNow(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MALAYSIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** "2026-11-12T16:00" → "16:00" */
export function hourLabel(localIso: string): string {
  return localIso.slice(11, 16)
}

/** "2026-11-12T16:00" → "2026-11-12" */
export function dateOf(localIso: string): string {
  return localIso.slice(0, 10)
}

/** Start of the current hour, e.g. "2026-11-12T16:37" → "2026-11-12T16:00". */
export function hourOf(localIso: string): string {
  return `${localIso.slice(0, 13)}:00`
}
