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
    HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    LOW: 'bg-neutral-800 text-neutral-300 border-neutral-700'
  };

  const statusColors = {
    OPEN: 'bg-rose-950/60 text-rose-400 border-rose-800',
    IN_PROGRESS: 'bg-amber-950/60 text-amber-400 border-amber-800',
    RESOLVED: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
    CLOSED: 'bg-neutral-900 text-neutral-400 border-neutral-700'
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Security Incidents &amp; Attack Campaigns</span>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">
              Campaign Correlation
            </span>
          </h1>
          <p className="text-xs text-neutral-400">
            Automated correlation groups multi-stage attack indicators into persistent incident campaigns
          </p>
        </div>
        <button
          onClick={fetchIncidents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-yellow-400 hover:border-yellow-500/40 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-neutral-500">
            <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin mx-auto mb-2" />
            <span>Loading correlated incidents...</span>
          </div>
        ) : incidents.length > 0 ? (
          incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="cyber-card p-5 hover:border-yellow-500/40 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-yellow-400">{inc.incident_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityColors[inc.severity]}`}>
                      {inc.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusColors[inc.status]}`}>
                      {inc.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 group-hover:text-yellow-400 transition-colors">
                    {inc.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Risk</span>
                  <span className="font-mono font-bold text-amber-400 text-base">{inc.risk_score?.toFixed(0)}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {inc.summary}
              </p>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-800 text-neutral-500 font-mono">
                <div>
                  <span>IP: </span>
                  <span className="text-neutral-300">{inc.primary_ip || 'Internal'}</span>
                  <span className="mx-2">•</span>
                  <span>Target: </span>
                  <span className="text-neutral-300">{inc.primary_user || 'Service'}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 font-sans font-semibold">
                  <span>{inc.alert_count} Alerts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-neutral-500 cyber-card">
            No incidents formed yet. Trigger a security simulation or upload an attack log to see automated incident correlation.
          </div>
        )}
      </div>
    </div>
  );
}