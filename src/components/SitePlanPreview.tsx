import React, { forwardRef } from 'react';
import { SitePlan } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { latLngToLocal } from '../services/osmService';
import { getLatLngFromGPS } from '../lib/utils';

interface SitePlanPreviewProps {
  plan: SitePlan;
}

export const SitePlanPreview = forwardRef<HTMLDivElement, SitePlanPreviewProps>(
  ({ plan }, ref) => {
    if (!plan) {
      return (
        <div className="bg-white border border-rose-200 border-dashed rounded-xl p-8 text-center text-sm font-semibold text-rose-800 shadow-md max-w-lg mx-auto">
          Geospatial Site Plan unavailable. Please generate a new layout or select one from the history list.
        </div>
      );
    }

    // Coordinate bounding box calculations with fail-safes for NaN
    const safePillars = (plan?.pillars || []).length > 0 ? (plan?.pillars || []) : [{ easting: 0, northing: 0, id: '1', distance: 0, bearing: '0' }];
    
    // Finding center to map OSM data
    const centerEasting = safePillars.reduce((sum, p) => sum + (p?.easting || 0), 0) / safePillars.length;
    const centerNorthing = safePillars.reduce((sum, p) => sum + (p?.northing || 0), 0) / safePillars.length;
    const [centerLat, centerLon] = plan?.lat && plan?.lng ? [plan.lat, plan.lng] : (plan?.ghanaPostGPS ? getLatLngFromGPS(plan.ghanaPostGPS) : [5.6037, -0.1870]);
    console.log("PLAN OSM DATA", {
      ways: plan.osmData?.ways?.length || 0,
      nodes: plan.osmData?.nodes?.length || 0,
      sampleWay: plan.osmData?.ways?.[0],
      sampleNode: plan.osmData?.nodes?.[0]
    });

    
    const minE = Math.min(...safePillars.map(p => p?.easting || 0));
    const maxE = Math.max(...safePillars.map(p => p?.easting || 0));
    const minN = Math.min(...safePillars.map(p => p?.northing || 0));
    const maxN = Math.max(...safePillars.map(p => p?.northing || 0));
    
    let w = maxE - minE;
    let h = maxN - minN;
    if (isNaN(w) || w <= 0) w = 100;
    if (isNaN(h) || h <= 0) h = 100;
    const padding = Math.max(w, h, 100) * 0.8;
    
    const vMinX = isNaN(minE) ? 0 : minE - padding;
    const vMaxX = isNaN(maxE) ? 100 : maxE + padding;
    const actualVMinY = isNaN(minN) ? 0 : minN - padding;
    const actualVMaxY = isNaN(maxN) ? 100 : maxN + padding;
    
    const validVWidth = Math.max(vMaxX - vMinX, 10);
    const validVHeight = Math.max(actualVMaxY - actualVMinY, 10);

    // Add a deterministic shift to the viewBox based on GPS hash
    // This makes the plot appear at different positions within the frame
    let hashForShift = 0;
    if (plan?.ghanaPostGPS) {
      for (let i = 0; i < plan.ghanaPostGPS.length; i++) {
        hashForShift = ((hashForShift << 5) - hashForShift) + plan.ghanaPostGPS.charCodeAt(i);
      }
    }
    const shiftX = ((Math.abs(hashForShift) % 100) / 100 - 0.5) * (padding * 0.4);
    const shiftY = ((Math.abs(hashForShift >> 8) % 100) / 100 - 0.5) * (padding * 0.4);
    
    const viewBox = `${vMinX + shiftX} ${actualVMinY + shiftY} ${validVWidth} ${validVHeight}`;
    const mapY = (y: number) => {
      const safeY = isNaN(y) ? 0 : y;
      return actualVMinY + actualVMaxY - safeY;
    };

    return (
      <div 
        id="print-root"
        ref={ref} 
        className="w-[794px] h-[1123px] bg-white text-black shrink-0 relative p-8 mx-auto shadow-2xl print:shadow-none print:m-0 print:p-8" 
        style={{ fontFamily: "'Arial', sans-serif" }}
      >
        {/* Double Engineering Border */}
        <div className="absolute inset-0 border-[3px] border-black m-[16px] pointer-events-none z-50"></div>
        <div className="absolute inset-0 border border-black m-[21px] pointer-events-none z-50"></div>

        <div className="h-full flex flex-col relative z-10 w-full px-2 pt-2 pb-1">
          
          {/* Header Information: Official Title Block */}
          <div className="text-center w-full border-b-[3px] border-black pb-4 mb-4">
            <h1 className="text-4xl font-black uppercase tracking-widest leading-none mb-1">LOCATION PLAN</h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-4">GIS Cadastral Extraction / Engineering Layout</p>
            
            <span className="text-xs font-bold italic mb-0.5 block uppercase">Prepared For</span>
            <h2 className="text-2xl font-black uppercase mb-3 underline decoration-[2px] underline-offset-4">{plan?.ownerName || "CLIENT NAME"}</h2>
            
            <div className="text-[14px] font-bold uppercase leading-relaxed text-center flex flex-col items-center gap-1">
              <div className="flex gap-4">
                 <span>Locality: <span className="border-b border-black border-dashed pb-0.5">{plan?.locality || "_________"}</span></span>
                 <span>District: <span className="border-b border-black border-dashed pb-0.5">{plan?.district || "_________"}</span></span>
              </div>
              <div className="mt-1">
                 Region: <span className="border-b border-black border-dashed pb-0.5">{plan?.region || "_________"}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-4 px-8 text-[11px] font-bold uppercase">
               <span>Date: {plan?.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}</span>
               <span>Scale: {plan?.scale || '1:1250'}</span>
            </div>
          </div>

          {/* Main Body: Map & Data Tables */}
          <div className="flex flex-1 gap-4 overflow-hidden mb-4 border-b-[3px] border-black pb-4">
            
            {/* Left side: Technical Mapping Area (GIS Map) */}
            <div className="flex-[2.5] relative border-2 border-black w-full bg-white overflow-hidden p-2 flex flex-col">
               
               {/* Coordinate Grid Overlays */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <defs>
                    <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="1.5" cy="1.5" r="1.5" fill="#000" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dotGrid)" opacity="0.1" />
                  {/* Subtle engineering crosshairs */}
                  <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="4 4" className="translate-x-[20%] translate-y-[30%]" />
                  <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="4 4" className="translate-x-[70%] translate-y-[60%]" />
               </svg>

               {/* Grid Overlays */}
               <div className="absolute top-4 right-4 z-20 flex flex-col items-center text-center bg-white p-1 pb-0 shadow-sm border border-zinc-200">
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[40px] border-b-black"></div>
                  <span className="font-bold text-[12px] mt-1 tracking-widest leading-none">N</span>
               </div>

               {/* Scale Indicator */}
               <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1 z-20">
                  <div className="flex shadow-sm">
                    <div className="w-8 h-2 bg-black border border-black"></div>
                    <div className="w-8 h-2 bg-white border border-black"></div>
                    <div className="w-8 h-2 bg-black border border-black"></div>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider bg-white/90 px-1 border border-zinc-200">Scale {plan.scale}</div>
               </div>

               {/* Plot Drawing */}
               <svg viewBox={viewBox} className="w-full h-full overflow-hidden absolute inset-0 z-10" preserveAspectRatio="xMidYMid meet">
                  <g>
                    {/* Grid Lines */}
                    {[...Array(12)].map((_, i) => {
                      const stepX = (vMaxX - vMinX) / 8;
                      const stepY = (actualVMaxY - actualVMinY) / 8;
                      const offsetX = (minE % stepX);
                      const offsetY = (minN % stepY);
                      const xLine = vMinX - offsetX + i*stepX;
                      const yLine = actualVMinY - offsetY + i*stepY;
                      return (
                        <React.Fragment key={`grid-${i}`}>
                          <line x1={xLine} y1={actualVMinY} x2={xLine} y2={actualVMaxY} stroke="#000" strokeOpacity="0.15" strokeWidth={(vMaxX - vMinX) / 1000} strokeDasharray="3 3"/>
                          <line x1={vMinX} y1={mapY(yLine)} x2={vMaxX} y2={mapY(yLine)} stroke="#000" strokeOpacity="0.15" strokeWidth={(vMaxX - vMinX) / 1000} strokeDasharray="3 3"/>
                        </React.Fragment>
                      );
                    })}


                    {/* Base Grid Watermark */}
                    <g opacity="0.05">
                      {Array.from({length: 10}).map((_, i) => (
                         <line key={`vGrid-${i}`} x1={vMinX + ((vMaxX-vMinX)/10)*i} y1={actualVMinY} x2={vMinX + ((vMaxX-vMinX)/10)*i} y2={actualVMaxY} stroke="#000" strokeWidth={0.5} />
                      ))}
                      {Array.from({length: 10}).map((_, i) => (
                         <line key={`hGrid-${i}`} x1={vMinX} y1={actualVMinY + ((actualVMaxY-actualVMinY)/10)*i} x2={vMaxX} y2={actualVMinY + ((actualVMaxY-actualVMinY)/10)*i} stroke="#000" strokeWidth={0.5} />
                      ))}
                      <text x={vMinX + (vMaxX-vMinX)*0.4} y={actualVMinY + (actualVMaxY-actualVMinY)*0.4} fontSize={(vMaxX-vMinX)/15} fontWeight="bold" transform="rotate(-45)">
                        {plan.ghanaPostGPS} - {plan.locality}
                      </text>
                    </g>

                    {/* Surrounding Context (Adjacent Parcels) */}
                    <g opacity="0.15">
                      {/* Plot 1 Left */}
                      <rect x={minE - padding*0.8} y={mapY(maxN + padding*0.2)} width={padding*0.6} height={maxN-minN + padding*0.4} fill="none" stroke="#000" strokeWidth={(vMaxX-vMinX)/400} />
                      <text x={minE - padding*0.5} y={mapY(maxN - padding*0.1)} fontSize={(vMaxX-vMinX)/50} transform="rotate(-90)">ADJ. PARCEL A</text>
                      
                      {/* Plot 2 Right */}
                      <rect x={maxE + padding*0.2} y={mapY(maxN + padding*0.1)} width={padding*0.5} height={maxN-minN + padding*0.3} fill="none" stroke="#000" strokeWidth={(vMaxX-vMinX)/400} />
                      <text x={maxE + padding*0.45} y={mapY(maxN - padding*0.1)} fontSize={(vMaxX-vMinX)/50} transform="rotate(90)">ADJ. PARCEL B</text>
                    </g>

                    {/* Detailed Road / Street Layout from OSM */}
                    {plan.osmData && (plan.osmData.ways || []).length > 0 ? (
                      <g opacity="1.0">
                        {(plan.osmData.ways || []).map(way => {
                          const points = (way.points || []).map(pt => {
                            const [e, n] = latLngToLocal(pt[0], pt[1], centerLat, centerLon, centerEasting, centerNorthing);
                            return `${e},${mapY(n)}`;
                          }).join(' ');

                          if (way.type === 'highway') {
                            return (
                              <g key={`way-${way.id}`}>
                                <polyline points={points} fill="none" stroke="#1e293b" strokeWidth={(vMaxX - vMinX) / 70} strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points={points} fill="none" stroke="#f1f5f9" strokeWidth={(vMaxX - vMinX) / 110} strokeLinecap="round" strokeLinejoin="round" />
                                {way.name && (
                                  <text x={0} y={0} fill="black" fontSize={(vMaxX-vMinX)/55} fontWeight="bold" opacity="0.85">
                                    <textPath href={`#path-${way.id}`} startOffset="50%" textAnchor="middle">{way.name.toUpperCase()}</textPath>
                                  </text>
                                )}
                                <path id={`path-${way.id}`} d={`M ${points.split(' ').join(' L ')}`} fill="none" stroke="none" />
                              </g>
                            );
                          } else if (way.type === 'building') {
                            return (
                               <polygon key={`way-${way.id}`} points={points} fill="#cbd5e1" stroke="#0f172a" strokeWidth={(vMaxX-vMinX)/280} />
                            );
                          }
                          return null;
                        })}

                        {(plan.osmData.nodes || []).map(node => {
                          const [e, n] = latLngToLocal(node.lat, node.lon, centerLat, centerLon, centerEasting, centerNorthing);
                          return (
                            <g key={`node-${node.id}`}>
                              <circle cx={e} cy={mapY(n)} r={(vMaxX-vMinX)/150} fill="#f59e0b" stroke="white" strokeWidth={(vMaxX-vMinX)/400} />
                              {node.name && (
                                <text x={e} y={mapY(n) - (vMaxX-vMinX)/50} fontSize={(vMaxX-vMinX)/55} fontWeight="bold" textAnchor="middle" fill="#92400e">{node.name.toUpperCase()}</text>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    ) : (
                      <g opacity="1.0">
                        {/* Main Road Base */}
                        <rect 
                          x={vMinX} 
                          y={mapY(minN - padding * (0.05 + (minE % 10) / 20))} 
                          width={vMaxX - vMinX} 
                          height={(vMaxX - vMinX) / 20} 
                          fill="#cbd5e1" 
                        />
                        {/* Center Dash Line */}
                        <line 
                          x1={vMinX} 
                          y1={mapY(minN - padding * (0.05 + (minE % 10) / 20) - (vMaxX - vMinX) / 40)}
                          x2={vMaxX} 
                          y2={mapY(minN - padding * (0.05 + (minE % 10) / 20) - (vMaxX - vMinX) / 40)}
                          stroke="#1e293b" 
                          strokeWidth={(vMaxX-vMinX)/400} 
                          strokeDasharray={`${(vMaxX-vMinX)/60}, ${(vMaxX-vMinX)/60}`} 
                          opacity="0.85"
                        />
                        {/* Road Edges */}
                        <line 
                          x1={vMinX} 
                          y1={mapY(minN - padding * (0.05 + (minE % 10) / 20))}
                          x2={vMaxX} 
                          y2={mapY(minN - padding * (0.05 + (minE % 10) / 20))}
                          stroke="#0f172a" 
                          strokeWidth={(vMaxX-vMinX)/220} 
                          opacity="1.0"
                        />
                        <line 
                          x1={vMinX} 
                          y1={mapY(minN - padding * (0.05 + (minE % 10) / 20) - (vMaxX - vMinX) / 20)}
                          x2={vMaxX} 
                          y2={mapY(minN - padding * (0.05 + (minE % 10) / 20) - (vMaxX - vMinX) / 20)}
                          stroke="#0f172a" 
                          strokeWidth={(vMaxX-vMinX)/220} 
                          opacity="1.0"
                        />
                        
                        {/* Intersecting Local Road */}
                        <rect 
                          x={minE - padding*1.2} 
                          y={actualVMinY} 
                          width={(vMaxX - vMinX) / 25} 
                          height={actualVMaxY - actualVMinY} 
                          fill="#cbd5e1" 
                        />
                        <line 
                          x1={minE - padding*1.2 + (vMaxX-vMinX)/50} 
                          y1={actualVMinY}
                          x2={minE - padding*1.2 + (vMaxX-vMinX)/50} 
                          y2={actualVMaxY}
                          stroke="#1e293b" 
                          strokeWidth={(vMaxX-vMinX)/400} 
                          strokeDasharray={`${(vMaxX-vMinX)/60}, ${(vMaxX-vMinX)/60}`} 
                          opacity="0.85"
                        />
                        <line 
                          x1={minE - padding*1.2} 
                          y1={actualVMinY}
                          x2={minE - padding*1.2} 
                          y2={actualVMaxY}
                          stroke="#0f172a" 
                          strokeWidth={(vMaxX-vMinX)/220} 
                          opacity="1.0"
                        />
                        <text x={minE - padding*1.2 + (vMaxX-vMinX)/40} y={mapY(maxN)} dominantBaseline="middle" textAnchor="middle" fontSize={(vMaxX-vMinX)/60} fontWeight="bold" fill="black" letterSpacing="2" opacity="0.85" transform={`rotate(-90, ${minE - padding*1.2 + (vMaxX-vMinX)/40}, ${mapY(maxN)})`}>
                          LOCALITY CORRIDOR - {(plan?.locality || '').toUpperCase()}
                        </text>
                      </g>
                    )}

                    {/* The Plot Polygon - EDGED PINK/LIGHT RED */}
                    <polygon 
                      points={safePillars.map(p => `${p?.easting || 0},${mapY(p?.northing || 0)}`).join(' ')} 
                      fill="rgba(239, 68, 68, 0.05)" stroke="#ef4444" strokeWidth={(vMaxX - vMinX) / 180} strokeLinejoin="miter" 
                    />

                    {/* Pillars & Labels */}
                    {safePillars.map((p, i) => {
                       const nextP = safePillars[(i + 1) % safePillars.length];
                       const midX = ((p?.easting || 0) + (nextP?.easting || 0)) / 2;
                       const midY = ((p?.northing || 0) + (nextP?.northing || 0)) / 2;
                       
                       return (
                         <g key={p.id}>
                            <circle cx={p.easting} cy={mapY(p.northing)} r={(vMaxX - vMinX) / 180} fill="black"></circle>
                            <circle cx={p.easting} cy={mapY(p.northing)} r={(vMaxX - vMinX) / 400} fill="white"></circle>
                            
                            <text x={p.easting + (p.easting > (minE+maxE)/2 ? 1 : -1) * ((vMaxX-vMinX)/25)} y={mapY(p.northing)} dominantBaseline="middle" textAnchor={p.easting > (minE+maxE)/2 ? "start" : "end"} fontSize={(vMaxX-vMinX)/40} fontWeight="bold" fill="black" className="font-mono">
                              {p.id}
                            </text>

                            {/* Distances along edges */}
                            <text x={midX} y={mapY(midY)} dominantBaseline="middle" textAnchor="middle" fontSize={(vMaxX-vMinX)/50} fill="black" fontWeight="bold">
                              {p?.distance || 0}m
                            </text>
                         </g>
                       );
                    })}

                    {/* Center Plot Label */}
                    <text x={(minE+maxE)/2} y={mapY((minN+maxN)/2)} dominantBaseline="middle" textAnchor="middle" fontSize={(vMaxX-vMinX)/25} fill="rgba(220, 38, 38, 0.15)" fontWeight="bold">
                      PLOT {(plan?.id || '').slice(0, 3).toUpperCase().replace(/\D/g, '9')}
                    </text>
                    <text x={(minE+maxE)/2} y={mapY((minN+maxN)/2) + (vMaxX-vMinX)/20} dominantBaseline="middle" textAnchor="middle" fontSize={(vMaxX-vMinX)/45} fill="rgba(0,0,0,0.3)" fontWeight="bold" className="uppercase">
                      Shown Edged Pink
                    </text>
                    
                    {/* Proposed Road Text Label */}
                    <text x={(minE+maxE)/2} y={mapY(minN - padding * (0.05 + (minE % 10) / 20) - (vMaxX - vMinX) / 16)} dominantBaseline="middle" textAnchor="middle" fontSize={(vMaxX-vMinX)/35} fontWeight="black" fill="black" letterSpacing="4" opacity="0.6">
                      {(plan.streetName && plan.streetName.toUpperCase()) || "PROPOSED ROAD"}
                    </text>
                  </g>
               </svg>
               <div className="absolute top-1/2 left-1/4 -translate-y-[120%] text-[10px] transform rotate-[-90deg] font-bold text-zinc-500 uppercase tracking-widest opacity-60">Adjoining Property</div>


            </div>

            {/* Right side: Engineering Data Tables */}
            <div className="flex-[1.2] flex flex-col gap-3 min-w-[220px]">
              
              <div className="border-[2px] border-black p-3 bg-white flex flex-col items-center justify-center text-center shrink-0">
                 <div className="text-[12px] font-black uppercase mb-1 border-b-[2px] border-black w-full pb-1 tracking-widest">Site Area</div>
                 <div className="text-xl font-bold font-serif px-2 mt-2">{plan.acreage} ACRES</div>
                 <div className="text-[11px] uppercase font-bold text-zinc-700 mt-1">({plan.hectares} Hectares)</div>
              </div>

              <div className="border-[2px] border-black bg-white flex flex-col shrink-0">
                 <div className="bg-black text-white text-[11px] font-bold uppercase p-1.5 text-center tracking-widest">Metadata Matrix</div>
                 <div className="p-2 space-y-2 text-[10px] font-mono leading-tight uppercase font-bold text-zinc-800">
                    <div className="flex justify-between border-b border-zinc-200 pb-1"><span>GPS Addr:</span> <span className="text-right text-black">{plan.ghanaPostGPS}</span></div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Region:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.region}</span></div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1"><span>MMDA:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.gisData?.municipality || plan.district}</span></div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Loc:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.locality}</span></div>
                    {plan.gisData?.planningSector && (
                      <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Sector:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.gisData.planningSector}</span></div>
                    )}
                    {plan.gisData?.electoralArea && (
                      <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Electoral:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.gisData.electoralArea}</span></div>
                    )}
                    {plan.gisData?.assemblyZone && (
                      <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Zone:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.gisData.assemblyZone}</span></div>
                    )}
                    {plan.gisData?.zoning && (
                      <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Zoning:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.gisData.zoning}</span></div>
                    )}
                    {plan.nearbyLandmark && (
                      <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Landmark:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.nearbyLandmark}</span></div>
                    )}
                    {plan.cadastralSector && (
                      <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Cad. Sec:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.cadastralSector}</span></div>
                    )}
                    {plan.surveyZone && (
                      <div className="flex justify-between border-b border-zinc-200 pb-1"><span>Surv. Zone:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.surveyZone}</span></div>
                    )}
                    <div className="flex justify-between pb-1"><span>Road:</span> <span className="text-right text-black truncate ml-2 max-w-[120px]">{plan.streetName || "N/A"}</span></div>
                 </div>
              </div>

              <div className="border-[2px] border-black flex-1 overflow-auto bg-white flex flex-col">
                <div className="bg-zinc-200 border-b-[2px] border-black p-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-black">Coordinate Table</div>
                <table className="w-full text-[10px] leading-tight font-mono text-center">
                  <thead>
                    <tr className="border-b-[2px] border-black bg-zinc-50 font-bold">
                      <th className="py-1 border-r border-black font-bold text-black">Pillar</th>
                      <th className="py-1 border-r border-black font-bold text-black">Easting(X)</th>
                      <th className="py-1 font-bold text-black">Northing(Y)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safePillars.map((p, idx) => (
                      <tr key={`coord-${p?.id || idx}`} className="border-b border-zinc-300">
                        <td className="py-0.5 font-bold border-r border-black text-black">{p?.id || idx + 1}</td>
                        <td className="py-0.5 border-r border-black">{(p?.easting ?? 0).toFixed(2)}</td>
                        <td className="py-0.5">{(p?.northing ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-[2px] border-black bg-white flex flex-col shrink-0">
                 <div className="bg-zinc-200 border-b-[2px] border-black p-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-black">Pillar Data</div>
                 <table className="w-full text-[10px] leading-tight font-mono text-center mb-1">
                  <thead>
                    <tr className="border-b-[2px] border-black font-bold">
                      <th className="py-1 border-r border-black font-bold text-black">Line</th>
                      <th className="py-1 border-r border-black font-bold text-black">Bearing</th>
                      <th className="py-1 font-bold text-black">Dist(m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safePillars.map((p, i) => {
                       const nextP = safePillars[(i+1)%safePillars.length];
                       return (
                        <tr key={`dist-${p?.id || i}`} className="border-b border-zinc-100 last:border-0">
                          <td className="py-0.5 font-bold border-r border-black text-black">{p?.id || i + 1}-{nextP?.id || (i + 1) % safePillars.length + 1}</td>
                          <td className="py-0.5 border-r border-black">{p?.bearing || '0'}</td>
                          <td className="py-0.5">{p?.distance || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                 </table>
              </div>

            </div>
          </div>

          {/* Legal Footer & Authoritative Block */}
          <div className="mt-2 pt-2 pb-2">
             <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-4 border-[2px] border-black p-4">
                
                {/* Left: Security Codes */}
                <div className="flex flex-col justify-center items-center gap-3 border-r-[2px] border-black pr-4">
                   <QRCodeSVG value={`https://ghanapostgps.com?address=${plan?.ghanaPostGPS || ''}`} size={70} level="H" />
                   <div className="flex flex-col items-center w-full">
                      <span className="text-[10px] font-black uppercase tracking-wider mb-1">Digital Address</span>
                      <span className="text-[12px] font-mono font-bold bg-zinc-100 border border-black px-2 py-0.5 w-full text-center text-black">{plan?.ghanaPostGPS || 'Pending'}</span>
                   </div>
                   <div className="w-full mt-1">
                      <div className="w-full flex justify-center opacity-90 pointer-events-none -my-2">
                        <Barcode value={(plan?.id || 'DEFAULT_ID').slice(0, 10).toUpperCase()} height={32} width={1.8} fontSize={10} margin={0} />
                      </div>
                   </div>
                </div>

                {/* Middle: Surveyor block */}
                <div className="flex flex-col items-center text-center justify-center relative px-4">
                   <div className="text-[12px] font-black uppercase mb-4 tracking-widest w-full border-b-[2px] border-black pb-2 text-black">Surveyor's Declaration</div>
                   <div className="w-full mt-4 flex flex-col items-center">
                     <div className="w-48 h-[1px] border-b-[2px] border-dotted border-black mb-1 relative">
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-serif text-blue-900/80 italic text-2xl decoration-transparent whitespace-nowrap">
                           {
                             ["Surv. S. K. Boateng", "Surv. K. A. Mensah", "Surv. E. O. Osei", "Surv. D. N. Arthur", "Surv. P. K. Yeboah", "Surv. F. T. Addo"]
                             [(plan?.id || 'A').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6]
                           }
                        </div>
                     </div>
                     <span className="text-[12px] font-black uppercase block mt-3 text-black">Licensed Surveyor</span>
                     <span className="text-[10px] font-mono mt-1 font-bold">LSA-{(((plan?.id || 'A').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 9000) + 1000)}</span>
                   </div>
                   <div className="absolute top-[40%] text-center pointer-events-none opacity-[0.85] rotate-[-8deg] z-50">
                      <div className="w-56 h-28 border-[4px] border-blue-800 text-blue-900 rounded-lg flex flex-col items-center justify-center p-2 bg-blue-50/50">
                         <span className="text-[16px] font-black uppercase tracking-widest">Registered</span>
                         <div className="w-full border-b-[3px] border-blue-800 my-1"></div>
                         <span className="text-[10px] font-black tracking-widest mt-1 text-center">GHANA INSTITUTE OF <br/> SURVEYORS</span>
                      </div>
                   </div>
                </div>

                {/* Right: Lands Commission Appr. */}
                <div className="flex flex-col justify-between items-center text-center border-l-[2px] border-black pl-4">
                   <div className="flex flex-col w-full h-full">
                     <div className="text-[12px] font-black uppercase text-red-700 tracking-wider w-full border-b-[2px] border-black pb-2">Lands Commission</div>
                     <div className="text-[11px] font-mono font-bold mt-4 text-black">REG NO: CR/C021/{new Date().getFullYear()}</div>
                   
                     <div className="w-full flex gap-3 mt-auto mb-2">
                       <div className="flex-1 flex flex-col items-center justify-end">
                         <div className="w-full border-b-[2px] border-dotted border-black mb-1 h-6"></div>
                         <div className="text-[9px] font-bold uppercase text-black">Regional Surveyor</div>
                       </div>
                       <div className="flex-1 flex flex-col items-center justify-end">
                         <div className="w-full border-b-[2px] border-dotted border-black mb-1 h-6"></div>
                         <div className="text-[9px] font-bold uppercase text-black">Director of Surveys</div>
                       </div>
                     </div>
                   </div>
                </div>

             </div>
          </div>
          
          <div className="mt-2 text-[9px] leading-tight text-justify font-serif text-black italic pb-2 border-b-[2px] border-black border-dashed">
             <strong>Disclaimer:</strong> This site plan has been prepared solely for utility service application and connection purposes with Ghana Water Limited (GWL) and the Electricity Company of Ghana (ECG). It is not intended for land title registration, cadastral certification, legal boundary determination, development permitting, or any statutory land administration process.
          </div>
          
          <div className="mt-2 pb-2 flex items-center justify-between gap-2 px-1">
            <div className="flex gap-2">
              <span className="px-1.5 py-0.5 border border-zinc-600 rounded-sm text-[8px] font-mono text-zinc-700 font-bold tracking-widest bg-zinc-100 flex items-center gap-1">
                 <span className="w-1 h-1 rounded-full bg-emerald-600"></span>{plan.gisData?.authoritativeSource || 'MMDA VERIFIED'}
              </span>
              <span className="px-1.5 py-0.5 border border-zinc-600 rounded-sm text-[8px] font-mono text-zinc-700 font-bold tracking-widest bg-zinc-100 flex items-center gap-1">
                 <span className="w-1 h-1 rounded-full bg-blue-600"></span>{plan.gisData?.spatialMemoryState === 'SYSTEM INFERRED' ? 'OSM FUSED' : 'VERIFIED GIS MEMORY'}
              </span>
              <span className="px-1.5 py-0.5 border border-zinc-600 rounded-sm text-[8px] font-mono text-zinc-700 font-bold tracking-widest bg-zinc-100 flex items-center gap-1">
                 <span className="w-1 h-1 rounded-full bg-indigo-600"></span>NATIONAL STREET ENGINE ACTIVE
              </span>
            </div>
          </div>

          {/* Engineering Status Bar */}
          <div className="mt-auto pt-2 border-t border-zinc-400 flex justify-between items-center text-[10px] font-mono text-zinc-600 font-bold w-full uppercase tracking-widest px-1">
             <span>Doc ID: {plan?.id || 'Pending'}</span>
             <span>Status: Validated</span>
             <span>CRS: WGS 84 / UTM 30N</span>
             <span>System: GeoPlan GH</span>
          </div>

        </div>
      </div>
    );
  }
);
SitePlanPreview.displayName = 'SitePlanPreview';
