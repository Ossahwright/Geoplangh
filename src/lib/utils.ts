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

export function generatePillars(baseEasting: number, baseNorthing: number, size: number, shape: 'square' | 'rectangle' | 'irregular' = 'rectangle', seedStr: string = "") {
  let seededRandom = Math.random;
  if (seedStr) {
    let hash = hashCode(seedStr);
    seededRandom = () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  }

  // Generate a realistic plot based on shape
  const randomRotation = seededRandom() * Math.PI / 2;
  
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
  
  // Rotate and translate
  const pts = corners.map(c => {
    const rotX = c.x * Math.cos(randomRotation) - c.y * Math.sin(randomRotation);
    const rotY = c.x * Math.sin(randomRotation) + c.y * Math.cos(randomRotation);
    return {
      easting: baseEasting + rotX,
      northing: baseNorthing + rotY
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
