import 'maplibre-gl/dist/maplibre-gl.css'
import { type LngLatBoundsLike, Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { MultiPolygon } from 'geojson'
import { useEffect, useRef } from 'react'
import { currentDevice, renderSettings } from './device'
import { applyRegionLook } from './mapStyle'
import outline from './region.json'

// MapLibre finds its tile-processing worker next to its own file, which breaks once bundled.
// Ship the worker as a separate asset and point MapLibre at it.
setWorkerUrl(workerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

/** How far people can pan: the haze region (lon 94–120, lat −6–8) plus room for a tall, tilted phone view. */
const MAX_BOUNDS: LngLatBoundsLike = [
  [85, -15],
  [130, 22],
]
/** Peninsular Malaysia to eastern Sabah: the first view shows the whole country. */
const MALAYSIA: LngLatBoundsLike = [
  [99.6, 0.8],
  [119.3, 7.4],
]

interface Props {
  label: string
  onReady?: (map: MapLibreMap) => void
}

export default function MapView({ label, onReady }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    if (!container.current) return
    const settings = renderSettings(currentDevice())
    const narrow = window.matchMedia('(max-width: 767px)').matches

    const map = new MapLibreMap({
      container: container.current,
      style: STYLE_URL,
      bounds: MALAYSIA,
      fitBoundsOptions: { padding: narrow ? 8 : 40 },
      pitch: 0, // fit the country flat, then tilt once loaded (fitting while tilted leaves Malaysia small)
      minPitch: 0,
      maxPitch: 75,
      maxBounds: MAX_BOUNDS,
      pixelRatio: settings.pixelRatio,
      renderWorldCopies: false,
      attributionControl: {
        compact: true,
        customAttribution: 'Terrain: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>',
      },
    })

    map.on('style.load', () => {
      applyRegionLook(map, outline as MultiPolygon)
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: [TERRAIN_TILES],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15,
      })
      map.setTerrain({ source: 'terrain', exaggeration: settings.terrainExaggeration })
      map.setSky({ 'sky-color': '#8EC3EA', 'horizon-color': '#E8F1F8', 'fog-color': '#D6E8F5' })
      onReadyRef.current?.(map)
    })

    return () => map.remove()
  }, [])

  return <div ref={container} role="region" aria-label={label} className="h-full w-full" />
}
