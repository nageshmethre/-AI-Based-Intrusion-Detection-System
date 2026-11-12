import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Play, 
  Wifi, 
  WifiOff, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Radio,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { api } from '../services/api';

export function Navbar({ currentUser, isConnected, onSimulationComplete, onLogout }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimMessage(null);
    try {
      const res = await api.triggerSimulation();
      setSimMessage({
        type: 'success',
        text: `APT Simulation Complete: ${res.events_generated} events ingested, ${res.alerts_created} alerts generated, Incident Campaign correlated!`
      });
      if (onSimulationComplete) onSimulationComplete(res);
      setTimeout(() => setSimMessage(null), 6000);
    } catch (err) {
      setSimMessage({ type: 'error', text: err.message || 'Simulation failed' });
      setTimeout(() => setSimMessage(null), 6000);
    } finally {
      setIsSimulating(false);
    }
  };

  const roleColors = {
    admin: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-900/30',
    analyst: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-900/30',
    viewer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-900/30'
  };

  return (
    <header className="h-14 shrink-0 z-40 bg-[#070B14] border-b border-slate-800/90 px-4 lg:px-6 flex items-center justify-between">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Left: Brand Identity & Academic Credits */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
            <Shield className="w-5 h-5 drop-shadow" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white font-cyber flex items-center gap-1.5">
                AI-IDS <span className="text-cyan-400">SOC</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-inner">
                Minor Project
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
              <span>AI-Based Intrusion Detection System</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">Nandini Pandey &amp; Nagesh</span>
            </p>
          </div>
        </div>

        {/* Center: Real-Time Operational Clock & Live Guard Status */}
        <div className="hidden xl:flex items-center gap-4 bg-slate-950/60 px-4 py-1.5 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>UTC: {currentTime.toUTCString().slice(17, 25)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">LOC: {currentTime.toLocaleTimeString()}</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-bold uppercase text-[10px]">24x7 Engine Armed</span>
          </div>
        </div>

        {/* Right: Actions, Simulation & Profile */}
        <div className="flex items-center gap-2.5">
          {/* WebSocket Stream Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-900/90 border border-slate-800">
            {isConnected ? (
              <>
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">Live WS Stream</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 font-semibold">Polling Mode</span>
              </>
            )}
          </div>

          {/* 1-Click Multi-Stage Attack Simulation Button */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all shadow-md ${
              isSimulating
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-rose-950/50 hover:shadow-rose-500/25 active:scale-95 border border-rose-500/30'
            }`}
            title="Execute automated 5-stage APT attack scenario for evaluation"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Attacking...' : '⚡ Run Simulation'}</span>
          </button>

          {/* User Profile & Role Tag */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
              <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">{currentUser.username}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${roleColors[currentUser.role] || 'bg-slate-800 text-slate-400'}`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
                title="Sign out of SOC Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Feedback Floating Toast */}
      {simMessage && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-xs border shadow-2xl ${
          simMessage.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-700 text-emerald-300' 
            : 'bg-rose-950/95 border-rose-700 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {simMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span className="font-semibold">{simMessage.text}</span>
          </div>
          <button onClick={() => setSimMessage(null)} className="text-slate-400 hover:text-white text-xs ml-2">✕</button>
        </div>
      )}
    </header>
  );
}
