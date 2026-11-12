import React, { useState } from 'react';
import {
  X,
  Code2,
  GitBranch,
  Flame,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  BookOpen
} from 'lucide-react';

export default function BuildingDetails({
  building,
  allBuildings,
  onClose,
  onSelectOtherBuilding
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'code'

  if (!building) return null;

  const file = building.file;
  const lang = file.language;

  // Resolve dependency and dependent building objects
  const importedBuildings = (file.dependencies || [])
    .map(id => allBuildings?.find(b => b.file.id === id))
    .filter(Boolean);

  const dependentBuildings = (file.dependents || [])
    .map(id => allBuildings?.find(b => b.file.id === id))
    .filter(Boolean);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(file.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="absolute top-20 right-4 bottom-6 w-96 max-w-[calc(100vw-2rem)] z-40 bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
                style={{ backgroundColor: lang.color + '25', color: lang.color }}
              >
                {lang.name}
              </span>
              {file.isMonolith && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800/60 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Monolith
                </span>
              )}
            </div>
            <h2 className="font-bold text-base text-white truncate" title={file.name}>
              {file.name}
            </h2>
            <p className="text-xs text-slate-400 truncate font-mono mt-0.5" title={file.path}>
              {file.path}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Metrics & Highways
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Source Code ({file.loc})
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'metrics' ? (
          <>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Skyscraper Height</span>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {file.loc} <span className="text-xs font-normal text-slate-400">LOC</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Code: {file.codeLines} | Blank: {file.blankLines}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Complexity Score</span>
                <div className={`text-lg font-bold font-mono mt-0.5 ${file.complexityScore > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  Level {file.complexityScore}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {file.functionsCount} Functions/Classes
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Comments Ratio</span>
                <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                  {file.loc > 0 ? Math.round((file.commentLines / file.loc) * 100) : 0}%
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {file.commentLines} commented lines
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">District Location</span>
                <div className="text-sm font-semibold text-slate-200 truncate mt-1" title={building.districtName}>
                  {building.districtName}
                </div>
              </div>
            </div>

            {/* Outgoing Highways (Dependencies / Imports) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-cyan-400">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Outgoing Dependencies ({importedBuildings.length})
                </span>
                <span className="text-[10px] text-slate-500">Imports</span>
              </div>

              {importedBuildings.length > 0 ? (
                <div className="space-y-1.5">
                  {importedBuildings.map((dep) => (
                    <button
                      key={dep.file.id}
                      onClick={() => onSelectOtherBuilding(dep)}
                      className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800/80 hover:border-cyan-500/50 transition flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300">
                          {dep.file.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {dep.file.path}
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {dep.file.loc} L
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500">
                  No internal project imports detected.
                </div>
              )}
            </div>

            {/* Incoming Highways (Dependents / Imported By) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-pink-400">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Incoming Highways ({dependentBuildings.length})
                </span>
                <span className="text-[10px] text-slate-500">Imported by</span>
              </div>

              {dependentBuildings.length > 0 ? (
                <div className="space-y-1.5">
                  {dependentBuildings.map((dep) => (
                    <button
                      key={dep.file.id}
                      onClick={() => onSelectOtherBuilding(dep)}
                      className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-pink-950/40 border border-slate-800/80 hover:border-pink-500/50 transition flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-medium text-slate-200 truncate group-hover:text-pink-300">
                          {dep.file.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {dep.file.path}
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {dep.file.loc} L
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-500">
                  No internal files import this module (Leaf / Entry Point).
                </div>
              )}
            </div>
          </>
        ) : (
          /* Code Inspector Tab */
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-mono">
                {file.name} ({file.loc} lines)
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[500px]">
              <table className="w-full border-collapse">
                <tbody>
                  {(file.content || '').split('\n').map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="pr-3 text-right text-slate-600 select-none text-[10px] w-8">
                        {idx + 1}
                      </td>
                      <td className="text-slate-300 whitespace-pre">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
