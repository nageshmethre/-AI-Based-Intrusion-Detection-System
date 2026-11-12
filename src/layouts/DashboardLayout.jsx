import React, { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useWebSocket } from '../hooks/useWebSocket';
import { AlertOctagon, X, ArrowRight } from 'lucide-react';

export function DashboardLayout({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeToast, setActiveToast] = useState(null);

  const handleAlertReceived = useCallback((alert) => {
    setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
    setActiveToast(alert);
    // Dismiss toast after 7 seconds
    setTimeout(() => {
      setActiveToast((current) => (current && current.id === alert.id ? null : current));
    }, 7000);
  }, []);

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
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border border-rose-500/50 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4" />
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
          <p className="text-xs text-white font-medium mt-2">
            {activeToast.title}
          </p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400 font-mono">
              Risk: <strong className="text-rose-400">{Math.round(activeToast.risk_score)}/100</strong>
            </span>
            <button
              onClick={() => {
                navigate(`/alerts/${activeToast.id}`);
                setActiveToast(null);
              }}
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Investigate <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentUser={currentUser} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070B14]">
          <Outlet context={{ liveAlerts }} />
        </main>
      </div>
    </div>
  );
}
