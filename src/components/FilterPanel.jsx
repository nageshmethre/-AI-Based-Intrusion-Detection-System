import React from 'react';
import { Filter, AlertTriangle, RefreshCw } from 'lucide-react';

export default function FilterPanel({
  filters,
  onFilterChange,
  availableLanguages,
  isOpenBuilding
}) {
  // If building details drawer is open on the right, position filter panel slightly towards center
  return (
    <div
      className={`fixed bottom-6 z-30 transition-all duration-300 ${
        isOpenBuilding ? 'right-[26rem]' : 'right-[15.5rem]'
      }`}
    >
      <div className="flex items-center gap-2 p-1.5 bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl text-xs text-slate-300">
        <div className="flex items-center gap-1.5 px-2 text-cyan-400 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter:</span>
        </div>

        {/* Language Selector */}
        <select
          value={filters.language}
          onChange={(e) => onFilterChange({ ...filters, language: e.target.value })}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 transition"
        >
          <option value="all">All Languages</option>
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {/* Monolith Highlight Toggle */}
        <button
          onClick={() =>
            onFilterChange({ ...filters, showMonolithsOnly: !filters.showMonolithsOnly })
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
            filters.showMonolithsOnly
              ? 'bg-red-950/90 text-red-300 border border-red-800 shadow-md shadow-red-950/40'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="Isolate bloated files (>300 LOC or high complexity)"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Monoliths Only</span>
        </button>

        {/* Reset Filter Button */}
        {(filters.language !== 'all' || filters.showMonolithsOnly) && (
          <button
            onClick={() => onFilterChange({ language: 'all', showMonolithsOnly: false })}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Reset filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
