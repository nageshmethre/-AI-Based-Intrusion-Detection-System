import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useWebSocket } from '../hooks/useWebSocket';
import { AlertOctagon, X, ArrowRight } from 'lucide-react';

export function DashboardLayout({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeToast, setActiveToast] = useState(null);

  const handleAlertReceived = (alert) => {
    setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
    setActiveToast(alert);
    // Dismiss toast after 7 seconds
    setTimeout(() => {
      setActiveToast((current) => (current && current.id === alert.id ? null : current));
    }, 7000);
  };

  const { isConnected } = useWebSocket(handleAlertReceived);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar
        currentUser={currentUser}
        isConnected={isConnected}
        onSimulationComplete={() => {
          // Trigger refresh across pages if needed
          window.dispatchEvent(new Event('soc-refresh'));
        }}
        onLogout={onLogout}
      />

      {/* Real-time Alert Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900/95 border border-rose-500/50 rounded-xl p-4 shadow-2xl shadow-rose-950/50 backdrop-blur-xl animate-bounce-subtle">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 animate-pulse" />
              <span>Live Threat Intercepted</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                {activeToast.severity}
              </span>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-200 font-semibold">{activeToast.attack_type}</p>
          <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{activeToast.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-400">
              Risk: {activeToast.risk_score?.toFixed(0)}/100
            </span>
            <button
              onClick={() => {
                setActiveToast(null);
                navigate(`/alerts/${activeToast.id}`);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <span>Investigate Alert</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar alertCount={liveAlerts.length} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
