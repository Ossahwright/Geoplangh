export function normalizeStreetName(name: string): string {
  if (!name) return "";
  
  let normalized = name.trim()
    .replace(/\bRd\.?\b/gi, "Road")
    .replace(/\bSt\.?\b/gi, "Street")
    .replace(/\bAve\.?\b/gi, "Avenue")
    .replace(/\bDr\.?\b/gi, "Drive")
    .replace(/\bLn\.?\b/gi, "Lane")
    .replace(/\bCresc\.?\b/gi, "Crescent")
    .replace(/\bWay\b/gi, "Way")
    .replace(/\bJunc\.?\b/gi, "Junction");
    
  // Specific Ghana road common patterns
  normalized = normalized
    .replace(/\bBoundary Rd\b/gi, "Boundary Road")
    .replace(/\bSpintex Rd\b/gi, "Spintex Road")
    .replace(/\bN1 Hwy\b/gi, "N1 Highway");
    
  return normalized;
}
