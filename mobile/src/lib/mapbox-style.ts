// Mapbox Style URL — use Dark style as base
// Replace with your own Studio style URL after creating it on mapbox.com/studio
export const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ?? 'mapbox://styles/mapbox/dark-v11'

export const BRAND_OVERLAYS = {
  background:  '#0D1B1A',
  water:       '#0E2E2B',
  land:        '#152320',
  roads:       '#1E4D47',
  roadsLabel:  '#4A8F88',
  buildings:   '#1C3430',
}
