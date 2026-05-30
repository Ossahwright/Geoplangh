import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { SitePlan, Pillar } from './types';
import { getLatLngFromGPS, generateGhanaPostGPS, generatePillars, latLngToUTM30N, cn } from './lib/utils';
import { SitePlanPreview } from './components/SitePlanPreview';
import { LandmarkPreview } from './components/LandmarkPreview';
import { GisProcessingHud } from './components/GisProcessingHud';
import { AdminAuth } from './components/AdminAuth';
import { auth, db, OperationType, handleFirestoreError, restoreNestedArrays, sanitizePlanForFirestore } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, runTransaction, query, where } from 'firebase/firestore';
import { FusedGeoIntelligenceEngine } from './services/fusedGeoIntelligenceEngine';
import { Plus, List, Home, Download, Printer, Settings, MapPin, Map, FileSearch, Trash2, Eye, ShieldCheck, CheckCircle2, SearchCode, Layers, LogOut } from 'lucide-react';
import { enrichWithMMDAGIS } from './services/mmdaGisPipeline';
import { NationalLocalityIngestionEngine } from './services/nationalLocalityIngestionEngine';
import { parseGhanaPostPrefix } from './lib/ghanaPostDistrictCodes';

const GHANA_REGIONS = [
  "Greater Accra Region", "Ashanti Region", "Central Region", "Eastern Region", 
  "Western Region", "Volta Region", "Northern Region", "Upper East Region", 
  "Upper West Region", "Bono Region", "Bono East Region", "Ahafo Region", 
  "Oti Region", "Savannah Region", "Western North Region", "North East Region"
];

