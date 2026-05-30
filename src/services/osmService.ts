export async function fetchOSMData(lat: number, lng: number, radius: number = 300) {
  // Query roads, buildings, and POIs around lat, lng
  const overpassQuery = `
    [out:json][timeout:25];
    (
      way["highway"](around:${radius},${lat},${lng});
      way["building"](around:${radius},${lat},${lng});
      node["amenity"](around:${radius},${lat},${lng});
      node["place"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch('https://overpass.kumi.systems/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });
    
    if (!response.ok) {
      console.error("Overpass API returned an error:", response.status);
      return null;
    }
    
    const data = await response.json();
    return processOverpassData(data);
  } catch (err) {
    console.error("Failed to fetch OSM data", err);
    return null;
  }
}

export function latLngToLocal(lat: number, lon: number, centerLat: number, centerLon: number, centerEasting: number, centerNorthing: number): [number, number] {
  // Approximate conversion: 1 degree latitude = ~111,320 meters
  // 1 degree longitude = ~111,320 * cos(latitude) meters
  const latDiff = lat - centerLat;
  const lonDiff = lon - centerLon;
  
  const metersPerLat = 111320;
  const metersPerLon = 111320 * Math.cos(centerLat * Math.PI / 180);
  
  const e = centerEasting + lonDiff * metersPerLon;
  const n = centerNorthing + latDiff * metersPerLat;
  
  return [e, n];
}

function processOverpassData(data: any) {
  const nodesMap = new Map<number, {lat: number, lon: number, tags?: any}>();
  const ways: Array<{id: number, type: string, name?: string, points: Array<[number, number]>, tags?: any}> = [];
  const nodes: Array<{id: number, type: string, name?: string, lat: number, lon: number, tags?: any}> = [];

  // Map nodes
  for (const element of data.elements) {
    if (element.type === 'node') {
      nodesMap.set(element.id, { lat: element.lat, lon: element.lon, tags: element.tags });
      if (element.tags && (element.tags.amenity || element.tags.place || element.tags.name)) {
        nodes.push({
          id: element.id,
          type: element.tags.place ? 'place' : (element.tags.amenity ? 'amenity' : 'poi'),
          name: element.tags.name || element.tags.amenity || element.tags.place || 'POI',
          lat: element.lat,
          lon: element.lon,
          tags: element.tags
        });
      }
    }
  }

  // Map ways
  for (const element of data.elements) {
    if (element.type === 'way') {
      const type = element.tags?.building ? 'building' : (element.tags?.highway ? 'highway' : 'unknown');
      const name = element.tags?.name || '';
      
      const points: Array<[number, number]> = [];
      for (const nodeId of element.nodes) {
        const node = nodesMap.get(nodeId);
        if (node) {
          points.push([node.lat, node.lon]);
        }
      }
      
      if (points.length > 0) {
        ways.push({ id: element.id, type, name, points, tags: element.tags });
      }
    }
  }

  return { ways, nodes };
}
