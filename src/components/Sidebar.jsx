import React from 'react';
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
  FileDown
} from 'lucide-react';

export function Sidebar({ alertCount = 0 }) {
  const navItems = [
    { to: '/', label: 'SOC Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events Explorer', icon: FileText },
    { to: '/alerts', label: 'Alerts', icon: AlertOctagon, badge: alertCount },
    { to: '/incidents', label: 'Incidents', icon: Flame },
    { to: '/ip-investigation', label: 'IP Investigation', icon: Globe2 },
    { to: '/users', label: 'User Analytics', icon: Users },
    { to: '/iocs', label: 'IOC Repository', icon: Fingerprint },
    { to: '/rules', label: 'Detection Rules', icon: Sliders },
    { to: '/models', label: 'ML Analytics', icon: BrainCircuit },
    { to: '/reports', label: 'PDF Reports', icon: FileDown },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0B0F19] border-r border-slate-800/80 min-h-[calc(100vh-61px)] p-3 flex flex-col justify-between">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core Operations
        </div>
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {item.badge > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="pt-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Forensics & Intel
        </div>
        {navItems.slice(4, 7).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          AI & Governance
        </div>
        {navItems.slice(7).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Architecture Tag */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>Engine Status</span>
          <span className="text-emerald-400 text-[10px]">Active</span>
        </div>
        <div className="text-[10px] text-slate-500">
          IsoForest + RandomForest + 8 Detection Rules
        </div>
      </div>
    </aside>
  );
}
