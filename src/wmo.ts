import type { Lang } from './i18n'

/** Simple icon names for the weather symbols the UI draws. */
export type WeatherIcon = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'showers' | 'storm'

interface WmoInfo {
  ms: string
  en: string
  icon: WeatherIcon
}

/** WMO weather codes as used by Open-Meteo (https://open-meteo.com/en/docs), in BM and EN. */
const WMO: Record<number, WmoInfo> = {
  0: { ms: 'Cerah', en: 'Clear', icon: 'clear' },
  1: { ms: 'Kebanyakannya cerah', en: 'Mostly clear', icon: 'partly' },
  2: { ms: 'Cerah berawan', en: 'Partly cloudy', icon: 'partly' },
  3: { ms: 'Mendung', en: 'Overcast', icon: 'cloudy' },
  45: { ms: 'Berkabus', en: 'Fog', icon: 'fog' },
  48: { ms: 'Kabus beku', en: 'Freezing fog', icon: 'fog' },
  51: { ms: 'Gerimis ringan', en: 'Light drizzle', icon: 'drizzle' },
  53: { ms: 'Gerimis', en: 'Drizzle', icon: 'drizzle' },
  55: { ms: 'Gerimis lebat', en: 'Heavy drizzle', icon: 'drizzle' },
  56: { ms: 'Gerimis beku', en: 'Freezing drizzle', icon: 'drizzle' },
  57: { ms: 'Gerimis beku lebat', en: 'Heavy freezing drizzle', icon: 'drizzle' },
  61: { ms: 'Hujan renyai', en: 'Light rain', icon: 'rain' },
  63: { ms: 'Hujan', en: 'Rain', icon: 'rain' },
  65: { ms: 'Hujan lebat', en: 'Heavy rain', icon: 'rain' },
  66: { ms: 'Hujan beku', en: 'Freezing rain', icon: 'rain' },
  67: { ms: 'Hujan beku lebat', en: 'Heavy freezing rain', icon: 'rain' },
  71: { ms: 'Salji ringan', en: 'Light snow', icon: 'cloudy' },
  73: { ms: 'Salji', en: 'Snow', icon: 'cloudy' },
  75: { ms: 'Salji lebat', en: 'Heavy snow', icon: 'cloudy' },
  77: { ms: 'Butiran salji', en: 'Snow grains', icon: 'cloudy' },
  80: { ms: 'Hujan sekejap-sekejap', en: 'Light showers', icon: 'showers' },
  81: { ms: 'Hujan lebat sekejap-sekejap', en: 'Showers', icon: 'showers' },
  82: { ms: 'Hujan sangat lebat', en: 'Violent showers', icon: 'showers' },
  85: { ms: 'Salji sekejap-sekejap', en: 'Snow showers', icon: 'cloudy' },
  86: { ms: 'Salji lebat sekejap-sekejap', en: 'Heavy snow showers', icon: 'cloudy' },
  95: { ms: 'Ribut petir', en: 'Thunderstorm', icon: 'storm' },
  96: { ms: 'Ribut petir dengan hujan batu', en: 'Thunderstorm with hail', icon: 'storm' },
  99: { ms: 'Ribut petir dengan hujan batu lebat', en: 'Thunderstorm with heavy hail', icon: 'storm' },
}

export function wmoText(code: number, lang: Lang): string {
  return WMO[code]?.[lang] ?? (lang === 'ms' ? 'Tidak diketahui' : 'Unknown')
}

export function wmoIcon(code: number): WeatherIcon {
  return WMO[code]?.icon ?? 'cloudy'
}

export function isThunderstormCode(code: number): boolean {
  return code >= 95 && code <= 99
}
