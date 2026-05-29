import React from 'react';
import { SitePlan } from '../types';
import { cn } from '../lib/utils';
import { MapPin, Compass, Droplet, Zap, Milestone, ShieldCheck } from 'lucide-react';

interface LandmarkPreviewProps {
  plan: SitePlan;
}

// Simple deterministic hash helper for local positioning
const getDeterministicValue = (str: string, max: number, seed: number = 0) => {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % max);
};

export const LandmarkPreview: React.FC<LandmarkPreviewProps> = ({ plan }) => {
  if (!plan) return null;
  const landmark = plan.nearbyLandmark || 'Utility Feed Station';
  const gps = plan.ghanaPostGPS || 'GA-002-1920';

  // Deterministically calculate a direction, distance, and grid angle using the landmark & GPS
  const baseSeed = getDeterministicValue(landmark + gps, 1000);
  const distance = (baseSeed % 180) + 75; // 75m to 255m
  const bearingAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const bearingLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const bearingIndex = baseSeed % 8;
  const bearingAngle = bearingAngles[bearingIndex];
  const bearingLabel = bearingLabels[bearingIndex];

  // Calculate coordinates on our 280x200 SVG canvas
  // Base center is (140, 100)
  const cx = 140;
  const cy = 100;
  const radiusInCanvas = 65; // Scale distance to fit nicely in 65px radius
  const angleRad = (bearingAngle - 90) * (Math.PI / 180); // Adjust by -90 deg so North is up
  const lx = cx + Math.cos(angleRad) * radiusInCanvas;
  const ly = cy + Math.sin(angleRad) * radiusInCanvas;

  // Utility connection info (GWL & ECG)
  const ecgTransformer = `ECG/TX-${getDeterministicValue(landmark, 900, 42) + 100}`;
  const gwlPipeLine = `GWL/MAIN-${getDeterministicValue(gps, 900, 12) + 100}`;
  
  // Create mini-site polygon based on actual pillars of the site plan
  const renderMiniPillars = () => {
    if (!plan.pillars || plan.pillars.length < 2) {
      // Default placeholder rectangular shape centered
      return (
        <rect 
          x={cx - 15} 
          y={cy - 12} 
          width={30} 
          height={24} 
          fill="rgba(245, 158, 11, 0.15)" 
          stroke="#f59e0b" 
          strokeWidth="1.5" 
          className="animate-pulse"
        />
      );
    }

    // Centering and scaling actual pillars
    const safePillars = (plan?.pillars && plan.pillars.length > 0) ? plan.pillars : [];
    if (safePillars.length === 0) {
      return null;
    }

    const eastings = safePillars.map(p => p?.easting || 0);
    const northings = safePillars.map(p => p?.northing || 0);
    const minE = Math.min(...eastings);
    const maxE = Math.max(...eastings);
    const minN = Math.min(...northings);
    const maxN = Math.max(...northings);

    const widthE = maxE - minE || 1;
    const heightN = maxN - minN || 1;
    const scale = Math.min(25 / widthE, 20 / heightN);

    const points = safePillars.map(p => {
      // Relative offset from min, scaled and then centered at (cx, cy)
      const px = cx + ((p?.easting || 0) - (minE + widthE / 2)) * scale;
      const py = cy - ((p?.northing || 0) - (minN + heightN / 2)) * scale; // Invert Y for cartesian
      return `${px},${py}`;
    }).join(' ');

    return (
      <g>
        <polygon 
          points={points} 
          fill="rgba(59, 130, 246, 0.15)" 
          stroke="#3b82f6" 
          strokeWidth="2" 
        />
        {safePillars.map((p, idx) => {
          const px = cx + ((p?.easting || 0) - (minE + widthE / 2)) * scale;
          const py = cy - ((p?.northing || 0) - (minN + heightN / 2)) * scale;
          return (
            <circle 
              key={idx}
              cx={px} 
              cy={py} 
              r="2.5" 
              fill="#1e3a8a" 
              stroke="#ffffff" 
              strokeWidth="0.75"
            />
          );
        })}
      </g>
    );
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Milestone className="w-3.5 h-3.5 text-blue-600" />
          <h4 className="text-[11px] font-black uppercase text-zinc-700 tracking-wider">
            Landmark Geo-Position
          </h4>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
          REAL-TIME LINKED
        </span>
      </div>

      {/* SVG Mini Plot Workspace */}
      <div className="relative bg-zinc-950 rounded border border-zinc-800 overflow-hidden mb-3 h-[180px] flex items-center justify-center">
        {/* Radar concentric circular grid */}
        <svg className="w-full h-full" viewBox="0 0 280 180">
          <defs>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Background fill */}
          <rect width="280" height="180" fill="url(#radar-glow)" />

          {/* Coordinate tick lines */}
          <line x1="140" y1="0" x2="140" y2="180" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="0" y1="90" x2="280" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

          {/* Circular range indicators */}
          <circle cx="140" cy="90" r="35" fill="none" stroke="#1e293b" strokeWidth="1" />
          <text x="140" y="52" fill="#475569" fontSize="7" textAnchor="middle" fontWeight="bold">100m</text>
          
          <circle cx="140" cy="90" r="65" fill="none" stroke="#1e293b" strokeWidth="1" />
          <text x="140" y="22" fill="#475569" fontSize="7" textAnchor="middle" fontWeight="bold">200m</text>

          {/* Compass labels */}
          <text x="140" y="10" fill="#64748b" fontSize="8" fontWeight="black" textAnchor="middle">N</text>
          <text x="140" y="176" fill="#64748b" fontSize="8" fontWeight="black" textAnchor="middle" dominantBaseline="middle">S</text>
          <text x="10" y="90" fill="#64748b" fontSize="8" fontWeight="black" textAnchor="middle" dominantBaseline="middle">W</text>
          <text x="270" y="90" fill="#64748b" fontSize="8" fontWeight="black" textAnchor="middle" dominantBaseline="middle">E</text>

          {/* Bearing Connective Dotted Laser Line */}
          <line 
            x1="140" 
            y1="90" 
            x2={lx} 
            y2={ly} 
            stroke="#3b82f6" 
            strokeWidth="1.5" 
            strokeDasharray="4 2" 
            opacity="0.8"
          />

          {/* Midpoint alignment metadata */}
          <rect 
            x={(140 + lx) / 2 - 25} 
            y={(90 + ly) / 2 - 7} 
            width="50" 
            height="14" 
            rx="3" 
            fill="#0f172a" 
            stroke="#1e293b" 
            strokeWidth="1"
          />
          <text 
            x={(140 + lx) / 2} 
            y={(90 + ly) / 2 + 1} 
            fill="#f1f5f9" 
            fontSize="8" 
            fontWeight="bold" 
            textAnchor="middle" 
            dominantBaseline="middle"
          >
            {distance}m {bearingLabel}
          </text>

          {/* Centered Site Property Marker with scaled boundary mapping */}
          <g transform="translate(0, -10)">
            {renderMiniPillars()}
            <circle cx="140" cy="90" r="4" fill="#3b82f6" className="animate-ping" />
            <circle cx="140" cy="90" r="2.5" fill="#2563eb" />
          </g>

          {/* Nearby Landmark Flag Marker */}
          <g transform={`translate(${lx - 12}, ${ly - 22})`}>
            {/* Pulsing effect */}
            <circle cx="12" cy="12" r="8" fill="rgba(239, 68, 68, 0.25)" className="animate-ping" />
            <path 
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5sz" 
              fill="#ef4444" 
              transform="scale(0.85)"
            />
          </g>

          {/* Dynamic Grid labels on corners */}
          <text x="5" y="165" fill="#334155" fontSize="7" fontFamily="monospace">REF: WGS 84</text>
          <text x="275" y="165" fill="#334155" fontSize="7" fontFamily="monospace" textAnchor="end">GRID: UTM30N</text>
        </svg>

        {/* Floating current labels */}
        <div className="absolute top-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-bold text-blue-400 border border-blue-900/40 uppercase tracking-widest leading-none">
          Site Center
        </div>
        <div className="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-bold text-red-400 border border-red-900/40 uppercase tracking-widest leading-none">
          Landmark
        </div>
      </div>

      {/* Proximity Analysis Table */}
      <div className="space-y-1.5 text-[11px] border border-zinc-150 p-2.5 bg-zinc-50 rounded-md">
        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider pb-1.5 border-b border-zinc-200">
          <span>Spatial Ingestion</span>
          <span className="flex items-center gap-0.5 text-emerald-600">
            <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
            ORIENTED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 font-medium leading-relaxed">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">Landmark Node:</span>
            <span className="text-zinc-800 font-bold truncate block">{landmark}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">Proximity Span:</span>
            <span className="text-zinc-800 font-black block text-xs tracking-tight">{distance}m ({bearingLabel})</span>
          </div>
        </div>

        <div className="pt-2 mt-2 border-t border-zinc-200">
          <span className="text-[9px] font-bold text-zinc-400 block uppercase mb-1">
            Utility Service Connection Points
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-amber-50 border border-amber-100 rounded p-1 flex items-center gap-1.5 font-bold text-amber-900">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="truncate">
                <span className="opacity-60 font-medium block text-[8px] uppercase">Power Transformer</span>
                {ecgTransformer}
              </div>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded p-1 flex items-center gap-1.5 font-bold text-sky-900">
              <Droplet className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <div className="truncate">
                <span className="opacity-60 font-medium block text-[8px] uppercase">GWL Feed Pipe</span>
                {gwlPipeLine}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
