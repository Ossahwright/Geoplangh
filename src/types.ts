export interface Pillar {
  id: string;
  easting: number;
  northing: number;
  bearing: string;
  distance: number;
}

export interface SitePlan {
  id: string;
  createdAt: string;
  ownerName: string;
  contactDetails: string;
  region: string;
  district: string;
  locality: string;
  streetName: string;
  ghanaPostGPS: string;
  acreage: number;
  hectares: number;
  plotShape: 'square' | 'rectangle' | 'irregular';
  pillars: Pillar[];
  scale: string;
  lat?: number;
  lng?: number;
  nearbyLandmark?: string;
  accessPathType?: string;
  cadastralSector?: string;
  surveyZone?: string;
  gisData?: {
    municipality: string;
    isEnriched: boolean;
    spatialAccuracy: string;
    polygonValidated: boolean;
    electoralArea?: string;
    planningSector?: string;
    assemblyZone?: string;
    zoning?: string;
    source?: string;
    authoritativeSource?: string;
    spatialMemoryState?: string;
  };
  generatedContext?: {
    roads: { name: string }[];
    buildings: { name: string }[];
    landmarks: { name: string }[];

  };
  osmData?: {
    ways: Array<{ id: number; type: string; name?: string; points: Array<[number, number]> }>;
    nodes: Array<{ id: number; type: string; name?: string; lat: number; lon: number }>;
  };
  userId?: string;
}
