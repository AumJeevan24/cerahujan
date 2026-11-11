import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec'
import type { Map as MapLibreMap } from 'maplibre-gl'

/** Sea colour of the drawn map (when zoomed in). */
export const SEA = '#8EC3EA'
/** The satellite imagery's sea colour (measured from it), so the hidden area blends in when zoomed out. */
export const DEEP_SEA = '#182C4C'

/** Satellite imagery shows fully up to this zoom, then fades into the drawn map by SATELLITE_GONE. */
export const SATELLITE_FULL = 11.5
export const SATELLITE_GONE = 13.5

/** Sentinel-2 cloudless by EOX: free for non-commercial use (CC BY-NC-SA 4.0) with this credit. */
const SATELLITE_YEAR = 2025
const SATELLITE_TILES = `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${SATELLITE_YEAR}_3857/default/g/{z}/{y}/{x}.jpg`
const SATELLITE_CREDIT = `<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless ${SATELLITE_YEAR}</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data ${SATELLITE_YEAR})`

/** Covers most of Asia–Pacific: comfortably beyond how far the map can be panned. */
const WORLD_RING: Position[] = [
  [60, -40],
  [160, -40],
  [160, 45],
  [60, 45],
  [60, -40],
]

/**
 * One polygon covering everything outside the region (Malaysia, Singapore, Brunei, Indonesia): a big rectangle
 * with the region's outer outlines cut out as holes. OpenStreetMap's country outlines include coastal sea,
 * so coasts and islands are never clipped.
 */
export function outsideRegion(outline: Polygon | MultiPolygon): Feature<Polygon> {
  const polygons = outline.type === 'Polygon' ? [outline.coordinates] : outline.coordinates
  const holes = polygons.map((rings) => rings[0]).filter((ring): ring is Position[] => ring !== undefined)
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...holes] } }
}

/** Brighter colours than the default OpenFreeMap "liberty" style, keyed by its layer ids. */
const FILL_COLOURS: Record<string, string> = {
  water: SEA,
  park: '#C5E4AE',
  landcover_wood: 'hsla(105, 48%, 62%, 0.75)',
  landcover_grass: '#BFE3A3',
  building: '#E2D8C6',
}

type FilterSpecification = NonNullable<Parameters<MapLibreMap['setFilter']>[1]>
type PaintProperty = Parameters<MapLibreMap['setPaintProperty']>[1]
type PaintValue = Parameters<MapLibreMap['setPaintProperty']>[2]

function setPaint(map: MapLibreMap, layer: string, property: PaintProperty, value: PaintValue) {
  if (map.getLayer(layer)) map.setPaintProperty(layer, property, value)
}

const zoomFade = (from: number | string, to: number | string): ExpressionSpecification =>
  ['interpolate', ['linear'], ['zoom'], SATELLITE_FULL, from, SATELLITE_GONE, to]

/**
 * Real-world building materials. Height picks the material (houses and shops: plaster; mid-rise: concrete;
 * towers: glass), and the building's id picks one of a few shades so neighbours don't all look identical.
 */
const height: ExpressionSpecification = ['coalesce', ['get', 'render_height'], 0]
const shade = (n: number): ExpressionSpecification => ['%', ['to-number', ['id'], 0], n]
export const BUILDING_COLOUR: ExpressionSpecification = [
  'case',
  ['>=', height, 60],
  ['match', shade(3), 0, '#8DA3B8', 1, '#9AAFC2', '#7F96AD'],
  ['>=', height, 20],
  ['match', shade(3), 0, '#CFCAC2', 1, '#D9D3C7', '#C2BDB5'],
  ['match', shade(4), 0, '#E6DCCB', 1, '#DCCFB9', 2, '#EDE6DA', '#D6C3A5'],
]

export function applyRegionLook(map: MapLibreMap, outline: Polygon | MultiPolygon) {
  for (const [layer, colour] of Object.entries(FILL_COLOURS)) setPaint(map, layer, 'fill-color', colour)
  // Land: soft green from far away so the country reads clearly, the style's neutral cream up close.
  setPaint(map, 'background', 'background-color', ['interpolate', ['linear'], ['zoom'], 5, '#D3E4BE', 11, '#F4F1E8'])

  // Satellite imagery for the landscape when zoomed out, under roads and names ("hybrid" view).
  // It sits above the drawn land and water (below roads), so while tiles load — or if the free imagery
  // server is down — you see the normal drawn map instead of gaps. It fades out as you zoom into a town,
  // where streets and 3D buildings read better than 10 m imagery.
  map.addSource('satellite', {
    type: 'raster',
    tiles: [SATELLITE_TILES],
    tileSize: 256,
    maxzoom: 14,
    attribution: SATELLITE_CREDIT,
  })
  const layers = map.getStyle().layers
  const water = layers.findIndex((layer) => layer.id === 'water')
  const aboveWater = layers.find((layer, i) => i > water && layer.type === 'line')?.id
  map.addLayer(
    { id: 'satellite', type: 'raster', source: 'satellite', maxzoom: SATELLITE_GONE, paint: { 'raster-opacity': zoomFade(1, 0) } },
    aboveWater,
  )
  // Dashed outlines of parks and marine reserves clutter the satellite view; show them only up close.
  setPaint(map, 'park_outline', 'line-opacity', zoomFade(0, 1))

  // Buildings: real materials, lit by an afternoon sun from the south-west so walls have a light and a shadow side.
  setPaint(map, 'building-3d', 'fill-extrusion-color', BUILDING_COLOUR)
  setPaint(map, 'building-3d', 'fill-extrusion-opacity', 0.95)
  map.setLight({ anchor: 'map', position: [1.3, 225, 35], color: '#FFF6E8', intensity: 0.45 })

  // With 3D terrain, labels and icons are drawn after everything else, so the mask below
  // can't cover them. Keep only the ones inside the region instead.
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const inside = ['within', outline] as FilterSpecification
    map.setFilter(layer.id, layer.filter ? (['all', layer.filter, inside] as FilterSpecification) : inside)
  }

  // Added last, so it sits above the base map and hides far-away countries. Deep blue when zoomed out
  // to match the satellite sea, the drawn map's sea colour when zoomed in.
  map.addSource('outside-region', { type: 'geojson', data: outsideRegion(outline) })
  map.addLayer({
    id: 'outside-region',
    type: 'fill',
    source: 'outside-region',
    paint: { 'fill-color': zoomFade(DEEP_SEA, SEA) },
  })

  // If the imagery server is down, the drawn map shows instead; match the hidden area to its lighter sea.
  // (One failed tile is normal on a bad connection, so wait for several.)
  let failedTiles = 0
  map.on('error', (event) => {
    if ('sourceId' in event && event.sourceId === 'satellite' && ++failedTiles === 6) {
      map.setPaintProperty('outside-region', 'fill-color', SEA)
    }
  })
}
