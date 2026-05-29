import { GHANA_POST_DISTRICT_CODES } from './ghanaPostDistrictCodes';

export interface LocalityZone {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

// Very rough approximation of district centers. In a real system, 
// you would load actual GeoJSON bounds for all 260+ MMDAs.
export const DISTRICT_ZONES: Record<string, LocalityZone> = {
  // Greater Accra
  "GA": { centerLat: 5.556, centerLng: -0.196, radiusMeters: 5000 }, // Accra
  "GS": { centerLat: 5.532, centerLng: -0.345, radiusMeters: 8000 }, // Ga South (Galilea/Ngleshie Amanfro)
  "GC": { centerLat: 5.602, centerLng: -0.279, radiusMeters: 4000 }, // Ga Central
  "GE": { centerLat: 5.658, centerLng: -0.187, radiusMeters: 6000 }, // Ga East
  "GW": { centerLat: 5.700, centerLng: -0.294, radiusMeters: 10000 },// Ga West
  "GT": { centerLat: 5.669, centerLng: -0.016, radiusMeters: 7000 }, // Tema
  "GD": { centerLat: 5.711, centerLng: -0.165, radiusMeters: 5000 }, // Adentan
  "GM": { centerLat: 5.683, centerLng: -0.166, radiusMeters: 5000 }, // La Nkwantanang Madina
  "GL": { centerLat: 5.589, centerLng: -0.166, radiusMeters: 3000 }, // La Dade Kotopon
  "GZ": { centerLat: 5.581, centerLng: -0.093, radiusMeters: 3000 }, // Ledzokuku
  "GK": { centerLat: 5.692, centerLng: -0.046, radiusMeters: 6000 }, // Kpone Katamanso

  // Central Region
  "CC": { centerLat: 5.118, centerLng: -1.246, radiusMeters: 4000 }, // Cape Coast
  "CX": { centerLat: 5.528, centerLng: -0.428, radiusMeters: 5000 }, // Awutu Senya East (Kasoa)

  // Ashanti Region
  "AK": { centerLat: 6.690, centerLng: -1.619, radiusMeters: 8000 }, // Kumasi
  "AS": { centerLat: 6.702, centerLng: -1.583, radiusMeters: 4000 }, // Asokore Mampong
  "AO": { centerLat: 6.195, centerLng: -1.683, radiusMeters: 5000 }, // Obuasi
  
  // Northern Region
  "NT": { centerLat: 9.400, centerLng: -0.839, radiusMeters: 7000 }, // Tamale

  // Default fallback zone center (just to center map roughly)
  "DEFAULT": { centerLat: 7.946, centerLng: -1.023, radiusMeters: 200000 }
};

export function getDistrictZone(prefix: string): LocalityZone {
  return DISTRICT_ZONES[prefix] || DISTRICT_ZONES["DEFAULT"];
}
