import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, RefreshCw, ArrowRight, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export function IncidentsPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidents({ page: 1, page_size: 50 });
      setIncidents(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const severityColors = {
    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    LOW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  };

  const statusColors = {
    OPEN: 'bg-rose-950/60 text-rose-400 border-rose-800',
    IN_PROGRESS: 'bg-amber-950/60 text-amber-400 border-amber-800',
    RESOLVED: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
    CLOSED: 'bg-slate-900 text-slate-400 border-slate-700'
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Security Incidents &amp; Attack Campaigns
          </h1>
          <p className="text-xs text-slate-400">
            Automated correlation groups multi-stage attack indicators into persistent incident campaigns
          </p>
        </div>
        <button
          onClick={fetchIncidents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
            <span>Loading correlated incidents...</span>
          </div>
        ) : incidents.length > 0 ? (
          incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="cyber-card p-5 hover:border-cyan-500/40 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{inc.incident_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityColors[inc.severity]}`}>
                      {inc.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusColors[inc.status]}`}>
                      {inc.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                    {inc.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Risk</span>
                  <span className="font-mono font-bold text-amber-400 text-base">{inc.risk_score?.toFixed(0)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {inc.summary}
              </p>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-500 font-mono">
                <div>
                  <span>IP: </span>
                  <span className="text-slate-300">{inc.primary_ip || 'Internal'}</span>
                  <span className="mx-2">•</span>
                  <span>Target: </span>
                  <span className="text-slate-300">{inc.primary_user || 'Service'}</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 font-sans font-semibold">
                  <span>{inc.alert_count} Alerts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-slate-500 cyber-card">
            No incidents formed yet. Trigger a security simulation or upload an attack log to see automated incident correlation.
          </div>
        )}
      </div>
    </div>
  );
}
