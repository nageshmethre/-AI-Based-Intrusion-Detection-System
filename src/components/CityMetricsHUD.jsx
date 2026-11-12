import React, { useState } from 'react';
import {
  Activity,
  FileCode2,
  Boxes,
  Flame,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Building
} from 'lucide-react';

export default function CityMetricsHUD({ stats, onSelectBuildingById }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!stats) return null;

  return (
    <div className="absolute top-20 left-4 z-30 w-72 max-w-[calc(100vw-2rem)] bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* HUD Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/90 transition select-none"
      >
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-wider">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>CITY TELEMETRY</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              stats.healthScore > 80
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {stats.healthScore}% HEALTH
          </span>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="p-3.5 space-y-3 text-xs text-slate-300">
          {/* Main Stat Counters */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total LOC</span>
              <span className="font-extrabold text-sm text-white font-mono">
                {stats.totalLOC.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Buildings</span>
              <span className="font-extrabold text-sm text-cyan-300 font-mono">
                {stats.totalFiles}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Districts</span>
              <span className="font-extrabold text-sm text-purple-300 font-mono">
                {stats.totalDistricts}
              </span>
            </div>
          </div>

          {/* Landmarks / Highlighted Skyscraper */}
          {stats.tallestFile && (
            <div
              onClick={() => onSelectBuildingById && onSelectBuildingById(stats.tallestFile.id)}
              className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-amber-400" /> Tallest Skyscraper:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {stats.tallestFile.loc} LOC
                </span>
              </div>
              <div className="text-xs font-semibold text-white truncate mt-1 group-hover:text-cyan-300">
                {stats.tallestFile.name}
              </div>
            </div>
          )}

          {/* Monolith Alert Summary */}
          {stats.monolithCount > 0 && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                <div>
                  <span className="font-bold text-red-300 block text-[11px]">
                    {stats.monolithCount} Monolithic Building{stats.monolithCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-red-400/80">
                    High complexity / LOC &gt; 300
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Language Breakdown Pills */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Architectural Stack
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stats.languages || {}).map(([lang, count]) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60"
                >
                  {lang}: <strong className="text-cyan-400">{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
