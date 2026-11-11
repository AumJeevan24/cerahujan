import { useEffect, useState } from 'react'
import { fetchWeather, type Weather } from './api'
import { type Lang, t } from './i18n'
import { heatLevel, heatText, restOfToday, stormRisk, stormText, uvLevel, uvText } from './scores'
import { hourOf, malaysiaNow } from './time'
import type { Town } from './towns'
import WeatherIcon from './WeatherIcon'
import { wmoIcon, wmoText } from './wmo'

/**
 * The see-through strip over the flight view: where Kenyalang is and what the weather means there,
 * in a few words. Tap "Details" for the full forecast.
 */
/** Within this distance Kenyalang is "over" a place; further away (e.g. out at sea) he is "near" it. */
const OVER_KM = 15

export default function Hud({ place, km, lang, onDetails }: { place: Town; km: number; lang: Lang; onDetails: () => void }) {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchWeather(place.lat, place.lon, ctrl.signal)
      .then(setWeather)
      .catch(() => {
        if (!ctrl.signal.aborted) setWeather(null)
      })
    return () => ctrl.abort()
  }, [place.lat, place.lon])

  const now = malaysiaNow()
  const today = weather ? restOfToday(weather.hours, now) : null
  const storm = weather ? stormRisk(weather.hours, now) : null
  const next3 = weather?.hours.filter((h) => h.time >= hourOf(now)).slice(0, 3) ?? []
  const rainSoon = next3.length ? Math.max(...next3.map((h) => h.rainChance)) : null

  return (
    <section
      aria-live="polite"
      aria-label={t('hudLabel', lang)}
      className="pointer-events-auto flex max-w-md flex-col gap-1.5 rounded-2xl bg-hud px-3 py-2.5 text-white shadow-lg backdrop-blur-sm sm:gap-2 sm:p-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 grow flex-col">
          <span className="truncate text-xs font-semibold tracking-wide text-white/70 uppercase">
            {km <= OVER_KM ? t('over', lang) : `${t('near', lang)} · ${Math.round(km)} km`} · {place.state}
          </span>
          <span className="truncate text-lg leading-tight font-bold">{place.name}</span>
        </div>
        {weather && (
          <div className="flex items-center gap-1.5">
            <WeatherIcon icon={wmoIcon(weather.current.code)} isDay={weather.current.isDay} size={24} />
            <span className="text-2xl font-extrabold tabular-nums sm:text-3xl">{Math.round(weather.current.temp)}°</span>
          </div>
        )}
        <button
          type="button"
          onClick={onDetails}
          aria-label={t('details', lang)}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 text-lg font-bold hover:bg-white/25"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {weather ? (
        <ul className="flex flex-wrap gap-1 text-xs sm:gap-1.5 sm:text-[13px]">
          <Chip>
            {wmoText(weather.current.code, lang)} · {t('feelsLike', lang).toLowerCase()} {Math.round(weather.current.feelsLike)}°
          </Chip>
          {rainSoon !== null && (
            <Chip tone={rainSoon >= 60 ? 'warn' : undefined}>
              {t('rainNext3h', lang)} {Math.round(rainSoon)}%
            </Chip>
          )}
          {storm && <Chip tone={storm.firstHour ? 'warn' : undefined}>{stormText(storm, now, lang)}</Chip>}
          {today && (
            <Chip tone={uvLevel(today.maxUv) === 'low' || uvLevel(today.maxUv) === 'moderate' ? undefined : 'warn'}>
              UV {Math.round(today.maxUv)} · {uvText(uvLevel(today.maxUv), lang)}
            </Chip>
          )}
          {today && heatLevel(today.maxFeelsLike) !== 'normal' && (
            <Chip tone="warn">{heatText(heatLevel(today.maxFeelsLike), lang)}</Chip>
          )}
        </ul>
      ) : (
        <p className="text-sm text-white/80">{t('loadingWeather', lang)}</p>
      )}
    </section>
  )
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: 'warn' }) {
  return (
    <li className={`rounded-full px-2 py-0.5 font-semibold sm:px-2.5 sm:py-1 ${tone === 'warn' ? 'bg-sun text-ink' : 'bg-white/15 text-white'}`}>
      {children}
    </li>
  )
}
