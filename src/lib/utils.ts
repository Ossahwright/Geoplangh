import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FusedGeoIntelligenceEngine } from "../services/fusedGeoIntelligenceEngine";
import { hashCode } from "./math";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate realistic GhanaPostGPS based on Region
const regionPrefixes: Record<string, string> = {
  "Greater Accra Region": "GA",
  "Ashanti Region": "AK",
  "Central Region": "CX",
  "Eastern Region": "EN",
  "Western Region": "WS",
  "Volta Region": "VW",
  "Northern Region": "NT",
  "Upper East Region": "UE",
  "Upper West Region": "UW",
  "Bono Region": "BO",
  "Bono East Region": "BE",
  "Ahafo Region": "AH",
  "Oti Region": "OR",
  "Savannah Region": "SR",
  "Western North Region": "WN",
  "North East Region": "NE"
};

export function generateGhanaPostGPS(region: string): string {
  const prefix = regionPrefixes[region] || "GA";
  const districtCode = Math.floor(Math.random() * 900) + 100;
  const areaCode = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${districtCode}-${areaCode}`;
}

export function getLatLngFromGPS(gps: string): [number, number] {
  const profile = FusedGeoIntelligenceEngine.resolveSync(gps);
  return [profile.lat, profile.lng];
}

export function latLngToUTM30N(lat: number, lng: number): { easting: number, northing: number } {
  // WGS 84 ellipsoid parameters
  const a = 6378137.0; // semi-major axis
  const f = 1.0 / 298.257223563; // flattening
  const b = a * (1.0 - f);
  const e2 = (a * a - b * b) / (a * a);
  const ePrime2 = (a * a - b * b) / (b * b);
  
  const k0 = 0.9996; // scale factor
  const lambda0 = -3.0 * Math.PI / 180.0; // Central meridian of Zone 30N (-3 degrees)
  
  const latRad = lat * Math.PI / 180.0;
  const lngRad = lng * Math.PI / 180.0;
  
  const N = a / Math.sqrt(1.0 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = ePrime2 * Math.cos(latRad) * Math.cos(latRad);
  const A = (lngRad - lambda0) * Math.cos(latRad);
  
  const M = a * (
    (1.0 - e2 / 4.0 - 3.0 * e2 * e2 / 64.0 - 5.0 * e2 * e2 * e2 / 256.0) * latRad -
    (3.0 * e2 / 8.0 + 3.0 * e2 * e2 / 32.0 + 45.0 * e2 * e2 * e2 / 1024.0) * Math.sin(2.0 * latRad) +
    (15.0 * e2 * e2 / 256.0 + 45.0 * e2 * e2 * e2 / 1024.0) * Math.sin(4.0 * latRad) -
    (35.0 * e2 * e2 * e2 / 3072.0) * Math.sin(6.0 * latRad)
  );
  
  const easting = 500000.0 + k0 * N * (
    A +
    (1.0 - T + C) * A * A * A / 6.0 +
    (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * ePrime2) * A * A * A * A * A / 120.0
  );
  
  const northing = k0 * (
    M +
    N * Math.tan(latRad) * (
      A * A / 2.0 +
      (5.0 - T + 9.0 * C + 4.0 * C * C) * A * A * A * A / 24.0 +
      (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * ePrime2) * A * A * A * A * A * A / 720.0
    )
  );
  
  return { easting, northing };
}

export function calculatePropertyAlignment(
  lat: number,
  lng: number,
  osmData: any,
  accessPathType: string = "",
  seedStr: string = ""
): number {
  let matchedAngle: number | null = null;
  let sourceOfAngle = "DEFAULT_SEED";

  if (osmData && Array.isArray(osmData.ways)) {
    // 1. Try to find closest highway/road
    const highways = osmData.ways.filter((w: any) => w.type === 'highway' && Array.isArray(w.points) && w.points.length >= 2);
    
    if (highways.length > 0) {
      let minDistance = Infinity;
      let closestWay: any = null;
      
      for (const way of highways) {
        const pts = way.points;
        let sumLat = 0, sumLng = 0;
        for (const pt of pts) {
          sumLat += pt[0];
          sumLng += pt[1];
        }
        const centerLat = sumLat / pts.length;
        const centerLng = sumLng / pts.length;
        
        const dist = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
        if (dist < minDistance) {
          minDistance = dist;
          closestWay = way;
        }
      }
      
      if (closestWay && closestWay.points.length >= 2) {
        const pt1 = closestWay.points[0];
        const pt2 = closestWay.points[closestWay.points.length - 1];
        
        const dLat = pt2[0] - pt1[0];
        const dLng = pt2[1] - pt1[1];
        
        const metersPerLat = 111320;
        const metersPerLon = 111320 * Math.cos(lat * Math.PI / 180);
        
        const dy = dLat * metersPerLat;
        const dx = dLng * metersPerLon;
        
        const roadAngle = Math.atan2(dy, dx);
        
        // Offset angle based on access road type to set parcel frontage parallel or perpendicular
        const offset = accessPathType.toLowerCase().includes("secondary") || accessPathType.toLowerCase().includes("arterial") 
          ? Math.PI / 2 
          : 0;
        
        matchedAngle = roadAngle + offset;
        sourceOfAngle = `OSM_ROAD_ALIGNMENT (Id: ${closestWay.id}, Name: ${closestWay.name || 'unnamed'})`;
      }
    }
    
    // 2. Fall back to closest building
    if (matchedAngle === null) {
      const buildings = osmData.ways.filter((w: any) => w.type === 'building' && Array.isArray(w.points) && w.points.length >= 2);
      if (buildings.length > 0) {
        let minDistance = Infinity;
        let closestBldg: any = null;
        
        for (const bldg of buildings) {
          const pts = bldg.points;
          let sumLat = 0, sumLng = 0;
          for (const pt of pts) {
            sumLat += pt[0];
            sumLng += pt[1];
          }
          const centerLat = sumLat / pts.length;
          const centerLng = sumLng / pts.length;
          
          const dist = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closestBldg = bldg;
          }
        }
        
        if (closestBldg && closestBldg.points.length >= 2) {
          const pt1 = closestBldg.points[0];
          const pt2 = closestBldg.points[1];
          const dLat = pt2[0] - pt1[0];
          const dLng = pt2[1] - pt1[1];
          const metersPerLat = 111320;
          const metersPerLon = 111320 * Math.cos(lat * Math.PI / 180);
          
          const dy = dLat * metersPerLat;
          const dx = dLng * metersPerLon;
          
          matchedAngle = Math.atan2(dy, dx);
          sourceOfAngle = `OSM_BUILDING_ALIGNMENT (Id: ${closestBldg.id})`;
        }
      }
    }
  }

  // 3. Ultimate Fallback: deterministic seed from GPS string
  if (matchedAngle === null) {
    let hash = 0;
    const seed = seedStr || `${lat},${lng}`;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    }
    const rngVal = Math.abs((hash * 9301 + 49297) % 233280) / 233280;
    matchedAngle = rngVal * Math.PI / 2;
    sourceOfAngle = "DETERMINISTIC_GPS_HASH_FALLBACK";
  }

  console.log(`[GEO-ALIGNMENT] Orienting plot at ${matchedAngle.toFixed(4)} rad (${(matchedAngle * 180 / Math.PI).toFixed(1)}°) using ${sourceOfAngle}`);
  return matchedAngle;
}

export function generatePillars(
  baseEasting: number,
  baseNorthing: number,
  size: number,
  shape: 'square' | 'rectangle' | 'irregular' = 'rectangle',
  seedStr: string = "",
  options?: {
    lat?: number;
    lng?: number;
    osmData?: any;
    accessPathType?: string;
    nearbyLandmark?: string;
  }
) {
  let seededRandom = Math.random;
  if (seedStr) {
    let hash = hashCode(seedStr);
    seededRandom = () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  }

  // Anchor to exact real-world projected coordinates (UTM Zone 30N) if provided
  let finalEasting = baseEasting;
  let finalNorthing = baseNorthing;
  
  if (options && typeof options.lat === 'number' && typeof options.lng === 'number') {
    const utmProjected = latLngToUTM30N(options.lat, options.lng);
    finalEasting = utmProjected.easting;
    finalNorthing = utmProjected.northing;
  }

  // Resolve intelligent rotation or fallback to standard design
  let finalRotation = 0;
  if (options && typeof options.lat === 'number' && typeof options.lng === 'number') {
    finalRotation = calculatePropertyAlignment(
      options.lat,
      options.lng,
      options.osmData,
      options.accessPathType || "",
      seedStr
    );
  } else {
    finalRotation = seededRandom() * Math.PI / 2;
  }
  
  let w = size;
  let h = size;

  if (shape === 'rectangle') {
    h = size * (0.7 + seededRandom() * 0.6);
  } else if (shape === 'irregular') {
    w = size * (0.8 + seededRandom() * 0.4);
    h = size * (0.8 + seededRandom() * 0.4);
  }
  
  // Base corners relative to center
  let corners = [
    { x: -w/2, y: -h/2 },
    { x: w/2, y: -h/2 },
    { x: w/2, y: h/2 },
    { x: -w/2, y: h/2 }
  ];

  if (shape === 'irregular') {
    // Add some random distortion to make it irregular
    corners = corners.map(c => ({
      x: c.x + (seededRandom() - 0.5) * (w * 0.3),
      y: c.y + (seededRandom() - 0.5) * (h * 0.3)
    }));
    
    // Sometimes add a 5th point for irregular
    if (seededRandom() > 0.5) {
      corners.push({
        x: (seededRandom() - 0.5) * w,
        y: (seededRandom() - 0.5) * h
      });
      // Sort corners clockwise to ensure it's a simple polygon
      const center = corners.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 });
      center.x /= corners.length;
      center.y /= corners.length;
      corners.sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
    }
  }
  
  // Rotate and translate using the precise coordinates
  const pts = corners.map(c => {
    const rotX = c.x * Math.cos(finalRotation) - c.y * Math.sin(finalRotation);
    const rotY = c.x * Math.sin(finalRotation) + c.y * Math.cos(finalRotation);
    return {
      easting: finalEasting + rotX,
      northing: finalNorthing + rotY
    };
  });

  const pillars = pts.map((pt, i) => {
    const nextPt = pts[(i + 1) % pts.length];
    
    // Calculate Grid Bearing
    const dx = nextPt.easting - pt.easting;
    const dy = nextPt.northing - pt.northing;
    let angleRad = Math.atan2(dx, dy);
    if (angleRad < 0) angleRad += 2 * Math.PI;
    
    const deg = Math.floor(angleRad * 180 / Math.PI);
    const min = Math.floor((angleRad * 180 / Math.PI - deg) * 60);
    
    const dist = Math.sqrt(dx*dx + dy*dy);

    return {
      id: `CP${i + 1}`,
      easting: pt.easting,
      northing: pt.northing,
      bearing: `${deg}° ${min}'`,
      distance: Number(dist.toFixed(1))
    };
  });

  return pillars;
}
