import { lazy, Suspense, useEffect, useState } from 'react'
import { hasWebGL2 } from './device'
import { type Lang, loadLang, saveLang, t } from './i18n'

// The map library is ~1 MB, so it loads after the panel: weather text shows first on slow phones.
const MapView = lazy(() => import('./MapView'))

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  const [webgl] = useState(hasWebGL2)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function toggleLang() {
    const next: Lang = lang === 'ms' ? 'en' : 'ms'
    setLang(next)
    saveLang(next)
  }

  return (
    // Layout F: phone = map on top, panel below; desktop (≥768px) = sidebar on the left, map on the right.
    <div className="flex h-full flex-col md:flex-row">
      <div className="relative min-h-0 flex-1 bg-[#9CC3EE] md:order-2">
        {webgl ? (
          <Suspense fallback={null}>
            <MapView label={t('mapLabel', lang)} />
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
        <p className="text-sub">{t('tagline', lang)}</p>
        <p className="rounded-card bg-card p-4">{t('comingSoon', lang)}</p>
      </aside>
    </div>
  )
}
