import type { Lang } from './i18n'
import data from './towns.json'

/** MET Malaysia location types: town, district, Sarawak/Sabah division, recreation spot. */
export type TownType = 'Tn' | 'Ds' | 'Dv' | 'Rc'

export interface Town {
  id: string
  name: string
  type: TownType
  state: string
  lat: number
  lon: number
}

export const TOWNS = data as Town[]

const TYPE_LABEL: Record<TownType, Record<Lang, string>> = {
  Tn: { ms: 'Bandar', en: 'Town' },
  Ds: { ms: 'Daerah', en: 'District' },
  Dv: { ms: 'Bahagian', en: 'Division' },
  Rc: { ms: 'Rekreasi', en: 'Recreation' },
}

export function typeLabel(type: TownType, lang: Lang): string {
  return TYPE_LABEL[type][lang]
}

/** Other names people search for, by MET id. */
const ALIASES: Record<string, string[]> = {
  Tn003: ['Alor Setar'],
  Tn013: ['George Town', 'Penang'],
  Tn079: ['KL'],
  Tn119: ['Melaka', 'Malacca'],
  Tn145: ['Cameron Highlands'],
  Rc004: ['Penang Hill'],
  Rc008: ['Cameron Highlands'],
  Rc013: ['Taman Negara Pahang'],
  Rc014: ["Fraser's Hill"],
  Rc016: ['Genting Highlands'],
  Rc501: ['Kinabalu Park', 'Gunung Kinabalu', 'Mount Kinabalu'],
}

/** State capitals and big cities: listed first among equally good matches ("ku" → Kuala Lumpur, Kuantan, Kuching). */
const MAJOR = new Set([
  'Tn079', // Kuala Lumpur
  'Tn088', // Putrajaya
  'Tn013', // George Town
  'Tn041', // Ipoh
  'Tn139', // Johor Bahru
  'Tn119', // Bandaraya Melaka
  'Tn070', // Shah Alam
  'Tn076', // Petaling Jaya
  'Tn181', // Klang
  'Tn104', // Seremban
  'Tn108', // Kuantan
  'Tn033', // Kota Bharu
  'Tn059', // Kuala Terengganu
  'Tn003', // Alor Star
  'Tn179', // Kangar
  'Tn187', // Kuching
  'Tn190', // Sibu
  'Tn193', // Bintulu
  'Tn194', // Miri
  'Tn196', // Kota Kinabalu
  'Tn200', // Sandakan
  'Tn199', // Tawau
])

/** Towns first, then recreation spots, districts and divisions. */
const TYPE_ORDER: Record<TownType, number> = { Tn: 0, Rc: 1, Ds: 2, Dv: 3 }

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** 0 = name starts with the query, 1 = a word starts with it, 2 = contains it, null = no match. */
function matchScore(name: string, q: string): number | null {
  const n = normalize(name)
  if (n.startsWith(q)) return 0
  if (n.split(' ').some((w) => w.startsWith(q)) || n.includes(` ${q}`)) return 1
  if (q.length >= 3 && n.includes(q)) return 2
  return null
}

export function searchTowns(query: string, towns: readonly Town[] = TOWNS, limit = 8): Town[] {
  const q = normalize(query)
  if (!q) return []

  const hits: { town: Town; score: number }[] = []
  for (const town of towns) {
    const scores = [town.name, ...(ALIASES[town.id] ?? [])]
      .map((n) => matchScore(n, q))
      .filter((s): s is number => s !== null)
    if (scores.length) hits.push({ town, score: Math.min(...scores) })
  }

  hits.sort(
    (a, b) =>
      a.score - b.score ||
      Number(MAJOR.has(b.town.id)) - Number(MAJOR.has(a.town.id)) ||
      TYPE_ORDER[a.town.type] - TYPE_ORDER[b.town.type] ||
      a.town.name.localeCompare(b.town.name),
  )

  // "Kuching" is a town, a district and a division: show only the most specific one.
  const seen = new Set<string>()
  const result: Town[] = []
  for (const { town } of hits) {
    const key = normalize(town.name)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(town)
    if (result.length === limit) break
  }
  return result
}

function km(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const r = Math.PI / 180
  const h =
    Math.sin(((bLat - aLat) * r) / 2) ** 2 +
    Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLng - aLng) * r) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/**
 * The MET forecast place to show for a point: the nearest town if one is within 20 km,
 * otherwise the nearest place of any kind (district, division, recreation spot).
 * Returns the place and how far away it is.
 */
export function nearestPlace(lng: number, lat: number, towns: readonly Town[] = TOWNS): { town: Town; km: number } | null {
  let best: { town: Town; km: number } | null = null
  let bestTown: { town: Town; km: number } | null = null
  for (const town of towns) {
    const d = km(lng, lat, town.lon, town.lat)
    if (!best || d < best.km) best = { town, km: d }
    if (town.type === 'Tn' && (!bestTown || d < bestTown.km)) bestTown = { town, km: d }
  }
  return bestTown && bestTown.km <= 20 ? bestTown : best
}

export function findTown(id: string, towns: readonly Town[] = TOWNS): Town | undefined {
  return towns.find((t) => t.id === id)
}
