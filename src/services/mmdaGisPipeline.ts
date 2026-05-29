import { validateDistrict, DistrictValidation } from './districtPolygonEngine';
import { normalizeLocality } from '../data/mmda/localities/ghanaLocalities';
import { normalizeStreetName } from './roadNormalizationEngine';
import { GHANA_MMDA_METADATA, MMDAInfo } from '../lib/ghanaMunicipalityMetadata';
import { parseGhanaPostPrefix, DistrictCodeInfo } from '../lib/ghanaPostDistrictCodes';

export interface MMDAEnrichmentResult {
  district: string;
  municipality: string;
  region: string;
  locality: string;
  streetName: string;
  metadata: MMDAInfo | null;
  spatial: DistrictValidation;
  prefixInfo: DistrictCodeInfo | null;
  timestamp: string;
  isEnriched: boolean;
  source: 'spatial_memory' | 'district_prefix' | 'polygon_validation' | 'reverse_geocoding' | 'locality_clusters';
}

export function enrichWithMMDAGIS(
  lat: number, 
  lng: number, 
  localityInput: string, 
  streetInput: string,
  gpsAddress: string = "",
  fallbackRegion: string = "",
  fallbackDistrict: string = ""
): MMDAEnrichmentResult {
  console.log(`[MMDAGIS] Starting Ingestion Pipeline for: ${lat}, ${lng} (${gpsAddress})`);
  
  let source: MMDAEnrichmentResult['source'] = 'reverse_geocoding';
  
  // 1. GhanaPost District Prefix Engine (High Priority)
  const { prefix, info: prefixInfo } = parseGhanaPostPrefix(gpsAddress);
  if (prefixInfo) {
    console.log(`[DistrictPrefix] Official prefix detected: ${prefix}. District: ${prefixInfo.district}`);
    source = 'district_prefix';
  }

  // 2. Spatial Polygon Validation
  const spatial = validateDistrict(lat, lng);
  if (spatial.polygonValidated) {
    console.log(`[MMDAGIS] District polygon validated: ${spatial.district}`);
    // If prefix engine didn't catch it, polygon validation might be more precise
    if (source === 'reverse_geocoding') source = 'polygon_validation';
  }

  if (spatial.electoralArea) {
    console.log(`[MMDAGIS] Electoral area validated: ${spatial.electoralArea} (${spatial.assemblyZone})`);
  }
  if (spatial.planningSector) {
    console.log(`[MMDAGIS] Planning sector validated: ${spatial.planningSector} (Zoning: ${spatial.zoning})`);
  }

  // 3. Metadata Enrichment
  const municipalityKey = spatial.district || prefixInfo?.district || "";
  const metadata = GHANA_MMDA_METADATA[municipalityKey] || null;
  if (metadata) {
    console.log(`[MMDAGIS] Municipality metadata enriched: ${metadata.name}`);
  }

  // 4. Locality Normalization
  const normalizedLocality = normalizeLocality(localityInput);
  if (normalizedLocality !== localityInput) {
    console.log(`[MMDAGIS] Locality alias resolved: ${localityInput} → ${normalizedLocality}`);
  }

  // 5. Street Normalization
  const normalizedStreet = normalizeStreetName(streetInput);
  if (normalizedStreet !== streetInput) {
    console.log(`[MMDAGIS] Road normalized: ${streetInput} → ${normalizedStreet}`);
  }

  return {
    district: prefixInfo?.district || spatial.district || fallbackDistrict || "Pending Validation",
    municipality: prefixInfo?.municipality || metadata?.name || spatial.district || fallbackDistrict || "Unassigned MMDA",
    region: prefixInfo?.region || spatial.region || fallbackRegion || "Unknown Region",
    locality: normalizedLocality,
    streetName: normalizedStreet,
    metadata,
    spatial,
    prefixInfo,
    timestamp: new Date().toISOString(),
    isEnriched: true,
    source
  };
}
