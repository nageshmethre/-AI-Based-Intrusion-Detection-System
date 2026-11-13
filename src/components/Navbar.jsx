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
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export function Navbar({ currentUser, isConnected, onSimulationComplete, onLogout }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    admin: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm',
    analyst: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm',
    viewer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
  };

  return (
    <header className="h-14 shrink-0 z-40 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 lg:px-6 flex items-center justify-between shadow-lg shadow-black/50">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Left: Brand Identity & Academic Credits */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-black shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-400/40">
            <Shield className="w-5 h-5 drop-shadow stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                AI-IDS <span className="text-yellow-400 font-black">SOC</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-950/40 text-yellow-400 border border-yellow-500/30">
                Minor Project
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:flex items-center gap-1.5">
              <span>AI-Based Intrusion Detection System</span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-300 font-medium">Nandini Pandey &amp; Nagesh</span>
            </p>
          </div>
        </div>

        {/* Center: Real-Time Operational Clock & Live Guard Status */}
        <div className="hidden xl:flex items-center gap-4 bg-neutral-900/80 px-4 py-1.5 rounded-xl border border-neutral-800/90 text-xs font-mono text-neutral-300 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span>UTC: {currentTime.toUTCString().slice(17, 25)}</span>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-400">LOC: {currentTime.toLocaleTimeString()}</span>
          </div>
          <span className="text-neutral-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
            <span className="text-yellow-400 font-bold uppercase text-[10px]">24x7 Engine Armed</span>
          </div>
        </div>

        {/* Right: Actions, Simulation & Profile */}
        <div className="flex items-center gap-2.5">
          {/* WebSocket Stream Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-neutral-900/90 border border-neutral-800">
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-wide uppercase transition-all shadow-md ${
              isSimulating
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black shadow-yellow-950/40 active:scale-95 border border-yellow-400/50'
            }`}
            title="Execute automated 5-stage APT attack scenario for evaluation"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Attacking...' : '⚡ Run Simulation'}</span>
          </button>

          {/* User Profile & Role Tag */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <div className="flex items-center gap-2 bg-neutral-900/90 px-2.5 py-1 rounded-lg border border-neutral-800">
                <UserIcon className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-semibold text-neutral-200">{currentUser.username}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${roleColors[currentUser.role] || 'bg-neutral-800 text-neutral-400'}`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
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
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-xs border shadow-2xl backdrop-blur-xl ${
          simMessage.type === 'success' 
            ? 'bg-neutral-950/95 border-amber-500/70 text-yellow-300' 
            : 'bg-rose-950/95 border-rose-700 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {simMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-yellow-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span className="font-semibold">{simMessage.text}</span>
          </div>
          <button onClick={() => setSimMessage(null)} className="text-neutral-400 hover:text-white text-xs ml-2">✕</button>
        </div>
      )}
    </header>
  );
}
