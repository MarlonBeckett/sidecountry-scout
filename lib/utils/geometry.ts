/**
 * Geometry utility functions
 * For working with GeoJSON and coordinate calculations
 */

/**
 * GeoJSON Polygon type
 */
export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][];
}

/**
 * Calculate the centroid of a GeoJSON polygon
 */
export function calculateCentroid(geometry: Polygon): { lat: number; lon: number } {
  const coordinates = geometry.coordinates[0]; // Get outer ring

  let latSum = 0;
  let lonSum = 0;
  const pointCount = coordinates.length;

  for (const [lon, lat] of coordinates) {
    latSum += lat;
    lonSum += lon;
  }

  return {
    lat: latSum / pointCount,
    lon: lonSum / pointCount,
  };
}

/**
 * Convert wind direction in degrees to cardinal direction
 */
export function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
