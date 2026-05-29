import * as turf from '@turf/turf';
import districtsGeoJson from '../data/mmda/districts/ghanaDistricts.json';
import regionsGeoJson from '../data/mmda/regions/ghanaRegions.json';
import planningSectorsGeoJson from '../data/mmda/planning/planningSectors.json';
import electoralAreasGeoJson from '../data/mmda/electoral_areas/electoralAreas.json';

export interface DistrictValidation {
  district: string | null;
  region: string | null;
  category: string | null;
  polygonValidated: boolean;
  accuracy: 'exact' | 'rough' | 'none';
  electoralArea?: string;
  planningSector?: string;
  assemblyZone?: string;
  zoning?: string;
}

export function validateDistrict(lat: number, lng: number): DistrictValidation {
  const point = turf.point([lng, lat]);
  let foundDistrict = null;
  let foundRegion = null;
  let category = null;
  let electoralArea = undefined;
  let planningSector = undefined;
  let assemblyZone = undefined;
  let zoning = undefined;

  try {
    // 1. Check Districts first for higher precision
    for (const feature of (districtsGeoJson as any).features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        foundDistrict = feature.properties.name;
        foundRegion = feature.properties.region;
        category = feature.properties.category;
        break;
      }
    }

    // 2. Check Electoral Areas
    for (const feature of (electoralAreasGeoJson as any).features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        electoralArea = feature.properties.name;
        assemblyZone = feature.properties.assembly_zone;
        break;
      }
    }

    // 3. Check Planning Sectors
    for (const feature of (planningSectorsGeoJson as any).features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        planningSector = feature.properties.name;
        zoning = feature.properties.zoning;
        break;
      }
    }

    // 4. Fallback to Regions check if district not found
    if (!foundDistrict) {
      for (const feature of (regionsGeoJson as any).features) {
        if (turf.booleanPointInPolygon(point, feature)) {
          foundRegion = feature.properties.name;
          break;
        }
      }
    }

    return {
      district: foundDistrict,
      region: foundRegion,
      category,
      polygonValidated: !!foundDistrict,
      accuracy: foundDistrict ? 'exact' : (foundRegion ? 'rough' : 'none'),
      electoralArea,
      planningSector,
      assemblyZone,
      zoning
    };
  } catch (error) {
    console.error('[DistrictPolygonEngine] Validation error:', error);
    return {
      district: null,
      region: null,
      category: null,
      polygonValidated: false,
      accuracy: 'none'
    };
  }
}
