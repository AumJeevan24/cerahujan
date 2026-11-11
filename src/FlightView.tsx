import 'maplibre-gl/dist/maplibre-gl.css'
import type { MultiPolygon } from 'geojson'
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef } from 'react'
import { chaseCamera, drawnWingspan } from './chase'
import { currentDevice, renderSettings } from './device'
import { autopilot, type Bird, type Controls, step } from './flight'
import { createHornbillLayer } from './hornbill'
import { combineControls, FLIGHT_KEYS, isSteering, keysToControls } from './keys'
import { applyRegionLook } from './mapStyle'
import outline from './region.json'
import { saveBird } from './session'

// MapLibre finds its tile-processing worker next to its own file, which breaks once bundled.
setWorkerUrl(workerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

export interface FlightTarget {
  lng: number
  lat: number
}

interface Props {
  label: string
  start: Bird
  /** Touch joystick input, written by <TouchControls>. */
  touch: React.RefObject<Controls>
  /** Set to fly there on autopilot; any steering takes over. */
  target: FlightTarget | null
  onArrive: () => void
  onTakeOver: () => void
  /** Called about once a second with where Kenyalang is. */
  onMove: (bird: Bird) => void
}

export default function FlightView({ label, start, touch, target, onArrive, onTakeOver, onMove }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const targetRef = useRef(target)
  targetRef.current = target
  const callbacks = useRef({ onArrive, onTakeOver, onMove })
  callbacks.current = { onArrive, onTakeOver, onMove }
  const birdRef = useRef<Bird>(start)

  useEffect(() => {
    const el = container.current
    if (!el) return
    const settings = renderSettings(currentDevice())
    const held = new Set<string>()
    let ground = 0
    let effort = 0

    const map = new MapLibreMap({
      container: el,
      style: STYLE_URL,
      center: [start.lng, start.lat],
      zoom: 15,
      pitch: 75,
      maxPitch: 85,
      bearing: start.heading,
      interactive: false, // the camera follows Kenyalang; you steer the bird, not the map
      pixelRatio: settings.pixelRatio,
      renderWorldCopies: false,
      fadeDuration: 0,
      attributionControl: {
        compact: true,
        customAttribution:
          'Terrain: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>',
      },
    })

    map.on('style.load', () => {
      applyRegionLook(map, outline as MultiPolygon)
      map.addSource('terrain', { type: 'raster-dem', tiles: [TERRAIN_TILES], encoding: 'terrarium', tileSize: 256, maxzoom: 15 })
      map.setTerrain({ source: 'terrain', exaggeration: settings.terrainExaggeration })
      map.setSky({ 'sky-color': '#8EC3EA', 'horizon-color': '#E8F1F8', 'fog-color': '#D6E8F5' })
      const b = () => birdRef.current
      map.addLayer(
        createHornbillLayer(() => ({
          lng: b().lng,
          lat: b().lat,
          alt: b().alt,
          ground,
          heading: b().heading,
          bank: b().bank,
          wingspan: drawnWingspan(b().alt - ground),
          effort,
        })),
      )
    })

    // Keyboard: only while the flight view has focus, so typing in the search box never steers.
    const down = (e: KeyboardEvent) => {
      if (!FLIGHT_KEYS.has(e.code)) return
      e.preventDefault()
      held.add(e.code)
    }
    const up = (e: KeyboardEvent) => held.delete(e.code)
    const blur = () => held.clear()
    el.addEventListener('keydown', down)
    el.addEventListener('keyup', up)
    el.addEventListener('blur', blur)

    let raf = 0
    let last = performance.now()
    let lastReport = 0
    let lastSave = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const bird = birdRef.current
      ground = map.queryTerrainElevation([bird.lng, bird.lat]) ?? 0

      const manual = combineControls(keysToControls(held), touch.current)
      let controls: Controls = manual
      const goal = targetRef.current
      if (goal && isSteering(manual)) {
        callbacks.current.onTakeOver()
      } else if (goal) {
        const pilot = autopilot(bird, goal.lng, goal.lat, ground)
        controls = pilot.controls
        if (pilot.arrived) callbacks.current.onArrive()
      }

      const next = step(bird, controls, dt, ground)
      birdRef.current = next
      effort += ((Math.min(1, Math.abs(controls.climb) + (controls.boost ? 0.6 : 0) + Math.abs(controls.turn) * 0.3) - effort) * Math.min(1, dt * 3))

      const first = chaseCamera(next, ground, ground)
      const camGround = map.queryTerrainElevation([first.lng, first.lat]) ?? ground
      const cam = chaseCamera(next, ground, camGround)
      map.jumpTo(map.calculateCameraOptionsFromCameraLngLatAltRotation([cam.lng, cam.lat], cam.alt, cam.bearing, cam.pitch, cam.roll))

      if (now - lastReport > 1000) {
        lastReport = now
        callbacks.current.onMove(next)
      }
      if (now - lastSave > 5000) {
        lastSave = now
        saveBird(next)
      }
    }
    map.once('load', () => {
      // Start with the map credits folded into the small (i) button so they don't cover the controls.
      el.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      last = performance.now()
      raf = requestAnimationFrame(frame)
    })
    el.focus()

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('keydown', down)
      el.removeEventListener('keyup', up)
      el.removeEventListener('blur', blur)
      saveBird(birdRef.current)
      map.remove()
    }
    // The map is created once; `start` only matters for the first frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={container}
      role="application"
      aria-label={label}
      tabIndex={0}
      className="h-full w-full outline-none"
    />
  )
}
