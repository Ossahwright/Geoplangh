export interface LocalityContext {
  name: string;
  type: 'town' | 'village' | 'suburb' | 'community' | 'settlement';
  aliases?: string[];
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  landmarks?: string[];
  roads?: string[];
}

export interface DistrictInfrastructure {
  code: string; // GhanaPost Prefix (e.g., GA, GS, AK)
  districtName: string;
  region: string;
  category: 'Metropolitan' | 'Municipal' | 'District';
  localities: LocalityContext[];
  osmContext?: {
    placeId?: string;
    boundaryId?: string;
  };
}

export interface NationalLocalityRegistry {
  [prefix: string]: DistrictInfrastructure;
}
