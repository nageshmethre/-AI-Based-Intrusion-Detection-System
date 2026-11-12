import React, { useState } from 'react';
import { Shield, Play, Wifi, WifiOff, Bell, User as UserIcon, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export function Navbar({ currentUser, isConnected, onSimulationComplete, onLogout }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimMessage(null);
    try {
      const res = await api.triggerSimulation();
      setSimMessage({
        type: 'success',
        text: `Simulation complete! Ingested ${res.events_generated} events & generated ${res.alerts_created} alerts.`
      });
      if (onSimulationComplete) onSimulationComplete(res);
      setTimeout(() => setSimMessage(null), 5000);
    } catch (err) {
      setSimMessage({ type: 'error', text: err.message || 'Simulation failed' });
      setTimeout(() => setSimMessage(null), 5000);
    } finally {
      setIsSimulating(false);
    }
  };

  const roleColors = {
    admin: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    analyst: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    viewer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-['Space_Grotesk']">
                AI-IDS Mini-SOC
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                Minor Project
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              AI-Based Intrusion Detection System &amp; Security Analytics • Nandini Pandey &amp; Nagesh
            </p>
          </div>
        </div>

        {/* Center/Right: Actions and Profile */}
        <div className="flex items-center gap-3">
          {/* WebSocket Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400">Stream Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-amber-400">Polling Mode</span>
              </>
            )}
          </div>

          {/* 1-Click Simulation Button (Evaluation Mode) */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
              isSimulating
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-900/30 active:scale-95'
            }`}
            title="Inject multi-stage synthetic attack (Port Scan -> Brute Force -> Sudo -> Exfiltration)"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating Attack...' : 'Run Security Simulation'}</span>
          </button>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-200">{currentUser.username}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${roleColors[currentUser.role] || 'bg-slate-800 text-slate-400'}`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {simMessage && (
        <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
          simMessage.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' 
            : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
        }`}>
          {simMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{simMessage.text}</span>
        </div>
      )}
    </header>
  );
}