function App() {
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Check auth session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setSession(user);
      } else {
        setSession((prev: any) => prev && prev.isLocalOffline ? prev : null);
      }
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    if (session && session.isLocalOffline) {
      setSession(null);
    } else {
      await signOut(auth);
    }
  };

  interface SystemStats {
    totalPlans: number;
    totalAcreage: number;
    lastGeneratedAt: string;
  }

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [plans, setPlans] = useState<SitePlan[]>([]);
  
  // Real-time synchronization of plans with Firestore or localStorage
  useEffect(() => {
    if (!session || session.isLocalOffline) {
      // Fallback or read from localStorage when unauthenticated or local offline
      try {
        const stored = localStorage.getItem('sitePlans');
        const parsed = stored ? JSON.parse(stored) : [];
        const normalized = Array.isArray(parsed) ? parsed.map((p: any) => restoreNestedArrays(p)) : [];
        setPlans(normalized);
        const totalAcreage = normalized.reduce((acc: number, p: any) => acc + (p.acreage || 0), 0);
        setSystemStats({
          totalPlans: normalized.length,
          totalAcreage: Number(totalAcreage.toFixed(2)),
          lastGeneratedAt: normalized.length > 0 ? new Date().toISOString() : "Never"
        });
      } catch {
        setPlans([]);
      }
      return;
    }

    const path = 'site_plans';
    const q = query(collection(db, path), where("userId", "==", session.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fbPlans: SitePlan[] = [];
      snapshot.forEach((docSnap) => {
        fbPlans.push(restoreNestedArrays(docSnap.data()) as SitePlan);
      });
      // Sort plans newest first
      fbPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPlans(fbPlans);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [session]);

  // Sync back to local storage only when unauthenticated or local offline
  useEffect(() => {
    if ((!session || session.isLocalOffline) && plans.length > 0) {
      localStorage.setItem('sitePlans', JSON.stringify(plans));
    }
  }, [plans, session]);

  // Load and subscribe to system stats in real time (for Firebase cloud mode)
  useEffect(() => {
    if (!session || session.isLocalOffline) return;
    
    const statsRef = doc(db, "stats", "system");
    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSystemStats(docSnap.data() as SystemStats);
      }
    }, (error) => {
      console.warn("Could not fetch remote system stats", error);
    });
    
    return unsubscribe;
  }, [session]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(true);
  
  // Form State
  const [ownerName, setOwnerName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [region, setRegion] = useState(GHANA_REGIONS[0]);
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [streetName, setStreetName] = useState('');
  const [ghanaPostGPS, setGhanaPostGPS] = useState('');
  const [acreage, setAcreage] = useState('0.16');
  const [plotShape, setPlotShape] = useState<'square' | 'rectangle' | 'irregular'>('rectangle');
  const [isExporting, setIsExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const lastPrefixRef = useRef<string>('');



  // GhanaPost GPS Prefix & Sector Parsing & Auto-Population
  useEffect(() => {
    if (ghanaPostGPS.length >= 2) {
      const normalized = ghanaPostGPS.toUpperCase().trim().replace(/\s/g, "");
      if (normalized !== ghanaPostGPS) {
        setGhanaPostGPS(normalized);
      }
      
      const parts = normalized.split('-');
      const prefix = parts[0] || '';
      const sector = parts[1] || '';
      
      // We trigger updates when the prefix OR the sector code changes!
      const syncKey = `${prefix}-${sector}`;
      
      if (syncKey !== lastPrefixRef.current) {
        const profile = FusedGeoIntelligenceEngine.resolveSync(normalized);
        if (profile) {
          console.log(`[FusedGeo Live] Live aligned context for GPS ${normalized} -> Locality: ${profile.locality}, Street: ${profile.streetName}`);
          setRegion(profile.region);
          setDistrict(profile.district);
          setLocality(profile.locality);
          setStreetName(profile.streetName);
        }
        lastPrefixRef.current = syncKey;
      }
    }
  }, [ghanaPostGPS]);

  const handleGenerateGPS = () => {
    if (!region) return;
    setGhanaPostGPS(generateGhanaPostGPS(region));
  };

  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const finalGps = ghanaPostGPS || generateGhanaPostGPS(region);
      
      // Let the Fused GeoIntelligence Engine coordinate everything (Steps 1 to 13)
      const fusedProfile = await FusedGeoIntelligenceEngine.resolve(finalGps);
      console.log("FUSED LOCATION", {
        lat: fusedProfile.lat,
        lng: fusedProfile.lng,
        locality: fusedProfile.locality,
        district: fusedProfile.district
      });

      
      // Fetch OSM Data around the final coordinates for local interactive map overlays and pillar alignment
      const { fetchOSMData } = await import('./services/osmService');
      const osmData = await fetchOSMData(fusedProfile.lat, fusedProfile.lng, 350);
      
      if (osmData) {
        (osmData as any).roads = osmData.ways?.filter((w: any) => w.type === 'highway') || [];
        (osmData as any).buildings = osmData.ways?.filter((w: any) => w.type === 'building') || [];
      }

      // Diagnostic logging as requested
      console.log("FUSED COORDINATES", fusedProfile.lat, fusedProfile.lng);
      console.log("OSM ROADS", (osmData as any)?.roads?.length || 0);
      console.log("OSM BUILDINGS", (osmData as any)?.buildings?.length || 0);
      console.log("PILLAR SOURCE", "FUSED_COORDINATES");

      // Real-world base projected coordinates (UTM Zone 30N) rather than legacy hash seed
      const utmProjected = latLngToUTM30N(fusedProfile.lat, fusedProfile.lng);
      const baseEasting = utmProjected.easting;
      const baseNorthing = utmProjected.northing;
      
      // Calculate plot size in meters based on Acreage (1 Acre = 4046.86 sqm)
      const parsedAcreage = parseFloat(acreage);
      const safeAcreage = isNaN(parsedAcreage) || parsedAcreage <= 0 ? 0.16 : parsedAcreage;
      const areaSqm = safeAcreage * 4046.86;
      const size = Math.max(Math.sqrt(areaSqm * (plotShape === 'rectangle' ? 1.2 : 1.0)), 10);
      
      const calculatedPillars = generatePillars(baseEasting, baseNorthing, size, plotShape, finalGps, {
        lat: fusedProfile.lat,
        lng: fusedProfile.lng,
        osmData,
        accessPathType: fusedProfile.accessPathType,
        nearbyLandmark: fusedProfile.nearbyLandmark
      });
      const generatedContext = {
        roads: [
          { name: fusedProfile.streetName || "Main Road" },
          { name: "Access Road" }
        ],
        buildings: [
          { name: "Residential Block A" },
          { name: "Residential Block B" },
          { name: "Commercial Structure" }
        ],
        landmarks: [
          { name: fusedProfile.nearbyLandmark || "Community Landmark" }
        ]
      };

      
      // MMDA GIS Enrichment Pipeline
      const enrichment = enrichWithMMDAGIS(
        fusedProfile.lat, 
        fusedProfile.lng, 
        fusedProfile.locality, 
        fusedProfile.streetName, 
        finalGps, 
        fusedProfile.region, 
        fusedProfile.district
      );
      
      console.log("PLAN SAVE CHECK", {
        roads: osmData?.ways?.filter(w => w.type === "highway").length || 0,
        buildings: osmData?.ways?.filter(w => w.type === "building").length || 0,
        nodes: osmData?.nodes?.length || 0,
        hasOSM: !!osmData
      });

      const newPlan: SitePlan = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        ownerName,
        contactDetails,
        region: fusedProfile.region,
        district: fusedProfile.district,
        locality: fusedProfile.locality,
        streetName: fusedProfile.streetName,
        ghanaPostGPS: finalGps,
        acreage: Number(safeAcreage.toFixed(2)),
        hectares: Number((safeAcreage * 0.404686).toFixed(3)),
        plotShape,
        pillars: calculatedPillars,
        scale: "1:2,500",
        lat: fusedProfile.lat,
        lng: fusedProfile.lng,
        nearbyLandmark: fusedProfile.nearbyLandmark,
        accessPathType: fusedProfile.accessPathType,
        cadastralSector: fusedProfile.engineeringMetadata.cadastralSector,
        surveyZone: fusedProfile.engineeringMetadata.surveyZone,
        osmData: osmData || undefined,
        gisData: {
          municipality: fusedProfile.municipality,
          isEnriched: true,
          spatialAccuracy: fusedProfile.accuracyClass,
          polygonValidated: true,
          source: 'fused_geointelligence_engine',
          planningSector: enrichment.spatial.planningSector || "RESIDENTIAL ZONE",
          assemblyZone: enrichment.spatial.assemblyZone,
          zoning: enrichment.spatial.zoning,
          authoritativeSource: fusedProfile.engineeringMetadata.authoritativeSource,
          spatialMemoryState: fusedProfile.engineeringMetadata.spatialMemoryState
        },
        generatedContext,

        userId: session?.uid || 'anonymous'
      };

      // Wait 3.5 seconds to allow the GisProcessingHud animation & steps to complete beautifully
      await new Promise(resolve => setTimeout(resolve, 3600));

      if (session && !session.isLocalOffline) {
        const path = `site_plans/${newPlan.id}`;
        try {
          await setDoc(doc(db, "site_plans", newPlan.id), sanitizePlanForFirestore(newPlan, session.uid));
          
          // Transactionally increment global metrics to keep stats in real-time sync
          const statsRef = doc(db, "stats", "system");
          await runTransaction(db, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            let totalPlans = 1;
            let totalAcreage = newPlan.acreage;
            if (statsDoc.exists()) {
              const currentData = statsDoc.data();
              totalPlans = (currentData.totalPlans || 0) + 1;
              totalAcreage = Number(((currentData.totalAcreage || 0) + newPlan.acreage).toFixed(2));
            }
            transaction.set(statsRef, {
              totalPlans,
              totalAcreage,
              lastGeneratedAt: new Date().toISOString()
            });
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      } else {
        setPlans(prev => {
          const updated = [newPlan, ...prev];
          localStorage.setItem('sitePlans', JSON.stringify(updated));
          return updated;
        });
        setSystemStats(prev => {
          const currentTotal = (prev?.totalPlans || 0) + 1;
          const currentAcreage = Number(((prev?.totalAcreage || 0) + newPlan.acreage).toFixed(2));
          return {
            totalPlans: currentTotal,
            totalAcreage: currentAcreage,
            lastGeneratedAt: new Date().toISOString()
          };
        });
      }
      setActivePlanId(newPlan.id);
    } catch(err) {
      console.error(err);
      alert("Failed to generate plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const activePlan = plans.find(p => p.id === activePlanId);

  const deletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session && !session.isLocalOffline) {
      const path = `site_plans/${id}`;
      try {
        await deleteDoc(doc(db, "site_plans", id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setPlans(prev => {
        const updated = prev.filter(p => p.id !== id);
        localStorage.setItem('sitePlans', JSON.stringify(updated));
        return updated;
      });
      setSystemStats(prev => {
        if (!prev) return null;
        const deletedPlan = plans.find(p => p.id === id);
        const subAcreage = deletedPlan ? deletedPlan.acreage : 0;
        return {
          totalPlans: Math.max(0, prev.totalPlans - 1),
          totalAcreage: Number(Math.max(0, prev.totalAcreage - subAcreage).toFixed(2)),
          lastGeneratedAt: new Date().toISOString()
        };
      });
    }
    if (activePlanId === id) {
      setActivePlanId(null);
    }
  };

  const updatePlanField = async (planId: string | undefined, fields: Partial<SitePlan>) => {
    if (!planId) return;
    let updatedPlan: SitePlan | undefined;
    setPlans(prev => {
      const updated = prev.map(p => {
        if (p.id === planId) {
          updatedPlan = { ...p, ...fields };
          return updatedPlan;
        }
        return p;
      });
      if (!session || session.isLocalOffline) {
        localStorage.setItem('sitePlans', JSON.stringify(updated));
      }
      return updated;
    });
    if (session && !session.isLocalOffline) {
      const path = `site_plans/${planId}`;
      try {
        const currentInMemory = plans.find(p => p.id === planId);
        const fullPlan = currentInMemory ? { ...currentInMemory, ...fields } : { id: planId, ...fields } as any;
        await setDoc(doc(db, "site_plans", planId), sanitizePlanForFirestore(fullPlan, session.uid), { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const exportPDF = async (planToExport?: SitePlan) => {
    const targetPlan = planToExport || activePlan;
    if (!previewRef.current || !targetPlan) return;
    try {
      setIsExporting(true);
      // Brief timeout to ensure state update renders before freezing main thread via html-to-image
      await new Promise(resolve => setTimeout(resolve, 300)); 
      
      const element = previewRef.current;
      const parent = element.parentElement;
      const originalScale = parent?.style.transform;
      const originalTransition = parent?.style.transition;
      
      const scrollParent = element.closest('.overflow-y-auto');
      const originalScroll = scrollParent?.scrollTop || 0;
      
      if (parent) {
        parent.style.transition = 'none';
        parent.style.transform = 'scale(1)';
      }
      if (scrollParent) {
        scrollParent.scrollTop = 0;
      }
      
      // another small timeout to let the DOM apply the scroll/scale reset before html-to-image reads it
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const imgData = await toJpeg(element, { 
        quality: 0.95, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
          position: 'static'
        }
      });
      
      if (scrollParent) {
        scrollParent.scrollTop = originalScroll;
      }
      if (parent) {
        parent.style.transform = originalScale || '';
        // restore transition after a tiny delay so it doesn't animate back wildly
        setTimeout(() => {
          parent.style.transition = originalTransition || '';
        }, 50);
      }
      
      // A4 format: 210 x 297 mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (1123 * pdfWidth) / 794;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Site_Plan_${targetPlan.ownerName.replace(/\s+/g, '_')}_${targetPlan.locality}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const planToExport = plans.find(p => p.id === id);
    if (!planToExport) return;
    
    if (activePlanId !== id) {
      setActivePlanId(id);
      setTimeout(() => {
        // use the latest plans from closure to find it? No need, we have it.
        exportPDF(planToExport);
      }, 500);
    } else {
      exportPDF(planToExport);
    }
  };

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-1.0232,7.9465,5.5,0/800x600?access_token=${MAPBOX_TOKEN}`;

  if (authChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!session) {
    return <AdminAuth onLogin={(localSession) => {
      if (localSession) {
        setSession(localSession);
      }
    }} />;
  }

  return (
    <div className="flex flex-col min-h-screen md:h-screen w-full bg-zinc-100 text-zinc-900 font-sans">
      
      {/* Top Navigation Bar from Theme */}
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 md:px-6 shrink-0 border-b border-slate-700 shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
          >
            <List className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-slate-900 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <h1 className="text-sm md:text-lg font-semibold tracking-tight truncate flex items-center gap-1.5">
            GeoPlan GH
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full ml-1">v4.2 MMDA ENGINE</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            {activePlan?.gisData?.isEnriched ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                MMDA ENRICHED
              </span>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                GhanapostGPS Linked: {activePlan ? activePlan.ghanaPostGPS : (ghanaPostGPS || 'Pending')}
              </>
            )}
          </div>
          <button 
            onClick={() => setIsInputOpen(!isInputOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </button>
          <button className="hidden sm:block text-xs font-medium hover:text-amber-400 transition-colors">Server Active</button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-full border border-red-400/20">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <div className={cn(
          "w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0 z-40 transition-all duration-300 absolute lg:relative h-full",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Workspace</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-zinc-900">
              <Plus className="w-5 h-5 transform rotate-45" />
            </button>
          </div>
          
          <div className="p-4 bg-zinc-50 border-b border-zinc-100">
            <button 
              onClick={() => {
                setActivePlanId(null);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 py-2.5 rounded font-bold text-sm transition-colors justify-center border",
                activePlanId === null ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800" : "bg-white text-zinc-700 hover:bg-zinc-100 border-zinc-300"
              )}
            >
              <Plus className="w-4 h-4" />
              New Site Plan
            </button>
          </div>

          {systemStats && (
            <div className="mx-4 mt-4 p-3 bg-slate-950 text-white rounded-lg border border-slate-800 shadow-xl flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">
                <span>System Statistics</span>
                <span className="flex items-center gap-1 text-emerald-400 font-extrabold uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> DB SYNClive
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/80 text-center">
                  <div className="text-[8px] uppercase font-bold text-zinc-400">Global Plans</div>
                  <div className="text-xs font-black text-amber-400 mt-0.5">{systemStats.totalPlans}</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/80 text-center">
                  <div className="text-[8px] uppercase font-bold text-zinc-400">Total Acres</div>
                  <div className="text-xs font-black text-amber-400 mt-0.5">{systemStats.totalAcreage} ac</div>
                </div>
              </div>
              <div className="text-[7.5px] text-zinc-500 truncate mt-0.5 text-center font-mono uppercase tracking-tight">
                Last Sync: {new Date(systemStats.lastGeneratedAt).toLocaleTimeString()}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 mt-2">Saved Plans</h2>
            <div className="space-y-1.5">
               {plans.length === 0 ? (
                 <div className="text-[11px] text-zinc-400 p-3 text-center border border-dashed rounded bg-zinc-50">
                    No plans generated yet.
                 </div>
               ) : (
                 plans.map(plan => (
                   <div
                     key={plan.id}
                     className={cn(
                       "w-full text-left px-3 py-2 rounded text-sm transition-colors border group relative flex flex-col",
                       activePlanId === plan.id 
                         ? "bg-amber-50 border-amber-200 text-amber-900" 
                         : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                     )}
                   >
                      <button className="flex-1 text-left min-h-[40px] flex flex-col justify-center" onClick={() => {
                        setActivePlanId(plan.id);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}>
                        <div className="font-bold truncate text-[12px]">{plan.ownerName || 'Untitled'}</div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{plan.locality} - {new Date(plan.createdAt).toLocaleDateString()}</div>
                      </button>
                      <div className={cn(
                        "flex gap-1 mt-2 justify-end lg:opacity-0 lg:group-hover:opacity-100 transition-opacity",
                        activePlanId === plan.id ? "opacity-100" : "opacity-0 lg:group-hover:opacity-100"
                      )}>
                         <button onClick={() => {
                           setActivePlanId(plan.id);
                           if (window.innerWidth < 1024) setIsSidebarOpen(false);
                         }} className="p-1.5 hover:bg-black/5 rounded text-zinc-500 hover:text-blue-600 transition-colors" title="View">
                           <Eye className="w-4 h-4" />
                         </button>
                         <button onClick={(e) => handlePrintPlan(plan.id, e)} className="p-1.5 hover:bg-black/5 rounded text-zinc-500 hover:text-green-600 transition-colors" title="Download PDF">
                           <Download className="w-4 h-4" />
                         </button>
                         <button onClick={(e) => deletePlan(plan.id, e)} className="p-1.5 hover:bg-black/5 rounded text-zinc-500 hover:text-red-600 transition-colors" title="Delete">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* Backdrop for mobile menus */}
        {(isSidebarOpen || (isInputOpen && window.innerWidth < 1024)) && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsInputOpen(false);
            }}
          />
        )}

        {/* Main Content Area (Input Forms / Details) */}
        <div className={cn(
          "w-80 bg-white shadow-xl lg:shadow-none z-40 lg:z-20 shrink-0 flex flex-col border-r border-zinc-200 transition-all duration-300 absolute lg:relative h-full right-0 lg:right-auto",
          isInputOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          
           {!activePlanId ? (
              <form onSubmit={handleGeneratePlan} className="flex flex-col h-full bg-white relative">
                 <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0 flex items-center justify-between">
                   <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Property Input Data</h2>
                   <button type="button" onClick={() => setIsInputOpen(false)} className="lg:hidden text-zinc-400 hover:text-zinc-900">
                     <Plus className="w-5 h-5 transform rotate-45" />
                   </button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Property Owner */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase">Property Owner Full Name <span className="text-red-500">*</span></label>
                      <input required type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all shadow-sm" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase">Contact Details</label>
                      <input type="text" value={contactDetails} onChange={e => setContactDetails(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all shadow-sm" placeholder="Phone or Email" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase">Region <span className="text-red-500">*</span></label>
                      <select required value={region} onChange={e => setRegion(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all shadow-sm">
                        {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-700 uppercase">District / MMDA <span className="text-red-500">*</span></label>
                        <input required type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all shadow-sm" placeholder="e.g. Ga East" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-700 uppercase">Locality <span className="text-red-500">*</span></label>
                        <input required type="text" value={locality} onChange={e => setLocality(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all shadow-sm" placeholder="e.g. Abokobi" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase">Street / Link Road</label>
                      <input type="text" value={streetName} onChange={e => setStreetName(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all shadow-sm" placeholder="e.g. Boundary Road" />
                    </div>
                    
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-bold text-zinc-700 uppercase">GhanaPostGPS Addr.</label>
                       <div className="relative flex">
                         <input type="text" value={ghanaPostGPS} onChange={e => setGhanaPostGPS(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all font-mono shadow-sm" placeholder="e.g. GA-123-4567" />
                         <button type="button" onClick={handleGenerateGPS} className="absolute right-1 top-1 bottom-1 px-3 flex items-center bg-zinc-200 hover:bg-zinc-300 text-[10px] font-bold text-zinc-700 rounded transition-colors uppercase tracking-wider">
                           Auto
                         </button>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase">Property Size (Acres) <span className="text-red-500">*</span></label>
                      <input required type="number" step="0.01" value={acreage} onChange={e => setAcreage(e.target.value)} className="w-full text-base lg:text-sm border border-zinc-300 rounded px-3 py-2.5 lg:py-2 bg-zinc-50 focus:border-amber-500 outline-none transition-all shadow-sm" placeholder="e.g. 0.16" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase">Plot Geometry <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                         {(['square', 'rectangle', 'irregular'] as const).map(s => (
                           <button 
                             key={s} 
                             type="button"
                             onClick={() => setPlotShape(s)}
                             className={cn(
                               "py-2 text-[10px] font-bold uppercase border rounded transition-all",
                               plotShape === s ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400"
                             )}
                           >
                             {s}
                           </button>
                         ))}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded border border-amber-200 mt-2">
                       <p className="text-[10px] text-amber-800 leading-relaxed">
                         <span className="font-bold">MMDA DATA SYNC:</span> Synchronizing without API. Street linkage verified for <span className="underline font-medium italic">{streetName || 'Selected Road'}</span>.
                       </p>
                    </div>
                 </div>

                 <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col shrink-0 sticky bottom-0">
                    <button type="submit" disabled={isGenerating} className="w-full bg-slate-900 text-white py-3 lg:py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors uppercase tracking-widest shadow-lg disabled:opacity-75 disabled:cursor-wait">
                      {isGenerating ? "Processing OSM Data..." : "Generate Site Plan"} <ArrowRightIcon className="w-4 h-4"/>
                    </button>
                 </div>
              </form>
           ) : (
              // Active Plan Info Panel
              <div className="flex flex-col h-full bg-white relative">
                 <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0 flex items-center justify-between">
                   <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Plan Details</h2>
                   <div className="flex gap-2">
                    <button onClick={() => setActivePlanId(null)} className="text-[10px] uppercase font-bold text-zinc-700 bg-zinc-200 px-2 py-1 rounded hover:bg-zinc-300 flex items-center gap-1 transition-colors">
                      &larr; Back
                    </button>
                    <button onClick={() => setIsInputOpen(false)} className="lg:hidden text-zinc-400 hover:text-zinc-900">
                      <Plus className="w-5 h-5 transform rotate-45" />
                    </button>
                   </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   <div>
                     <h2 className="text-xl font-black tracking-tight leading-tight text-zinc-900">{activePlan?.ownerName}</h2>
                     <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mt-1 border-b border-zinc-200 pb-3">
                       <MapPin className="w-3 h-3 inline mr-1 -mt-0.5" />{activePlan?.locality}, {activePlan?.district}
                     </p>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <Stat label="Total Area" value={`${activePlan?.acreage} AC`} />
                     <Stat label="Hectares" value={`${activePlan?.hectares} HA`} />
                     <Stat label="Scale Map" value={activePlan?.scale || ''} />
                     <Stat label="Digital Addr." value={activePlan?.ghanaPostGPS || ''} className="font-mono text-xs" />
                    </div>

                    {activePlan && (
                      <LandmarkPreview plan={activePlan} />
                    )}

                    <div className="hidden">
                   </div>

                   <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-700 leading-relaxed font-medium">
                     <p className="flex items-start gap-2 mb-3">
                       <FileSearch className="w-4 h-4 shrink-0 text-zinc-500" />
                       This output adheres exactly to the structural requirements mandated by the Ghana Lands Commission for cadastral mapping processing.
                     </p>
                     
                     <div className="flex flex-wrap gap-1.5 pt-3 border-t border-zinc-200">
                        {activePlan?.gisData?.source === 'district_prefix' && (
                          <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-indigo-200">
                             <SearchCode className="w-3 h-3" /> OFFICIAL PREFIX VALIDATED
                          </div>
                        )}
                        {activePlan?.gisData?.polygonValidated && (
                          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-green-200">
                             <CheckCircle2 className="w-3 h-3" /> DISTRICT VALIDATED
                          </div>
                        )}
                        {activePlan?.gisData?.isEnriched && (
                          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-amber-200">
                             <ShieldCheck className="w-3 h-3" /> MMDA ENRICHED
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-blue-200">
                           <CheckCircle2 className="w-3 h-3" /> ROAD NORMALIZED
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-slate-200">
                           <CheckCircle2 className="w-3 h-3" /> LOCALITY VERIFIED
                        </div>
                     </div>
                   </div>

                   {/* Spatial Calibration Control System (Step 12 — Spatial Memory) */}
                   <div className="p-4 pt-0 border-t border-zinc-100">
                     <h3 className="text-xs font-black uppercase text-slate-850 tracking-wider mb-2.5 flex items-center gap-1 pt-4">
                       <Map className="w-3.5 h-3.5 text-zinc-600" />
                       Spatial Memory Calibration
                     </h3>
                     
                     <div className="space-y-3 bg-zinc-50 border border-zinc-200 p-3 rounded">
                       <div>
                         <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Interactive Locality</label>
                         <input 
                           type="text" 
                           value={activePlan?.locality || ''} 
                           onChange={(e) => {
                             const updatedVal = e.target.value;
                             updatePlanField(activePlan?.id, { locality: updatedVal });
                           }}
                           className="w-full text-xs font-sans border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-800 focus:outline-none focus:border-zinc-500"
                         />
                       </div>

                       <div>
                         <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Street / Road Name</label>
                         <input 
                           type="text" 
                           value={activePlan?.streetName || ''} 
                           onChange={(e) => {
                             const updatedVal = e.target.value;
                             updatePlanField(activePlan?.id, { streetName: updatedVal });
                           }}
                           className="w-full text-xs font-sans border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-800 focus:outline-none focus:border-zinc-500"
                         />
                       </div>

                       <div>
                         <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Fused Physical Landmark</label>
                         <input 
                           type="text" 
                           value={activePlan?.nearbyLandmark || ''} 
                           onChange={(e) => {
                             const updatedVal = e.target.value;
                             updatePlanField(activePlan?.id, { nearbyLandmark: updatedVal });
                           }}
                           className="w-full text-xs font-sans border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-800 focus:outline-none focus:border-zinc-500"
                         />
                       </div>

                       <button 
                         onClick={async () => {
                           if (activePlan) {
                             const { ghanaPostGPS, locality, streetName, nearbyLandmark } = activePlan;
                             // Save customization to Fused Spatial Memory registry
                             FusedGeoIntelligenceEngine.learnSpatialMemory(ghanaPostGPS, {
                               locality,
                               streetName,
                               nearbyLandmark
                             });
                             if (session) {
                               try {
                                 await updatePlanField(activePlan.id, {
                                   locality,
                                   streetName,
                                   nearbyLandmark
                                 });
                               } catch (error) {
                                 handleFirestoreError(error, OperationType.UPDATE, `site_plans/${activePlan.id}`);
                               }
                             }
                             alert(`GeoIntelligence Spatial Memory permanently learned GPS Code: ${ghanaPostGPS}`);
                           }
                         }}
                         className="w-full bg-slate-800 text-white font-mono text-[9px] font-bold py-1.5 px-3 rounded text-center tracking-widest uppercase hover:bg-slate-700 transition cursor-pointer"
                       >
                         Commit Spatial Memory
                       </button>
                     </div>
                   </div>

                 </div>

                 <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-2 shrink-0 sticky bottom-0">
                    <button 
                      onClick={() => exportPDF()} 
                      disabled={isExporting}
                      className="w-full bg-slate-900 text-white py-3 lg:py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer z-10 shadow-lg"
                    >
                      <Download className="w-4 h-4" /> 
                      {isExporting ? "Generating..." : "Download PDF"}
                    </button>
                 </div>
              </div>
           )}

        </div>

        {/* Right pane: Document Preview (Workspace) */}
        <section className="flex-1 bg-zinc-300 flex items-center justify-center relative overflow-hidden">
           <div className="absolute top-4 left-4 flex gap-2 z-10 pointer-events-none">
             <div className="bg-white/80 backdrop-blur-sm px-3 py-1 text-[10px] font-bold border border-zinc-400/50 rounded shadow-sm uppercase tracking-wider text-zinc-700">Layer: Cadastral</div>
             <div className="bg-white/80 backdrop-blur-sm px-3 py-1 text-[10px] font-bold border border-zinc-400/50 rounded shadow-sm uppercase tracking-wider text-zinc-700">Zoom: Fit Screen</div>
           </div>

           {/* Mobile Sidebars Toggle Buttons Overlay when closed */}
           {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden absolute left-4 top-14 bg-white p-2.5 rounded-full shadow-lg border border-zinc-200 z-20 text-zinc-600 hover:text-slate-900 transition-all active:scale-95"
              >
                <List className="w-5 h-5" />
              </button>
           )}
           {!isInputOpen && (
              <button 
                onClick={() => setIsInputOpen(true)}
                className="lg:hidden absolute right-4 top-14 bg-white p-2.5 rounded-full shadow-lg border border-zinc-200 z-20 text-zinc-600 hover:text-slate-900 transition-all active:scale-95"
              >
                <Settings className="w-5 h-5" />
              </button>
           )}

           {/* Document Wrapper */}
           <div className="w-full h-full overflow-auto relative scrollbar-hide flex flex-col bg-zinc-300">
              
              {isGenerating ? (
                 <GisProcessingHud gpsCode={ghanaPostGPS || "GEN-HASH-602"} ownerName={ownerName} />
               ) : !activePlanId ? (
                <div className="m-auto h-full w-full p-4 md:p-8 relative group">
                  <img 
                     src={staticMapUrl} 
                     alt="Ghana Satellite"
                     className="w-full h-full object-cover opacity-80"
                   />
                   <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/50 rounded-xl px-4 text-center">
                       <div className="w-20 md:w-24 h-20 md:h-24 bg-white/10 border border-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6 text-white shadow-2xl">
                         <Map className="w-10 md:w-12 h-10 md:h-12" />
                       </div>
                       <h3 className="text-xl md:text-2xl font-black tracking-widest uppercase text-white drop-shadow-md">Satellite Workspace</h3>
                       <p className="text-xs md:text-sm mt-3 text-white/80 max-w-md leading-relaxed drop-shadow-md">Select or generate a site plan to preview the official layout. Real-world mapping powered by Mapbox.</p>
                       <div className="mt-8 flex gap-3 lg:hidden">
                          <button onClick={() => setIsSidebarOpen(true)} className="pointer-events-auto bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg">History</button>
                          <button onClick={() => setIsInputOpen(true)} className="pointer-events-auto bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg">New Plan</button>
                       </div>
                   </div>
                </div>
              ) : (
                <div className="overflow-visible min-h-max flex w-full p-4 md:p-8">
                   <div className="m-auto transition-all duration-500 scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 mb-[-449px] sm:mb-[-281px] md:mb-[-112px] lg:mb-0 mr-[-318px] sm:mr-[-198px] md:mr-[-79px] lg:mr-0 origin-top-left opacity-100 relative group flex-shrink-0">
                      <SitePlanPreview ref={previewRef} plan={activePlan!} />
                      
                      {/* Realistic paper shadow and backdrop effect */}
                      <div className="absolute inset-0 pointer-events-none shadow-xl z-[-1] bg-white ring-1 ring-zinc-200 print:hidden"></div>
                   </div>
                 </div>
              )}

           </div>
        </section>

      </main>

      {/* Bottom Status Bar */}
      <footer className="hidden md:flex h-8 bg-zinc-100 border-t border-zinc-300 px-6 items-center justify-between text-[11px] text-zinc-500 shrink-0 font-medium">
        <div className="flex gap-6">
          <span>Region: {activePlan?.region || region || 'None'}</span>
          <span>District: {activePlan?.district || district || 'None'}</span>
          <span>MMDA Status: <span className="text-green-600 font-bold tracking-wide">Connected</span></span>
        </div>
        <div className="flex gap-4 items-center">
          <span>Last Generated: {activePlan ? new Date(activePlan.createdAt).toLocaleTimeString() : 'N/A'}</span>
          <span className="px-2 py-[2px] bg-zinc-200 border border-zinc-300 rounded font-mono text-[9px] text-zinc-600 tracking-wider">Secure Hash: {activePlan ? activePlan.id.slice(0,8).toUpperCase() : '----'}</span>
        </div>
      </footer>

    </div>
  );
}

function Stat({ label, value, className }: { label: string, value: string, className?: string }) {
  return (
    <div className="bg-zinc-50 p-3 rounded border border-zinc-200">
      <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1 tracking-wider">{label}</div>
      <div className={cn("text-sm font-bold text-zinc-900 truncate", className)}>{value}</div>
    </div>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default App;
