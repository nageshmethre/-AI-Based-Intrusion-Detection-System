import React, { useState } from 'react';
import {
  Compass,
  Eye,
  MapPin,
  HelpCircle,
  Palette,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { LANGUAGE_PALETTE } from '../engine/themeColors.js';

export default function ControlsLegend({ onSelectPreset, activePreset }) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className="absolute bottom-6 left-4 z-30 flex flex-col gap-2">
      {/* Language Color Palette Modal / Popover */}
      {showLegend && (
        <div className="p-3.5 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl w-64 text-xs animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" /> Building Color Keys
            </span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {Object.entries(LANGUAGE_PALETTE)
              .filter(([k]) => k !== 'default')
              .slice(0, 10)
              .map(([ext, info]) => (
                <div key={ext} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-slate-300 truncate">{info.name}</span>
                </div>
              ))}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0 shadow-sm animate-pulse" />
              <span className="text-red-300 font-semibold">Monolith Alert</span>
            </div>
          </div>
        </div>
      )}

      {/* Camera Controls Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl text-xs text-slate-300">
        <button
          onClick={() => onSelectPreset('isometric')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activePreset === 'isometric'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> Isometric
        </button>

        <button
          onClick={() => onSelectPreset('top')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activePreset === 'top'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> 2D Blueprint
        </button>

        <button
          onClick={() => onSelectPreset('street')}
          className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
            activePreset === 'street'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Street View
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
            showLegend ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="Building Color Legend"
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Legend</span>
        </button>
      </div>

      {/* Micro Navigation Helper */}
      <div className="px-3 py-1 bg-slate-950/60 backdrop-blur-md rounded-xl text-[10px] text-slate-400 hidden lg:flex items-center gap-3">
        <span>🖱️ <strong>Left Click + Drag</strong> to Orbit</span>
        <span>•</span>
        <span>🖱️ <strong>Right Click</strong> to Pan</span>
        <span>•</span>
        <span>🔄 <strong>Scroll</strong> to Zoom</span>
        <span>•</span>
        <span>✨ <strong>Click</strong> Building to Inspect</span>
      </div>
    </div>
  );
}
