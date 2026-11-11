import type { Town, TownType } from './towns'

export interface CameraTarget {
  center: [number, number]
  zoom: number
  pitch: number
}

/** Towns get close enough for 3D buildings (zoom 14+); bigger areas are framed wider. */
const ZOOM: Record<TownType, number> = { Tn: 14, Rc: 12.5, Ds: 10.5, Dv: 9.5 }

export function cameraFor(town: Town): CameraTarget {
  return { center: [town.lon, town.lat], zoom: ZOOM[town.type], pitch: 60 }
}

const STORAGE_KEY = 'cerahujan.town'

export function loadTownId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveTownId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Not critical: the town just won't be remembered.
  }
}
