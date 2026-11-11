import { useCallback, useEffect, useState } from 'react'
import { fetchMetForecast, fetchWeather, type Weather } from './api'
import { type Lang, t } from './i18n'
import type { MetDay } from './met'
import { translateMet } from './met'
import { heatLevel, heatText, restOfToday, stormRisk, stormText, uvLevel, uvText } from './scores'
import { dateOf, hourLabel, hourOf, malaysiaNow } from './time'
import { type Town, typeLabel } from './towns'
import WeatherIcon from './WeatherIcon'
import { wmoIcon, wmoText } from './wmo'

interface State {
  weather?: Weather
  met?: MetDay[] | null // null = MET unavailable
  error?: boolean
}

export default function WeatherPanel({ town, lang }: { town: Town; lang: Lang }) {
  const [state, setState] = useState<State>({})
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({})
    fetchWeather(town.lat, town.lon, ctrl.signal)
      .then((weather) => setState((s) => ({ ...s, weather })))
      .catch(() => {
        if (!ctrl.signal.aborted) setState((s) => ({ ...s, error: true }))
      })
    // MET is a bonus: if it fails, the rest of the panel still works.
    fetchMetForecast(town.id, ctrl.signal)
      .then((met) => setState((s) => ({ ...s, met })))
      .catch(() => {
        if (!ctrl.signal.aborted) setState((s) => ({ ...s, met: null }))
      })
    return () => ctrl.abort()
  }, [town.id, town.lat, town.lon, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  if (state.error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-card bg-card p-4">
        <p>{t('weatherError', lang)}</p>
        <button type="button" onClick={retry} className="h-11 rounded-xl bg-accent px-4 font-semibold text-white">
          {t('tryAgain', lang)}
        </button>
      </div>
    )
  }
  if (!state.weather) {
    return (
      <p aria-live="polite" className="rounded-card bg-card p-4 text-sub">
        <strong className="text-ink">{town.name}</strong> · {t('loadingWeather', lang)}
      </p>
    )
  }

  const { weather } = state
  const now = malaysiaNow()
  const today = restOfToday(weather.hours, now)
  const storm = stormRisk(weather.hours, now)
  const upcoming = weather.hours.filter((h) => h.time >= hourOf(now)).slice(0, 12)
  const c = weather.current
  const metToday = state.met?.find((d) => d.date === dateOf(now))

  return (
    <div className="flex flex-col gap-3">
      {/* Where, and the weather now */}
      <section aria-live="polite" className="flex flex-col gap-2 rounded-card bg-card p-4">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-xl font-bold">{town.name}</h2>
          <span className="text-sm text-sub">
            {town.state} · {typeLabel(town.type, lang)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none font-extrabold tracking-tight tabular-nums">{Math.round(c.temp)}°</span>
          <div className="flex min-w-0 grow flex-col">
            <span className="flex items-center gap-1.5 font-semibold">
              <WeatherIcon icon={wmoIcon(c.code)} isDay={c.isDay} size={22} />
              {wmoText(c.code, lang)}
            </span>
            <span className="text-sub">
              {t('feelsLike', lang)} {Math.round(c.feelsLike)}°
            </span>
          </div>
        </div>
      </section>

      {/* Today at a glance */}
      {today && (
        <div className="grid grid-cols-2 gap-2.5">
          <Card label={t('uv', lang)} note={t('todayMax', lang)}>
            <span className="text-uv">
              {Math.round(today.maxUv)} · {uvText(uvLevel(today.maxUv), lang)}
            </span>
          </Card>
          <Card label={t('heat', lang)} note={`${t('feelsLike', lang).toLowerCase()} ${Math.round(today.maxFeelsLike)}°`}>
            <span className={heatLevel(today.maxFeelsLike) === 'normal' ? 'text-good' : 'text-uv'}>
              {heatText(heatLevel(today.maxFeelsLike), lang)}
            </span>
          </Card>
          <Card label={t('storm', lang)}>
            <span className={storm.firstHour ? 'text-storm' : 'text-good'}>{stormText(storm, now, lang)}</span>
          </Card>
          <Card label={t('rainChance', lang)} note={t('todayMax', lang)}>
            <span className="text-storm tabular-nums">{Math.round(today.maxRainChance)}%</span>
          </Card>
        </div>
      )}

      {/* Next 12 hours */}
      <section className="flex flex-col gap-2 rounded-card bg-card p-4">
        <h3 className="text-sm font-semibold text-sub">{t('next12h', lang)}</h3>
        <ol className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {upcoming.map((h) => (
            <li key={h.time} className="flex min-w-14 flex-col items-center gap-1 px-1 text-sm">
              <span className="text-sub tabular-nums">{hourLabel(h.time)}</span>
              <WeatherIcon icon={wmoIcon(h.code)} isDay={h.isDay} />
              <span className="font-semibold tabular-nums">{Math.round(h.temp)}°</span>
              <span className="text-xs text-storm tabular-nums">{Math.round(h.rainChance)}%</span>
              <span className="sr-only">{wmoText(h.code, lang)}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* MET official forecast */}
      <section className="flex flex-col gap-2 rounded-card bg-card p-4">
        <h3 className="text-sm font-semibold text-sub">{t('metToday', lang)}</h3>
        {state.met === undefined ? (
          <p className="text-sub">…</p>
        ) : metToday ? (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-sub">{t('morning', lang)}</dt>
              <dd>{translateMet(metToday.morning, lang)}</dd>
              <dt className="text-sub">{t('afternoon', lang)}</dt>
              <dd>{translateMet(metToday.afternoon, lang)}</dd>
              <dt className="text-sub">{t('night', lang)}</dt>
              <dd>{translateMet(metToday.night, lang)}</dd>
            </dl>
            <p className="text-sm text-sub tabular-nums">
              {metToday.minTemp}°–{metToday.maxTemp}° · MET Malaysia
            </p>
          </>
        ) : (
          <p className="text-sub">{t('metUnavailable', lang)}</p>
        )}
      </section>

      <p className="text-sm text-sub">
        {t('updated', lang)} {new Date(weather.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Kuala_Lumpur' })}
        {' · '}
        {t('estimateNote', lang)} {t('officialSources', lang)}{' '}
        <a href="https://www.met.gov.my/" target="_blank" rel="noopener" className="font-semibold text-accent underline">
          MET Malaysia
        </a>
      </p>
    </div>
  )
}

function Card({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-card bg-card p-3">
      <span className="text-[13px] text-sub">{label}</span>
      <span className="text-[17px] leading-snug font-bold">{children}</span>
      {note && <span className="text-xs text-sub">{note}</span>}
    </div>
  )
}
