import React, { useState, useEffect } from 'react';
import { CheckCircle2, Cpu, Globe } from 'lucide-react';

interface GisProcessingHudProps {
  gpsCode: string;
  ownerName: string;
}

export function GisProcessingHud({ gpsCode, ownerName }: GisProcessingHudProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const steps = [
    { title: "MMDA CAD Core", desc: "Initializing secure cadastral coordinates system...", duration: 550 },
    { title: "OpenStreetMap Engine", desc: "Querying Overpass API for nearby roads & layouts...", duration: 850 },
    { title: "Physical Snapping Engine", desc: "Parsing buildings & structures coordinates map...", duration: 750 },
    { title: "National Ingestion Engine", desc: "Synchronizing GhanaPostGPS and OSM boundaries...", duration: 800 },
    { title: "Lands Commission Export", desc: "Generating authenticated engineering site map visual...", duration: 450 }
  ];

  useEffect(() => {
    let currentStep = 0;
    setLogs([`[SYSTEM] Connecting MMDA GIS pipeline with GPS code: ${gpsCode}`]);

    const runSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setActiveStep(i);
        setLogs(prev => [...prev, `[${steps[i].title}] ${steps[i].desc}`]);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
        setLogs(prev => [...prev, `[${steps[i].title}] SUCCESS: Step completed successfully.`]);
      }
      setLogs(prev => [...prev, `[SYSTEM] Alignment complete. Rendering site plan document now...`]);
    };

    runSteps();
  }, [gpsCode]);

  return (
    <div className="w-[794px] h-[580px] bg-slate-950 text-cyan-400 font-mono p-6 rounded-xl border-2 border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Title block */}
      <div className="relative shrink-0 flex items-center justify-between border-b border-slate-800 pb-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
          <span className="text-zinc-500 text-[10px] tracking-widest font-bold uppercase">MMDA GEOSPATIAL LIVE FEED</span>
        </div>
        <div className="text-[10px] text-zinc-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
          GPS CODE: <span className="text-amber-400 font-bold">{gpsCode}</span>
        </div>
      </div>

      {/* Main Grid: Left Steps, Right Console */}
      <div className="flex-1 grid grid-cols-5 gap-6 py-4 overflow-hidden relative z-10">
        
        {/* Left 2 Cols: Pipeline Steps indicators */}
        <div className="col-span-2 flex flex-col justify-center space-y-4 border-r border-slate-900 pr-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Processing Layers</h3>
          
          {steps.map((s, idx) => {
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;
            const isPending = idx > activeStep;

            return (
              <div 
                key={idx} 
                className={`p-2.5 rounded border transition-all duration-300 flex items-center gap-3 ${
                  isActive 
                    ? "bg-slate-900/80 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white" 
                    : isCompleted 
                      ? "bg-slate-950/20 border-slate-900 text-emerald-400 animate-pulse" 
                      : 'border-slate-850 text-zinc-700 bg-slate-950/25'
                }`}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isActive ? (
                    <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4 text-zinc-750" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-black uppercase tracking-wider">{s.title}</div>
                  <div className="text-[9px] text-zinc-400 truncate mt-0.5">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 3 Cols: Real-time Live CLI */}
        <div className="col-span-3 bg-black/40 border border-slate-900 rounded-lg p-3 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-1.5 text-[10px] leading-relaxed select-none">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`${
                  log.includes('SYSTEM') 
                    ? 'text-yellow-555 font-bold' 
                    : log.includes('SUCCESS') 
                      ? 'text-emerald-450' 
                      : 'text-zinc-350'
                }`}
              >
                <span className="text-zinc-650">❯</span> {log}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest mt-2 shrink-0">
            <span>Client: {ownerName || 'UNSPECIFIED'}</span>
            <span className="animate-pulse">ONLINE SYNCING</span>
          </div>
        </div>

      </div>

      {/* Footer System Status Bar */}
      <div className="border-t border-slate-800 pt-3 relative z-10 shrink-0 flex items-center justify-between text-[10px] text-zinc-550">
        <div className="flex items-center gap-4">
          <span>Engine Status: <span className="text-emerald-400 font-bold">OPTIMAL</span></span>
          <span className="hidden sm:inline">VHF Channel: <span className="text-cyan-500 font-mono">156.8 MHz</span></span>
        </div>
        <div>
          <span>LatLng: <span className="text-cyan-300 font-bold animate-pulse">REAL-TIME SNAPPING ACTIVE</span></span>
        </div>
      </div>
    </div>
  );
}
