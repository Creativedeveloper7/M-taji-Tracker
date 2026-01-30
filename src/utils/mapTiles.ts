/**
 * Map tile URLs for consistent satellite/street views.
 * Pure satellite = imagery only, no labels/roads overlay (avoids "false data" from Mapbox overlays).
 */
export const PURE_SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const PURE_SATELLITE_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com/">Esri</a>';
