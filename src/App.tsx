import { useEffect, useState } from 'react'
import { type Lang, loadLang, saveLang, t } from './i18n'

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function toggleLang() {
    const next: Lang = lang === 'ms' ? 'en' : 'ms'
    setLang(next)
    saveLang(next)
  }

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-4 px-4 py-10">
      <div className="flex items-center gap-3">
        <h1 className="grow text-3xl font-extrabold tracking-tight">Cerahujan</h1>
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
      <p className="text-lg text-sub">{t('tagline', lang)}</p>
      <p className="rounded-card bg-card p-4">{t('comingSoon', lang)}</p>
    </main>
  )
}
