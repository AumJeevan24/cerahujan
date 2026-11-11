// Builds the app's static data files from open data, once:
//
// 1. src/region.json: one outline covering Malaysia, Singapore, Brunei and Indonesia (land plus
//    coastal sea) from OpenStreetMap, simplified and merged. The map hides everything outside it.
// 2. src/towns.json: MET Malaysia's forecast locations with coordinates and state.
//
// MET's API (api.data.gov.my/weather/forecast) gives only an id and a name per place.
// This looks each place up once in OpenStreetMap's Nominatim (1 request per second,
// as its usage policy asks) and saves the result, so the app never geocodes at runtime.
//
// Run:  node make-data.mjs        (takes ~8 minutes the first time)
// Then review the "check" lines it prints, add fixes to OVERRIDES below, and run again
// (lookups are cached in .towns-cache.json, so a re-run is quick).

import { readFileSync, writeFileSync } from 'node:fs'
import polygonClipping from 'polygon-clipping'

const MET_URL = 'https://api.data.gov.my/weather/forecast/'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'cerahujan-towns-build/1.0 (+https://github.com/AumJeevan24/cerahujan)'
const OUT = 'src/towns.json'
const REGION_OUT = 'src/region.json'

/** Countries the map shows, with how much to simplify each outline (degrees; ~0.01 = 1 km). */
const REGION = {
  Malaysia: 0.002, // finer: coarser outlines cut off border towns such as Rantau Panjang
  Singapore: 0.005,
  Brunei: 0.005,
  Indonesia: 0.01,
}
const CACHE = '.towns-cache.json' // git-ignored; lets a re-run skip places already looked up

/** Hand-checked fixes, by MET id: a clearer search text where a name is ambiguous or spelled
 *  differently in OpenStreetMap, or exact coordinates where it can't be found at all. */
const OVERRIDES = {
  Tn013: { query: 'George Town, Pulau Pinang' },
  Tn023: { query: 'Serdang, Bandar Baharu, Kedah' },
  Tn156: { query: 'Seri Manjung, Perak' },
  Tn169: { query: 'Sabak, Sabak Bernam, Selangor' },
  Tn184: { query: 'Kampung Raja, Besut, Terengganu' },
  Rc008: { query: 'Cameron Highlands, Pahang' },
  Rc013: { query: 'Kuala Tahan, Pahang' },
  Rc018: { query: 'Kuala Gandah, Pahang' },
  Rc019: { lat: 3.0833, lon: 102.6, state: 'Pahang' }, // Lake Bera Ramsar site
  Ds537: { lat: 4.394, lon: 113.988, state: 'Sarawak' }, // the district polygon's centre is 180 km inland; use Miri city
  Rc511: { query: 'Taman Tunku Abdul Rahman, Sabah' },
  Dv515: { query: 'Pantai Barat, Sabah' },
}

