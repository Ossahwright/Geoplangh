import { GisAuditEngine } from './gisAuditEngine';

export type ConfidenceState = 'SYSTEM INFERRED' | 'VERIFIED' | 'HIGHLY VERIFIED' | 'AUTHORITATIVE';

export interface SpatialRecord {
  lat: number;
  lng: number;
  confidenceState: ConfidenceState;
  refinementCount: number;
  lastRefinedBy: string;
  metadata: any;
}

export class NationalSpatialMemoryEngine {
  private static STORAGE_KEY = 'geoplan_national_spatial_memory_tier5';

  static loadMemory(): Record<string, SpatialRecord> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static getRecord(gpsCode: string): SpatialRecord | null {
    const memory = this.loadMemory();
    return memory[gpsCode] || null;
  }

  static persistRefinement(
    gpsCode: string,
    lat: number,
    lng: number,
    metadata: any = {}
  ): SpatialRecord {
    const memory = this.loadMemory();
    const existing = memory[gpsCode];
    
    let newCount = (existing?.refinementCount || 0) + 1;
    let newState: ConfidenceState = 'VERIFIED';
    
    if (newCount > 5) newState = 'AUTHORITATIVE';
    else if (newCount > 2) newState = 'HIGHLY VERIFIED';

    const newRecord: SpatialRecord = {
      lat,
      lng,
      confidenceState: newState,
      refinementCount: newCount,
      lastRefinedBy: 'User_Refinement',
      metadata: { ...(existing?.metadata || {}), ...metadata }
    };

    memory[gpsCode] = newRecord;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memory));

    GisAuditEngine.log('SpatialMemory', `Verified record updated for ${gpsCode}. State: ${newState}`);
    return newRecord;
  }
}
