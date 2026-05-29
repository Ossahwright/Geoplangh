export interface GisAuditLog {
  timestamp: string;
  subsystem: 'GeoPlan' | 'OSM' | 'MMDA' | 'SpatialMemory' | 'StreetEngine';
  message: string;
  metadata?: any;
}

export class GisAuditEngine {
  private static logs: GisAuditLog[] = [];

  static log(subsystem: GisAuditLog['subsystem'], message: string, metadata?: any) {
    const logEntry: GisAuditLog = {
      timestamp: new Date().toISOString(),
      subsystem,
      message,
      metadata
    };
    this.logs.push(logEntry);
    
    // Console example as requested
    console.log(`[${subsystem}] ${message}`, metadata || '');
  }

  static getLogs(): GisAuditLog[] {
    return [...this.logs];
  }
}