/** Which kinds of OpenStreetMap place fit each MET location type, best first (Nominatim "addresstype"). */
const PREFERRED = {
  Tn: ['city', 'town', 'suburb', 'village', 'quarter', 'municipality', 'district', 'county', 'neighbourhood', 'hamlet'],
  Ds: ['district', 'county', 'municipality', 'region', 'city', 'town', 'village'],
  Dv: ['county', 'region', 'state_district', 'district', 'city', 'town'],
  Rc: ['island', 'islet', 'archipelago', 'national_park', 'protected_area', 'nature_reserve', 'peak', 'beach', 'tourism', 'town', 'village', 'hamlet', 'suburb', 'district', 'city'],
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function cleanState(s) {
  if (!s) return null
  return s
    .replace(/^Wilayah Persekutuan\s*/i, 'WP ')
    .replace(/^Federal Territory of\s*/i, 'WP ')
    .replace(/^Penang$/i, 'Pulau Pinang')
    .replace(/^Malacca$/i, 'Melaka')
    .replace(/^(Kuala Lumpur|Putrajaya|Labuan)$/i, 'WP $1')
    .trim()
}

async function search(text, cache) {
  if (cache[text]) return cache[text]
  const url = `${NOMINATIM}?${new URLSearchParams({ q: text, countrycodes: 'my', format: 'jsonv2', addressdetails: '1', limit: '8' })}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ms,en' } })
  if (!res.ok) throw new Error(`Nominatim ${res.status} for ${text}`)
  const results = await res.json()
  cache[text] = results
  writeFileSync(CACHE, JSON.stringify(cache))
  await sleep(1100)
  return results
}

/** Best place kind for this MET type first; among equals, the most prominent (Nominatim "importance"). */
function pick(results, type) {
  const order = PREFERRED[type]
  const rankOf = (r) => (order.includes(r.addresstype) ? order.indexOf(r.addresstype) : order.length)
  const chosen = [...results].sort((a, b) => rankOf(a) - rankOf(b) || Number(b.importance) - Number(a.importance))[0]
  if (!chosen) return null
  const a = chosen.address ?? {}
  return {
    lat: Number(chosen.lat),
    lon: Number(chosen.lon),
    state: cleanState(a.state ?? a.city ?? a.territory),
    kind: chosen.addresstype,
    fits: rankOf(chosen) < order.length,
  }
}

/** Country boundaries from OpenStreetMap (they include coastal waters), merged into one shape so overlaps don't leave gaps. */
async function writeRegion() {
  const shapes = []
  for (const [country, threshold] of Object.entries(REGION)) {
    const params = new URLSearchParams({
      q: country,
      featureType: 'country',
      format: 'geojson',
      polygon_geojson: '1',
      polygon_threshold: String(threshold),
      limit: '1',
    })
    const res = await fetch(`${NOMINATIM}?${params}`, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`Nominatim ${res.status} for ${country}`)
    const { geometry } = (await res.json()).features[0]
    shapes.push(geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates)
    await sleep(1100)
  }
  const merged = polygonClipping.union(...shapes)
  const round = (c) => (typeof c[0] === 'number' ? [+c[0].toFixed(4), +c[1].toFixed(4)] : c.map(round))
  writeFileSync(REGION_OUT, JSON.stringify({ type: 'MultiPolygon', coordinates: round(merged) }) + '\n')
  console.log(`Wrote ${Object.keys(REGION).join(', ')} outline to ${REGION_OUT} (${merged.length} parts)`)
}

async function main() {
  await writeRegion()

  const cache = (() => {
    try {
      return JSON.parse(readFileSync(CACHE, 'utf8'))
    } catch {
      return {}
    }
  })()

  const rows = await (await fetch(MET_URL)).json()
  const places = new Map()
  for (const r of rows) places.set(r.location.location_id, r.location.location_name)

  const out = []
  const ids = [...places.keys()].filter((id) => !id.startsWith('St')).sort()
  for (const id of ids) {
    const name = places.get(id)
    const type = id.slice(0, 2)
    const fix = OVERRIDES[id] ?? {}
    const place =
      fix.lat !== undefined
        ? { lat: fix.lat, lon: fix.lon, state: fix.state, kind: 'override', fits: true }
        : pick(await search(fix.query ?? `${name}, Malaysia`, cache), type)
    if (!place) {
      console.log(`check ${id} ${name}: NOT FOUND`)
      continue
    }
    if (!place.fits || !place.state) console.log(`check ${id} ${name}: ${place.kind} in ${place.state ?? '?'}`)
    out.push({ id, name, type, state: place.state ?? '', lat: +place.lat.toFixed(4), lon: +place.lon.toFixed(4) })
    process.stdout.write('.')
  }
  // Same name and type twice (e.g. two towns called Serdang) must not share one point.
  for (const p of out) {
    const twin = out.find((q) => q !== p && q.type === p.type && q.name === p.name && q.lat === p.lat && q.lon === p.lon)
    if (twin) console.log(`check ${p.id} ${p.name}: same point as ${twin.id}`)
  }
  writeFileSync(OUT, JSON.stringify(out, null, 0).replace(/\},\{/g, '},\n{') + '\n')
  console.log(`\nWrote ${out.length} places to ${OUT}`)
}

main()
