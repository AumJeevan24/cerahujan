import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { hasWebGL2 } from './device'
import type { Bird, Controls } from './flight'
import Hud from './Hud'
import { type Lang, loadLang, saveLang, t } from './i18n'
import { KL_START, loadBird } from './session'
import TouchControls from './TouchControls'
import { nearestPlace, type Town } from './towns'
import TownSearch from './TownSearch'
import WeatherPanel from './WeatherPanel'

// The map + 3D code is large, so it loads after the first screen.
const FlightView = lazy(() => import('./FlightView'))

const isTouch = () => window.matchMedia('(pointer: coarse)').matches
const KEYS_HINT_KEY = 'cerahujan.keysHintSeen'

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  const [webgl] = useState(hasWebGL2)
  const [start, setStart] = useState<Bird | null>(loadBird)
  const [notice, setNotice] = useState<string | null>(null)
  const [place, setPlace] = useState<{ town: Town; km: number } | null>(() => (start ? nearestPlace(start.lng, start.lat) : null))
  const [target, setTarget] = useState<Town | null>(null)
  const [details, setDetails] = useState(false)
  const [touch] = useState(isTouch)
  const [keysHint, setKeysHint] = useState(() => {
    try {
      return !touch && !localStorage.getItem(KEYS_HINT_KEY)
    } catch {
      return !touch
    }
  })
  const touchControls = useRef<Controls>({ turn: 0, climb: 0, boost: false })

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function toggleLang() {
    const next: Lang = lang === 'ms' ? 'en' : 'ms'
    setLang(next)
    saveLang(next)
  }

  function begin(bird: Bird, message: string | null = null) {
    setStart(bird)
    setPlace(nearestPlace(bird.lng, bird.lat))
    setNotice(message)
  }

  function startNearMe() {
    if (!navigator.geolocation) return begin(KL_START, t('locationDenied', lang))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords
        const near = nearestPlace(lng, lat)
        // More than 60 km from any MET place means outside Malaysia.
        if (!near || near.km > 60) return begin(KL_START, t('outsideMalaysia', lang))
        begin({ lng, lat, alt: 450, heading: 0, bank: 0, speed: 0 })
      },
      () => begin(KL_START, t('locationDenied', lang)),
      { timeout: 10_000, maximumAge: 300_000 },
    )
  }

  // Weather follows Kenyalang: switch place when the nearest one changes (distance is rounded to avoid re-renders).
  const onMove = useCallback((bird: Bird) => {
    const near = nearestPlace(bird.lng, bird.lat)
    if (!near) return
    const km = Math.round(near.km)
    setPlace((p) => (p && p.town.id === near.town.id && Math.round(p.km) === km ? p : { town: near.town, km }))
  }, [])
  const onArrive = useCallback(() => setTarget(null), [])
  const onTakeOver = useCallback(() => setTarget(null), [])

  function dismissKeysHint() {
    setKeysHint(false)
    try {
      localStorage.setItem(KEYS_HINT_KEY, '1')
    } catch {
      // Not critical.
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#8EC3EA]">
      {webgl && start && (
        <Suspense fallback={null}>
          <FlightView
            label={t('flightLabel', lang)}
            start={start}
            touch={touchControls}
            target={target ? { lng: target.lon, lat: target.lat } : null}
            onArrive={onArrive}
            onTakeOver={onTakeOver}
            onMove={onMove}
          />
        </Suspense>
      )}

      {!webgl && (
        <p role="alert" className="mx-auto max-w-md p-6 pt-24 text-center font-semibold">
          {t('noWebgl', lang)}
        </p>
      )}

      {/* Top: fly-to search, language, autopilot status and the weather strip */}
      {start && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:max-w-md">
          <div className="pointer-events-auto flex items-start gap-2">
            <div className="min-w-0 grow">
              <TownSearch lang={lang} onSelect={setTarget} hideLabel />
            </div>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t('switchLang', lang)}
              className="h-12 shrink-0 rounded-xl border border-line bg-card px-3 text-sm font-semibold"
            >
              <span className={lang === 'ms' ? 'text-ink' : 'text-sub'}>BM</span>
              <span className="text-sub"> | </span>
              <span className={lang === 'en' ? 'text-ink' : 'text-sub'}>EN</span>
            </button>
          </div>

          {target && (
            <p className="pointer-events-auto self-start rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white shadow">
              {t('flyingTo', lang)} {target.name} · {t('takeOverHint', lang)}
            </p>
          )}
          {notice && (
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="pointer-events-auto self-start rounded-xl bg-card px-3 py-2 text-left text-sm shadow"
            >
              {notice} <span className="font-semibold text-accent">{t('close', lang)}</span>
            </button>
          )}
          {place && <Hud place={place.town} km={place.km} lang={lang} onDetails={() => setDetails(true)} />}
        </div>
      )}

      {start && touch && (
        <div className="pointer-events-none absolute inset-0">
          <TouchControls controls={touchControls} lang={lang} />
        </div>
      )}

      {start && keysHint && (
        <button
          type="button"
          onClick={dismissKeysHint}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-hud px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          {t('keysHint', lang)} · <span className="text-sun">{t('close', lang)}</span>
        </button>
      )}

      {/* Full weather details: side panel on desktop, sheet on phones */}
      {details && place && (
        <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[80%] flex-col gap-3 overflow-y-auto rounded-t-3xl bg-sheet p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[400px] md:rounded-none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('details', lang)}</h2>
            <button type="button" onClick={() => setDetails(false)} className="h-11 rounded-xl bg-card px-4 font-semibold">
              {t('close', lang)}
            </button>
          </div>
          <WeatherPanel town={place.town} lang={lang} />
        </aside>
      )}

      {/* First visit: choose where to start */}
      {!start && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-hud p-6">
          <div className="flex w-full max-w-sm flex-col gap-4 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">Cerahujan</h1>
            <p className="text-lg">{t('startTitle', lang)}</p>
            <button type="button" onClick={startNearMe} className="h-12 rounded-xl bg-sun font-bold text-ink">
              {t('startNearMe', lang)}
            </button>
            <button type="button" onClick={() => begin(KL_START)} className="h-12 rounded-xl bg-white/15 font-bold">
              {t('startKl', lang)}
            </button>
            <p className="text-sm text-white/75">{t('locationNote', lang)}</p>
            <button type="button" onClick={toggleLang} className="h-11 self-start rounded-xl bg-white/10 px-3 text-sm font-semibold">
              {lang === 'ms' ? 'English' : 'Bahasa Malaysia'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
