export type Lang = 'ms' | 'en'

const STORAGE_KEY = 'cerahujan.lang'

/** BM if the browser's first language starts with "ms", otherwise English. */
export function detectLang(languages: readonly string[]): Lang {
  const first = languages[0]?.toLowerCase() ?? ''
  return first.startsWith('ms') ? 'ms' : 'en'
}

/** A saved choice wins over the browser setting. */
export function initialLang(saved: string | null, languages: readonly string[]): Lang {
  if (saved === 'ms' || saved === 'en') return saved
  return detectLang(languages)
}

export function loadLang(): Lang {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage can be blocked (private mode); fall back to the browser language.
  }
  return initialLang(saved, navigator.languages ?? [navigator.language])
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Not critical: the choice just won't be remembered.
  }
}

const strings = {
  tagline: {
    ms: 'Cuaca, panas, ribut dan jerebu untuk Malaysia.',
    en: 'Weather, heat, storms and haze for Malaysia.',
  },
  comingSoon: {
    ms: 'Peta 3D akan datang tidak lama lagi.',
    en: 'The 3D map is coming soon.',
  },
  switchLang: {
    ms: 'Tukar ke Bahasa Inggeris',
    en: 'Switch to Bahasa Malaysia',
  },
} as const satisfies Record<string, Record<Lang, string>>

export type StringKey = keyof typeof strings

export function t(key: StringKey, lang: Lang): string {
  return strings[key][lang]
}
