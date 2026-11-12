import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Globe2,
  Search,
  RefreshCw,
  ShieldAlert,
  Server,
  KeyRound,
  ArrowRight,
  Clock,
  Layers,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export function IPInvestigationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialIp = searchParams.get('ip') || '198.51.100.77';

  const [targetIp, setTargetIp] = useState(initialIp);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runInvestigation = async (ipToSearch) => {
    if (!ipToSearch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.investigateIP(ipToSearch);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to query IP telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialIp) {
      runInvestigation(initialIp);
    }
  }, [initialIp]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ ip: targetIp });
    runInvestigation(targetIp);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
          Host &amp; IP Intelligence Deep-Dive
        </h1>
        <p className="text-xs text-slate-400">
          Forensic investigation of IP addresses, probed destination ports, targeted usernames, and event chronologies
        </p>
      </div>

      {/* Search Input */}
      <div className="cyber-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Globe2 className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
            <input
              type="text"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="Enter IPv4 Address to Investigate (e.g. 198.51.100.77, 192.168.1.100)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Investigate Host'}
          </button>
        </form>
      </div>

      {data && (
        <div className="space-y-4">
          {/* IP Forensics Header Card */}
          <div className="cyber-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-white">{data.ip}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    data.threat_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    data.threat_level === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                    'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {data.threat_level} THREAT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Observed from {data.first_seen ? new Date(data.first_seen).toLocaleString() : 'N/A'} to {data.last_seen ? new Date(data.last_seen).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800 min-w-[120px]">
                <span className="text-[10px] uppercase font-bold text-slate-500">Max Risk Score</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                  {data.risk_score?.toFixed(0)} / 100
                </div>
              </div>
            </div>

            {/* KPI metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Events</span>
                <p className="font-mono text-lg font-bold text-white mt-1">{data.total_events}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Failed Authentications</span>
                <p className="font-mono text-lg font-bold text-rose-400 mt-1">{data.failed_logins}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Successful Logins</span>
                <p className="font-mono text-lg font-bold text-emerald-400 mt-1">{data.successful_logins}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Web Requests</span>
                <p className="font-mono text-lg font-bold text-cyan-400 mt-1">{data.total_requests}</p>
              </div>
            </div>

            {/* Target Entities & Probed Ports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">Targeted User Accounts</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.targeted_users.length > 0 ? (
                    data.targeted_users.map((u, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs font-mono">
                        {u}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None targeted</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">Probed Destination Ports</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.targeted_ports.length > 0 ? (
                    data.targeted_ports.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 text-xs font-mono">
                        Port {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None probed</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Alerts */}
          {data.related_alerts?.length > 0 && (
            <div className="cyber-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                Triggered Security Alerts ({data.related_alerts.length})
              </h3>
              <div className="space-y-2">
                {data.related_alerts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => navigate(`/alerts/${alt.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-cyan-400 font-bold">{alt.alert_id}</span>
                      <span className="text-xs text-slate-200 font-semibold">{alt.attack_type}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline">{alt.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-mono text-xs font-bold">{alt.risk_score?.toFixed(0)}/100</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chronological Event Timeline */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Chronological Host Event Stream
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Target</th>
                    <th className="py-2 px-3">Raw Log Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {data.timeline_events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 px-3 font-sans text-slate-200">{ev.action}</td>
                      <td className="py-2 px-3">
                        <span className={ev.status === 'FAILURE' ? 'text-rose-400' : 'text-emerald-400'}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-cyan-400">{ev.username || ev.resource || '-'}</td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-md">{ev.raw_log}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
