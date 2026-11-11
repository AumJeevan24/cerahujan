import { describe, expect, it } from 'vitest'
import { findTown, normalize, searchTowns, TOWNS, type Town } from './towns'

const sample: Town[] = [
  { id: 'Tn187', name: 'Kuching', type: 'Tn', state: 'Sarawak', lat: 1.55, lon: 110.34 },
  { id: 'Ds504', name: 'Kuching', type: 'Ds', state: 'Sarawak', lat: 1.5, lon: 110.3 },
  { id: 'Dv501', name: 'Kuching', type: 'Dv', state: 'Sarawak', lat: 1.4, lon: 110.4 },
  { id: 'Tn079', name: 'Kuala Lumpur', type: 'Tn', state: 'WP Kuala Lumpur', lat: 3.15, lon: 101.69 },
  { id: 'Tn108', name: 'Kuantan', type: 'Tn', state: 'Pahang', lat: 3.81, lon: 103.33 },
  { id: 'Ds069', name: 'Kuantan', type: 'Ds', state: 'Pahang', lat: 3.8, lon: 103.3 },
  { id: 'Rc008', name: 'Cameron Highland', type: 'Rc', state: 'Pahang', lat: 4.47, lon: 101.38 },
  { id: 'Ds038', name: 'Tanah Tinggi Cameron', type: 'Ds', state: 'Pahang', lat: 4.5, lon: 101.4 },
  { id: 'Tn041', name: 'Ipoh', type: 'Tn', state: 'Perak', lat: 4.6, lon: 101.08 },
  { id: 'Rc501', name: 'Taman Nasional Kinabalu', type: 'Rc', state: 'Sabah', lat: 6.08, lon: 116.56 },
]

describe('normalize', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalize("  Fraser's   HILL ")).toBe('fraser s hill')
    expect(normalize('Tanah Rata - Brinchang')).toBe('tanah rata brinchang')
  })
})

describe('searchTowns', () => {
  it('returns nothing for an empty query', () => {
    expect(searchTowns('   ', sample)).toEqual([])
  })

  it('finds names by their start and shows one entry per name, town first', () => {
    const r = searchTowns('kuc', sample)
    expect(r.map((t) => t.id)).toEqual(['Tn187'])
  })

  it('ranks name-start matches before word matches', () => {
    expect(searchTowns('ku', sample).map((t) => t.name)).toEqual(['Kuala Lumpur', 'Kuantan', 'Kuching'])
  })

  it('matches later words in a name', () => {
    expect(searchTowns('kinabalu', sample).map((t) => t.id)).toEqual(['Rc501'])
  })

  it('understands common alternative names', () => {
    expect(searchTowns('KL', sample).map((t) => t.id)).toEqual(['Tn079'])
    expect(searchTowns('cameron highlands', sample).map((t) => t.id)).toContain('Rc008')
    expect(searchTowns('mount kinabalu', sample).map((t) => t.id)).toEqual(['Rc501'])
  })

  it('only matches inside words for queries of 3+ letters', () => {
    expect(searchTowns('po', sample).map((t) => t.id)).toEqual([])
    expect(searchTowns('poh', sample).map((t) => t.id)).toEqual(['Tn041'])
  })

  it('lists major cities before smaller places with an equally good match', () => {
    const withSmall: Town[] = [
      { id: 'Tn143', name: 'Kuah', type: 'Tn', state: 'Kedah', lat: 6.32, lon: 99.85 },
      ...sample,
    ]
    expect(searchTowns('ku', withSmall).map((t) => t.name)).toEqual(['Kuala Lumpur', 'Kuantan', 'Kuching', 'Kuah'])
  })

  it('finds the real data by common names', () => {
    expect(searchTowns('ku').slice(0, 4).map((t) => t.name)).toEqual(['Kuala Lumpur', 'Kuala Terengganu', 'Kuantan', 'Kuching'])
    expect(searchTowns('penang')[0]?.id).toBe('Tn013')
    expect(searchTowns('genting')[0]?.id).toBe('Rc016')
  })

  it('respects the limit', () => {
    expect(searchTowns('k', sample, 2)).toHaveLength(2)
  })
})

describe('findTown', () => {
  it('finds a place by MET id', () => {
    expect(findTown('Tn041', sample)?.name).toBe('Ipoh')
    expect(findTown('nope', sample)).toBeUndefined()
  })
})

describe('towns.json', () => {
  it('has unique ids and every place inside Malaysia with a state', () => {
    expect(TOWNS.length).toBeGreaterThan(400)
    expect(new Set(TOWNS.map((t) => t.id)).size).toBe(TOWNS.length)
    for (const t of TOWNS) {
      expect(t.state, t.id).not.toBe('')
      expect(t.lat, t.id).toBeGreaterThan(0.8)
      expect(t.lat, t.id).toBeLessThan(7.5)
      expect(t.lon, t.id).toBeGreaterThan(99.5)
      expect(t.lon, t.id).toBeLessThan(119.5)
    }
  })

  it('places well-known towns in the right state', () => {
    const state = (name: string, type = 'Tn') => TOWNS.find((t) => t.name === name && t.type === type)?.state
    expect(state('Ipoh')).toBe('Perak')
    expect(state('Kuching')).toBe('Sarawak')
    expect(state('Kota Kinabalu')).toBe('Sabah')
    expect(state('Johor Bahru')).toBe('Johor')
    expect(state('Georgetown')).toBe('Pulau Pinang')
  })
})
