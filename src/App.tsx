import type { Map as MapLibreMap } from 'maplibre-gl'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { cameraFor, loadTownId, saveTownId } from './camera'
import { hasWebGL2 } from './device'
import { type Lang, loadLang, saveLang, t } from './i18n'
import { findTown, type Town, typeLabel } from './towns'
import TownSearch from './TownSearch'

// The map library is ~1 MB, so it loads after the panel: weather text shows first on slow phones.
const MapView = lazy(() => import('./MapView'))

function flyTo(map: MapLibreMap, town: Town) {
  const target = cameraFor(town)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    map.jumpTo(target)
  } else {
    map.flyTo({ ...target, curve: 1.6, speed: 1.1 })
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  const [webgl] = useState(hasWebGL2)
  const [town, setTown] = useState<Town | undefined>(() => {
    const id = loadTownId()
    return id ? findTown(id) : undefined
  })
  const mapRef = useRef<MapLibreMap | null>(null)
  const townRef = useRef(town)
  townRef.current = town

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function toggleLang() {
    const next: Lang = lang === 'ms' ? 'en' : 'ms'
    setLang(next)
    saveLang(next)
  }

  function selectTown(next: Town) {
    setTown(next)
    saveTownId(next.id)
    if (mapRef.current) flyTo(mapRef.current, next)
  }

  const onMapReady = useCallback((map: MapLibreMap) => {
    mapRef.current = map
    // A remembered town: show the whole country briefly, then fly there. Otherwise tilt the country view into 3D.
    if (townRef.current) flyTo(map, townRef.current)
    else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.jumpTo({ pitch: 30 })
    else map.easeTo({ pitch: 30, duration: 1500 })
  }, [])

  return (
    // Layout F: phone = map on top, panel below; desktop (≥768px) = sidebar on the left, map on the right.
    <div className="flex h-full flex-col md:flex-row">
      <div className="relative min-h-0 flex-1 bg-[#9CC3EE] md:order-2">
        {webgl ? (
          <Suspense fallback={null}>
            <MapView label={t('mapLabel', lang)} onReady={onMapReady} />
          </Suspense>
        ) : (
          <p role="alert" className="mx-auto max-w-md p-6 pt-16 text-center font-semibold">
            {t('noWebgl', lang)}
          </p>
        )}
      </div>

      <aside className="relative z-10 -mt-6 flex max-h-[45%] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-sheet px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgb(18_35_61/0.15)] md:order-1 md:mt-0 md:max-h-none md:w-[380px] md:shrink-0 md:rounded-none md:px-5 md:pt-5 md:shadow-none">
        <div aria-hidden="true" className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-line md:hidden" />
        <div className="flex items-center gap-3">
          <h1 className="grow text-2xl font-extrabold tracking-tight">Cerahujan</h1>
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('switchLang', lang)}
            className="h-11 rounded-xl border border-line bg-card px-4 text-sm font-semibold"
          >
            <span className={lang === 'ms' ? 'text-ink' : 'text-sub'}>BM</span>
            <span className="text-sub"> | </span>
            <span className={lang === 'en' ? 'text-ink' : 'text-sub'}>EN</span>
          </button>
        </div>

        <TownSearch lang={lang} onSelect={selectTown} />

        <section aria-live="polite" className="flex flex-col gap-1 rounded-card bg-card p-4">
          {town ? (
            <>
              <span className="text-xs font-semibold tracking-wide text-sub uppercase">{typeLabel(town.type, lang)}</span>
              <h2 className="text-xl font-bold">{town.name}</h2>
              <p className="text-sub">{town.state}</p>
            </>
          ) : (
            <p className="text-sub">{t('pickTownHint', lang)}</p>
          )}
        </section>

        <p className="text-sm text-sub">{t('comingSoon', lang)}</p>
      </aside>
    </div>
  )
}
