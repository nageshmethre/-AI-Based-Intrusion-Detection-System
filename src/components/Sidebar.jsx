import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  AlertOctagon,
  Flame,
  Globe2,
  Users,
  Fingerprint,
  Sliders,
  BrainCircuit,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Cpu
} from 'lucide-react';

export function Sidebar({ alertCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);

  const sections = [
    {
      title: 'Operations',
      items: [
        { to: '/', label: 'SOC Dashboard', icon: LayoutDashboard },
        { to: '/events', label: 'Events Explorer', icon: FileText },
        { to: '/alerts', label: 'Alerts Queue', icon: AlertOctagon, badge: alertCount },
        { to: '/incidents', label: 'Incident Hub', icon: Flame },
      ]
    },
    {
      title: 'Forensics & Intel',
      items: [
        { to: '/ip-investigation', label: 'IP Forensics', icon: Globe2 },
        { to: '/users', label: 'User Analytics', icon: Users },
        { to: '/iocs', label: 'IOC Threat Hub', icon: Fingerprint },
      ]
    },
    {
      title: 'Defense & AI',
      items: [
        { to: '/rules', label: 'Detection Rules', icon: Sliders },
        { to: '/models', label: 'ML Models & Matrix', icon: BrainCircuit },
        { to: '/reports', label: 'Executive PDF Audit', icon: FileDown },
      ]
    }
  ];

  return (
    <aside
      className={`shrink-0 bg-[#070B14] border-r border-slate-800/90 h-full overflow-y-auto p-2.5 flex flex-col justify-between transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Toggle Collapse Button */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'} mb-2 text-slate-500`}>
          {!collapsed && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
              Navigation Console
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border-l-2 border-l-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-950/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110`} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Telemetry HUD */}
      {!collapsed ? (
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Host Defense</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
              24x7 Active
            </span>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-slate-400">
            <div className="flex items-center justify-between text-slate-400">
              <span>Classifier:</span>
              <span className="text-cyan-400 font-bold">RF + DT + GB</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Anomaly Engine:</span>
              <span className="text-emerald-400 font-bold">Isolation Forest</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Syslog UDP:</span>
              <span className="text-amber-400 font-bold">Port 1514</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
            <span>CIC-IDS2017 Ready</span>
            <span className="text-cyan-400">v1.0 Pro</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center p-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" title="Host Defense: 24x7 Active" />
        </div>
      )}
    </aside>
  );
}
