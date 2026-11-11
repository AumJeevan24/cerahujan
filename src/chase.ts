import { type Bird, moveAlong } from './flight'

/** Where the chase camera sits and where it looks. */
export interface ChaseCamera {
  lng: number
  lat: number
  alt: number // metres above sea level
  bearing: number
  pitch: number // 0 = looking straight down, 90 = at the horizon
  roll: number
}

/** How far behind Kenyalang the camera sits: close over rooftops, further back when soaring. */
export function followDistance(aboveGround: number): number {
  return Math.min(2500, Math.max(45, 40 + aboveGround * 0.55))
}

/** Kenyalang's drawn wingspan in metres: grows with the follow distance so he looks the same size on screen. */
export function drawnWingspan(aboveGround: number): number {
  return followDistance(aboveGround) * 0.32
}

/**
 * Camera behind and a little above the bird, looking at a point just ahead of it.
 * `groundAtCamera` keeps the camera from dipping into hills when flying low.
 */
export function chaseCamera(bird: Bird, groundUnderBird: number, groundAtCamera: number): ChaseCamera {
  const aboveGround = Math.max(0, bird.alt - groundUnderBird)
  const back = followDistance(aboveGround)
  const up = back * 0.28
  const [lng, lat] = moveAlong(bird.lng, bird.lat, bird.heading + 180, back)
  const alt = Math.max(bird.alt + up, groundAtCamera + 20)

  // Look at a point half a follow-distance ahead of the bird, at the bird's height.
  const drop = alt - bird.alt
  const ahead = back * 1.5
  const pitch = 90 - (Math.atan2(drop, ahead) * 180) / Math.PI

  return { lng, lat, alt, bearing: bird.heading, pitch: Math.min(85, pitch), roll: bird.bank * 0.35 }
}
