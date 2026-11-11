import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import type { Map as MapLibreMap } from 'maplibre-gl'

/** Sea colour. The area outside the shown region is painted the same, so far-away countries disappear into the sea. */
export const SEA = '#8EC3EA'

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
  building: '#E7DAC4',
}

type FilterSpecification = NonNullable<Parameters<MapLibreMap['setFilter']>[1]>
type PaintProperty = Parameters<MapLibreMap['setPaintProperty']>[1]
type PaintValue = Parameters<MapLibreMap['setPaintProperty']>[2]

function setPaint(map: MapLibreMap, layer: string, property: PaintProperty, value: PaintValue) {
  if (map.getLayer(layer)) map.setPaintProperty(layer, property, value)
}

export function applyRegionLook(map: MapLibreMap, outline: Polygon | MultiPolygon) {
  for (const [layer, colour] of Object.entries(FILL_COLOURS)) setPaint(map, layer, 'fill-color', colour)

  // Land: soft green from far away so the country reads clearly, the style's neutral cream up close.
  setPaint(map, 'background', 'background-color', ['interpolate', ['linear'], ['zoom'], 5, '#D3E4BE', 11, '#F4F1E8'])
  // Shaded relief (hills and mountains) from far away; the style fades it out by zoom 7.
  setPaint(map, 'natural_earth', 'raster-opacity', ['interpolate', ['exponential', 1.5], ['zoom'], 0, 0.6, 6, 0.35, 7, 0.15])

  // Buildings: warm low-rise, glass-blue towers.
  setPaint(map, 'building-3d', 'fill-extrusion-color', [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', 'render_height'], 0],
    0, '#EFE3CE',
    25, '#E2C9A3',
    80, '#A9C1DE',
    200, '#7C9FCB',
  ])
  setPaint(map, 'building-3d', 'fill-extrusion-opacity', 0.92)

  // With 3D terrain, labels and icons are drawn after everything else, so the mask below
  // can't cover them. Keep only the ones inside the region instead.
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const inside = ['within', outline] as FilterSpecification
    map.setFilter(layer.id, layer.filter ? (['all', layer.filter, inside] as FilterSpecification) : inside)
  }

  // Added last, so it sits above the base map and hides far-away countries' land and roads.
  map.addSource('outside-region', { type: 'geojson', data: outsideRegion(outline) })
  map.addLayer({ id: 'outside-region', type: 'fill', source: 'outside-region', paint: { 'fill-color': SEA } })
}
