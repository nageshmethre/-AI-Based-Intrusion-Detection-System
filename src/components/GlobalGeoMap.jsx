import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  Server,
  Users,
  Globe,
  Activity,
  ShieldCheck,
  Zap,
  MapPin,
  ExternalLink,
  Layers
} from 'lucide-react';
import {
  CLOUD_REGIONS,
  CONTRIBUTORS_GEO,
  NETWORK_BACKBONE
} from '../data/mockInfrastructure.js';

export default function GlobalGeoMap({ isOpen, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedRegion, setSelectedRegion] = useState(CLOUD_REGIONS[0]);
  const [mapMode, setMapMode] = useState('dark'); // 'dark' | 'google-satellite'
  const [googleKey, setGoogleKey] = useState(
    localStorage.getItem('codecity_google_maps_key') || ''
  );
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Destroy existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map centered on world view
    const map = L.map(mapContainerRef.current, {
      center: [20, 20],
      zoom: 2.3,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false
    });
    mapInstanceRef.current = map;

    // Add Zoom Control to bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Dark Matter Cyber Tiles (Google Maps Dark / CartoDB)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }
    ).addTo(map);

    // 1. Draw Network Subsea Transit Lines
    NETWORK_BACKBONE.forEach((link) => {
      const fromRegion = CLOUD_REGIONS.find((r) => r.id === link.from);
      const toRegion = CLOUD_REGIONS.find((r) => r.id === link.to);

      if (fromRegion && toRegion) {
        const polyline = L.polyline([fromRegion.coords, toRegion.coords], {
          color: '#06b6d4',
          weight: 2,
          opacity: 0.5,
          dashArray: '6, 8'
        }).addTo(map);

        polyline.bindTooltip(link.label, {
          sticky: true,
          className: 'bg-slate-900 text-cyan-300 border border-cyan-500/40 text-xs px-2 py-1 rounded shadow-lg'
        });
      }
    });

    // 2. Add Cloud Region Nodes with Pulsing Neon Rings
    CLOUD_REGIONS.forEach((region) => {
      const icon = L.divIcon({
        className: 'custom-region-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-cyan-500/25 animate-ping"></div>
            <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-lg shadow-cyan-400/50 flex items-center justify-center text-[8px] font-bold text-slate-950">
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(region.coords, { icon }).addTo(map);
      marker.on('click', () => {
        setSelectedRegion(region);
        map.flyTo(region.coords, Math.max(map.getZoom(), 4), { duration: 1.2 });
      });

      marker.bindTooltip(
        `<strong>${region.name}</strong><br><span style="color:#38bdf8">${region.role}</span>`,
        { direction: 'top', offset: [0, -10] }
      );
    });

    // 3. Add Contributor Markers
    CONTRIBUTORS_GEO.forEach((contributor) => {
      const icon = L.divIcon({
        className: 'custom-contributor-icon',
        html: `
          <div class="w-7 h-7 rounded-xl bg-purple-950/90 border border-purple-500/60 shadow-lg flex items-center justify-center text-xs hover:scale-125 transition-transform">
            ${contributor.avatar}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker(contributor.coords, { icon }).addTo(map);
      marker.bindTooltip(
        `<strong>${contributor.name}</strong><br><span style="color:#c084fc">${contributor.commits} Commits • ${contributor.location}</span>`,
        { direction: 'top', offset: [0, -10] }
      );
    });

    // Invalidate size after modal render
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, mapMode]);

  const handleSaveGoogleKey = (e) => {
    e.preventDefault();
    localStorage.setItem('codecity_google_maps_key', googleKey.trim());
    setShowKeyInput(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-7xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Globe className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg text-white font-['Space_Grotesk']">
                  GLOBAL CLOUD & CONTRIBUTOR GEO-MAP
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                  Google Maps Cartography
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-world edge nodes, database clusters, and active developer commit geolocations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setMapMode('dark')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  mapMode === 'dark'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Cyber Dark
              </button>
              <button
                onClick={() => setMapMode('google-satellite')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  mapMode === 'google-satellite'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Google Satellite
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Close Map View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Map Viewport & Overlay */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {mapMode === 'dark' ? (
            <div ref={mapContainerRef} className="w-full h-full bg-slate-950" />
          ) : (
            /* Google Maps Satellite / Embed */
            <div className="w-full h-full relative">
              <iframe
                title="Google Maps World Satellite"
                className="w-full h-full border-0"
                loading="lazy"
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d387190.2799160891!2d${selectedRegion.coords[1]}!3d${selectedRegion.coords[0]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin`}
                allowFullScreen
              />
              <div className="absolute top-4 left-4 z-20 px-3 py-2 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl text-xs text-white">
                🛰️ Satellite View of <strong>{selectedRegion.name}</strong> Data Center
              </div>
            </div>
          )}

          {/* Regional Telemetry Drawer (Floating Left) */}
          {selectedRegion && (
            <div className="absolute top-4 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
              <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-wider">
                    {selectedRegion.provider}
                  </span>
                  <h3 className="font-bold text-white text-base">
                    {selectedRegion.name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {selectedRegion.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Ping Latency</span>
                  <span className="font-bold text-cyan-300 font-mono text-sm flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" /> {selectedRegion.latency}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Throughput</span>
                  <span className="font-bold text-purple-300 font-mono text-sm">
                    {selectedRegion.traffic}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Microservices Deployed
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedRegion.activeServices.map((svc) => (
                    <span
                      key={svc}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-200 border border-slate-800 font-mono"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Coordinates:</span>
                <span className="font-mono text-slate-300">
                  {selectedRegion.coords[0]}°, {selectedRegion.coords[1]}°
                </span>
              </div>
            </div>
          )}

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 right-4 z-20 p-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl text-xs space-y-1.5 hidden md:block">
            <div className="font-bold text-white text-[11px] border-b border-slate-800 pb-1 mb-1">
              Geospatial Legend
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Cloud Edge & Data Centers ({CLOUD_REGIONS.length})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Git Contributors ({CONTRIBUTORS_GEO.length})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-[11px]">
              <span className="w-4 h-[2px] bg-cyan-400" />
              <span>Subsea Fiber Transit Cables</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
