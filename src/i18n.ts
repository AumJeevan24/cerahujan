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
  hudLabel: {
    ms: 'Cuaca di bawah Kenyalang',
    en: 'Weather below Kenyalang',
  },
  over: {
    ms: 'Di atas',
    en: 'Over',
  },
  near: {
    ms: 'Dekat',
    en: 'Near',
  },
  rainNext3h: {
    ms: 'Hujan 3 jam',
    en: 'Rain next 3h',
  },
  details: {
    ms: 'Butiran cuaca',
    en: 'Weather details',
  },
  close: {
    ms: 'Tutup',
    en: 'Close',
  },
  flightLabel: {
    ms: 'Paparan penerbangan Kenyalang. Guna kekunci anak panah atau WASD untuk terbang.',
    en: "Kenyalang's flight view. Use the arrow keys or WASD to fly.",
  },
  joystickLabel: {
    ms: 'Kayu bedik: kiri dan kanan untuk membelok, atas untuk naik, bawah untuk turun',
    en: 'Joystick: left and right to turn, up to climb, down to dive',
  },
  boost: {
    ms: 'Laju',
    en: 'Boost',
  },
  flyingTo: {
    ms: 'Terbang ke',
    en: 'Flying to',
  },
  takeOverHint: {
    ms: 'Kemudi untuk ambil alih',
    en: 'Steer to take over',
  },
  startTitle: {
    ms: 'Jadi Kenyalang. Terbang merentas Malaysia dan lihat cuaca sebenar di bawah anda.',
    en: 'Be Kenyalang. Fly across Malaysia and see the real weather below you.',
  },
  startNearMe: {
    ms: 'Mula dekat saya',
    en: 'Start near me',
  },
  startKl: {
    ms: 'Mula di Kuala Lumpur',
    en: 'Start at Kuala Lumpur',
  },
  locationNote: {
    ms: 'Lokasi anda hanya digunakan pada peranti ini.',
    en: 'Your location stays on this device.',
  },
  outsideMalaysia: {
    ms: 'Anda nampaknya berada di luar Malaysia, jadi kita mula di Kuala Lumpur.',
    en: 'You seem to be outside Malaysia, so we’ll start at Kuala Lumpur.',
  },
  locationDenied: {
    ms: 'Lokasi tidak dapat digunakan, jadi kita mula di Kuala Lumpur.',
    en: 'Couldn’t use your location, so we’ll start at Kuala Lumpur.',
  },
  keysHint: {
    ms: '← → belok · ↑ naik · ↓ turun · Shift laju · Klik peta dahulu',
    en: '← → turn · ↑ climb · ↓ dive · Shift boost · Click the view first',
  },
  loadingWeather: {
    ms: 'Memuatkan cuaca…',
    en: 'Loading the weather…',
  },
  weatherError: {
    ms: 'Cuaca tidak dapat dimuatkan. Semak sambungan internet anda.',
    en: "Couldn't load the weather. Check your internet connection.",
  },
  tryAgain: {
    ms: 'Cuba lagi',
    en: 'Try again',
  },
  feelsLike: {
    ms: 'Rasa seperti',
    en: 'Feels like',
  },
  uv: {
    ms: 'UV',
    en: 'UV',
  },
  heat: {
    ms: 'Panas',
    en: 'Heat',
  },
  storm: {
    ms: 'Ribut petir',
    en: 'Thunderstorms',
  },
  rainChance: {
    ms: 'Peluang hujan',
    en: 'Chance of rain',
  },
  todayMax: {
    ms: 'maks. hari ini',
    en: 'max today',
  },
  next12h: {
    ms: '12 jam akan datang',
    en: 'Next 12 hours',
  },
  metToday: {
    ms: 'Ramalan rasmi MET hari ini',
    en: "MET's official forecast today",
  },
  morning: {
    ms: 'Pagi',
    en: 'Morning',
  },
  afternoon: {
    ms: 'Petang',
    en: 'Afternoon',
  },
  night: {
    ms: 'Malam',
    en: 'Night',
  },
  metUnavailable: {
    ms: 'Ramalan MET tidak tersedia buat masa ini.',
    en: "MET's forecast isn't available right now.",
  },
  updated: {
    ms: 'Dikemas kini',
    en: 'Updated',
  },
  estimateNote: {
    ms: 'Anggaran sahaja, bukan amaran rasmi.',
    en: 'Estimates only, not official warnings.',
  },
  officialSources: {
    ms: 'Sumber rasmi:',
    en: 'Official sources:',
  },
  flyToTown: {
    ms: 'Terbang ke bandar',
    en: 'Fly to a town',
  },
  searchPlaceholder: {
    ms: 'Kuching, Ipoh, Kota Bharu…',
    en: 'Kuching, Ipoh, Kota Bharu…',
  },
  noTownFound: {
    ms: 'Tiada tempat dijumpai. Cuba nama bandar atau daerah berdekatan.',
    en: 'No place found. Try a nearby town or district.',
  },
  pickTownHint: {
    ms: 'Cari bandar untuk terbang ke sana.',
    en: 'Search for a town to fly there.',
  },
  mapLabel: {
    ms: 'Peta 3D Malaysia',
    en: '3D map of Malaysia',
  },
  noWebgl: {
    ms: 'Peranti atau pelayar ini tidak menyokong WebGL2, jadi peta 3D tidak dapat dipaparkan. Cuba versi terkini Chrome, Edge, Firefox atau Safari.',
    en: "This device or browser doesn't support WebGL2, so the 3D map can't be shown. Try the latest Chrome, Edge, Firefox or Safari.",
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
