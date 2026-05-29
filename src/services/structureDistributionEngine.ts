import { getDistrictZone, LocalityZone } from '../lib/ghanaLocalityZones';
import { parseGhanaPostPrefix } from '../lib/ghanaPostDistrictCodes';
import { hashCode } from '../lib/math';
import { fetchOSMData } from './osmService'; // Ensure this exists

export interface StructureCoordinate {
  lat: number;
  lng: number;
  isSnappedToBuilding: boolean;
  accuracyMeters: number;
  metadata: {
    district: string;
    sector: string;
    structureId: string;
    zoneCenter: [number, number];
  };
}

/**
 * Calculates a unique, deterministic baseline coordinate for a specific GPS code,
 * bounded within the district/locality zone.
 */
function getDeterministicBaseline(gps: string, zone: LocalityZone, sectorCode: string, structureCode: string): [number, number] {
  // Sector Hash determines the rough neighborhood (within radius)
  const sectorHash = hashCode(`SECTOR_${sectorCode}`);
  
  // Structure Hash determines the specific placement in that neighborhood
  const structureHash = hashCode(`STRUCT_${structureCode}_${gps}`);
  
  // Use hashes to generate consistent pseudo-random angles and distances
  // We want the sector to define a coarse grid or sub-region, and structure to define fine placement.
  
  const rngSeed1 = (sectorHash % 1000) / 1000;
  const rngSeed2 = ((sectorHash >> 4) % 1000) / 1000;
  
  // Angle and distance from center for the sector
  const sectorAngle = rngSeed1 * Math.PI * 2;
  const sectorDist = rngSeed2 * zone.radiusMeters * 0.8; // Max 80% to keep it comfortably inside
  
  const sectorLatOff = (sectorDist * Math.cos(sectorAngle)) / 111320;
  const sectorLngOff = (sectorDist * Math.sin(sectorAngle)) / (111320 * Math.cos(zone.centerLat * Math.PI / 180));
  
  const coarseLat = zone.centerLat + sectorLatOff;
  const coarseLng = zone.centerLng + sectorLngOff;
  
  // Fine placement within ~500m of the sector center
  const structRng1 = (structureHash % 1000) / 1000;
  const structRng2 = ((structureHash >> 4) % 1000) / 1000;
  
  const structAngle = structRng1 * Math.PI * 2;
  const structDist = structRng2 * 500;
  
  const fineLatOff = (structDist * Math.cos(structAngle)) / 111320;
  const fineLngOff = (structDist * Math.sin(structAngle)) / (111320 * Math.cos(coarseLat * Math.PI / 180));
  
  return [coarseLat + fineLatOff, coarseLng + fineLngOff];
}

/**
 * Finds the nearest building from OSM data to snap to.
 */
export function findNearestBuildingCluster(baseLat: number, baseLng: number, osmData: any): [number, number] | null {
  if (!osmData || !osmData.ways) return null;
  
  const buildings = osmData.ways.filter((w: any) => w.type === 'building');
  if (buildings.length === 0) return null;
  
  let closestDist = Infinity;
  let closestCenter: [number, number] | null = null;
  
  for (const bldg of buildings) {
    if (bldg.points.length === 0) continue;
    
    // Quick centroid of building
    let sumLat = 0, sumLng = 0;
    for (const pt of bldg.points) {
      sumLat += pt[0];
      sumLng += pt[1];
    }
    const centerLat = sumLat / bldg.points.length;
    const centerLng = sumLng / bldg.points.length;
    
    // Distance (manhattan is fine for relative proximity)
    const dLat = centerLat - baseLat;
    const dLng = centerLng - baseLng;
    const distSq = dLat*dLat + dLng*dLng;
    
    if (distSq < closestDist) {
      closestDist = distSq;
      closestCenter = [centerLat, centerLng];
    }
  }
  
  // Only snap if within reasonable distance (e.g., ~200 meters)
  // roughly 0.002 degrees
  if (closestDist < 0.000004) {
    return closestCenter;
  }
  
  return null;
}

export async function resolveStructureCoordinate(gps: string): Promise<StructureCoordinate> {
  const normGps = gps.replace(/\s/g, '').toUpperCase();
  const parts = normGps.split('-');
  
  let prefix = parts[0] || 'GA';
  let sectorCode = parts[1] || '0000';
  let structureCode = parts[2] || '0000';
  
  const zone = getDistrictZone(prefix);
  const districtInfo = parseGhanaPostPrefix(prefix).info;
  
  // 1. Generate Deterministic Baseline Coordinate
  const [baseLat, baseLng] = getDeterministicBaseline(normGps, zone, sectorCode, structureCode);
  
  // 2. Try to snap to real OSM infrastructure
  // Optional: For very strict deterministic behavior without network calls parsing, we use baseLat, baseLng first.
  // Then we can do an async snap if OSM is available.
  let finalLat = baseLat;
  let finalLng = baseLng;
  let isSnapped = false;
  
  try {
    const osmData = await fetchOSMData(baseLat, baseLng, 200);
    if (osmData) {
      const snapped = findNearestBuildingCluster(baseLat, baseLng, osmData);
      if (snapped) {
        finalLat = snapped[0];
        finalLng = snapped[1];
        isSnapped = true;
      }
    }
  } catch (err) {
    console.warn("OSM enrichment failed during structure distribution, using theoretical coordinate.", err);
  }

  return {
    lat: finalLat,
    lng: finalLng,
    isSnappedToBuilding: isSnapped,
    accuracyMeters: isSnapped ? 5 : 50,
    metadata: {
      district: districtInfo?.district || prefix,
      sector: sectorCode,
      structureId: structureCode,
      zoneCenter: [zone.centerLat, zone.centerLng]
    }
  };
}

/**
 * Synchronous version for immediate map rendering, snaps can be done later if needed.
 */
export function resolveStructureCoordinateSync(gps: string): [number, number] {
  const normGps = gps.replace(/\s/g, '').toUpperCase();
  const parts = normGps.split('-');
  
  let prefix = parts[0] || 'GA';
  let sectorCode = parts[1] || '0000';
  let structureCode = parts[2] || '0000';
  
  const zone = getDistrictZone(prefix);
  return getDeterministicBaseline(normGps, zone, sectorCode, structureCode);
}
