/** What we know about the device, as reported by the browser. Fields can be missing. */
export interface DeviceInfo {
  deviceMemory?: number
  hardwareConcurrency?: number
  devicePixelRatio?: number
}

/** Weak devices get "lite 3D": lower resolution and flatter terrain. */
export function isLiteDevice(d: DeviceInfo): boolean {
  if (d.deviceMemory !== undefined && d.deviceMemory <= 4) return true
  if (d.hardwareConcurrency !== undefined && d.hardwareConcurrency <= 4) return true
  return false
}

export interface RenderSettings {
  lite: boolean
  pixelRatio: number
  terrainExaggeration: number
}

export function renderSettings(d: DeviceInfo): RenderSettings {
  const lite = isLiteDevice(d)
  const dpr = d.devicePixelRatio ?? 1
  return {
    lite,
    // Rendering at full phone resolution (often 3x) is the biggest cost on budget GPUs.
    pixelRatio: Math.min(dpr, lite ? 1.25 : 2),
    terrainExaggeration: lite ? 1.0 : 1.3,
  }
}

export function currentDevice(): DeviceInfo {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    devicePixelRatio: window.devicePixelRatio,
  }
}

export function hasWebGL2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null
  } catch {
    return false
  }
}
