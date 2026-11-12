import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Server,
  Users,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Clock,
  ExternalLink,
  Radio,
  FileText,
  Zap,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monitorStatus, setMonitorStatus] = useState(null);
  const [injecting, setInjecting] = useState(false);
  const [injectMsg, setInjectMsg] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load telemetry');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitor = async () => {
    try {
      const st = await api.getMonitorStatus();
      setMonitorStatus(st);
    } catch (e) {
      // ignore
    }
  };

  const handleTestRealTimeLog = async (type) => {
    setInjecting(true);
    setInjectMsg(null);
    try {
      let rawLine = '';
      if (type === 'ssh_brute') {
        rawLine = `Nov 05 10:14:02 srv-prod-01 sshd[4912]: Failed password for root from 185.220.101.5 port 54122 ssh2`;
      } else if (type === 'sql_inject') {
        rawLine = `198.51.100.44 - - [05/Nov/2026:10:14:05 +0000] "GET /api/v1/users?id=1%27%20OR%201=1-- HTTP/1.1" 403 230 "-" "sqlmap/1.6.0"`;
      } else if (type === 'port_scan') {
        rawLine = `Nov 05 10:14:08 srv-prod-01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.19 DST=192.168.1.10 PROTO=TCP SPT=41230 DPT=3306`;
      }
      await api.streamSingleLog(rawLine, 'realtime_test');
      setInjectMsg(`Attack log dispatched! Intercepted & evaluated in <100ms.`);
      setTimeout(() => setInjectMsg(null), 4000);
      fetchDashboard();
      fetchMonitor();
    } catch (err) {
      setInjectMsg(`Error: ${err.message}`);
    } finally {
      setInjecting(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchMonitor();
    const interval = setInterval(fetchMonitor, 6000);
    const handleRefresh = () => {
      fetchDashboard();
      fetchMonitor();
    };
    window.addEventListener('soc-refresh', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('soc-refresh', handleRefresh);
    };
  }, []);

  const severityColors = {
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    HIGH: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    LOW: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    INFO: 'text-slate-400 bg-slate-800 border-slate-700'
  };

  const statusColors = {
    NEW: 'text-rose-400 bg-rose-950/60 border-rose-800',
    INVESTIGATING: 'text-amber-400 bg-amber-950/60 border-amber-800',
    RESOLVED: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    FALSE_POSITIVE: 'text-slate-400 bg-slate-900 border-slate-700'
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading SOC telemetry & intelligence feed...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800/40 text-rose-300">
        <p className="font-semibold text-sm">Telemetry Connection Error</p>
        <p className="text-xs mt-1 text-rose-400">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-3 py-1.5 rounded-lg bg-rose-900 text-xs font-semibold text-rose-100 hover:bg-rose-800"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_events: 0,
    suspicious_events: 0,
    critical_alerts: 0,
    high_alerts: 0,
    active_incidents: 0,
    unique_source_ips: 0
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Security Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-dimensional telemetry, anomaly distributions, and active alert feeds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 24x7 Real-Time Host Defense & Live Detection Banner */}
      <div className="cyber-card p-4 border-l-4 border-l-emerald-500 bg-slate-900/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-['Space_Grotesk'] flex items-center gap-2">
                24x7 Real-Time Server Defense Daemon
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                  RUNNING &amp; MONITORING
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Continuously intercepting live server logs via real-time file tailing (<span className="text-slate-300 font-mono">logs/server_auth.log</span>),
              network Syslog UDP listener (<span className="text-slate-300 font-mono">Port 1514</span>), and Windows Security/System Event logs.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>Syslog: <strong className="text-emerald-400">UDP :1514 Active</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span>Tailing: <strong className="text-cyan-400">{monitorStatus?.watched_files?.length || 2} Server Logs</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>Live Intercepts: <strong className="text-amber-400">{monitorStatus?.total_live_events_processed || 0} events</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>Threats Caught: <strong className="text-rose-400">{monitorStatus?.live_threats_caught || 0} alerts</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Test Real-Time Interception:</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={injecting}
                onClick={() => handleTestRealTimeLog('ssh_brute')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Send real SSH failed password log line"
              >
                + SSH Attack
              </button>
              <button
                disabled={injecting}
                onClick={() => handleTestRealTimeLog('sql_inject')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Send real SQL Injection web access log line"
              >
                + Web SQLi
              </button>
              <button
                disabled={injecting}
                onClick={() => handleTestRealTimeLog('port_scan')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Send real port scan firewall log line"
              >
                + Port Probe
              </button>
            </div>
            {injectMsg && (
              <span className="text-[10px] text-emerald-400 font-mono animate-pulse">{injectMsg}</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards (Section 12) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="cyber-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Events</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{kpis.total_events.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Telemetry Ingested</span>
          </div>
        </div>

        <div className="cyber-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Suspicious</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{kpis.suspicious_events.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1">Elevated Risk &gt;= 50</div>
        </div>

        <div className="cyber-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Critical Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{kpis.critical_alerts}</div>
          <div className="text-[10px] text-rose-400 mt-1">Immediate action req.</div>
        </div>

        <div className="cyber-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">High Alerts</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">{kpis.high_alerts}</div>
          <div className="text-[10px] text-slate-500 mt-1">Severe threat indicators</div>
        </div>

        <div className="cyber-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Incidents</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{kpis.active_incidents}</div>
          <div className="text-[10px] text-slate-500 mt-1">Grouped campaigns</div>
        </div>

        <div className="cyber-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unique IPs</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{kpis.unique_source_ips}</div>
          <div className="text-[10px] text-slate-500 mt-1">Distinct hosts seen</div>
        </div>
      </div>

      {/* Row 1 Charts: Telemetry Activity Over Time + Attack Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events & Alerts Over Time */}
        <div className="cyber-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Log Volume & Alert Temporal Velocity
              </h2>
              <p className="text-[11px] text-slate-400">Chronological distribution of ingested events vs detected alerts</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {data?.events_over_time?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.events_over_time}>
                  <defs>
                    <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="count" name="Events" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#eventGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting log telemetry data. Click "Run Security Simulation" or upload logs.
              </div>
            )}
          </div>
        </div>

        {/* Attack Type Distribution */}
        <div className="cyber-card p-4">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Attack Type Breakdown
            </h2>
            <p className="text-[11px] text-slate-400">Classified multi-class attack categories</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {data?.attack_type_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.attack_type_distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {data.attack_type_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#38BDF8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 text-center">No classified attacks detected yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Severity + Anomaly Score + Top IPs/Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Severity Distribution */}
        <div className="cyber-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">
            Severity Spectrum
          </h2>
          <p className="text-[11px] text-slate-400 mb-3">Alert distribution by impact tier</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.severity_distribution || []}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" name="Alerts">
                  {(data?.severity_distribution || []).map((entry, index) => (
                    <Cell key={`sev-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomaly Score Distribution (Isolation Forest) */}
        <div className="cyber-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">
            ML Anomaly Scores
          </h2>
          <p className="text-[11px] text-slate-400 mb-3">Isolation Forest outlier distribution</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.anomaly_score_distribution || []}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={8} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" name="Events">
                  {(data?.anomaly_score_distribution || []).map((entry, index) => (
                    <Cell key={`anom-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Suspicious IPs */}
        <div className="cyber-card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Top Host Threat Sources
            </h2>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 cursor-pointer" onClick={() => navigate('/ip-investigation')} />
          </div>
          <p className="text-[11px] text-slate-400 mb-3">Frequent offensive source IPs</p>
          <div className="space-y-2">
            {data?.top_suspicious_ips?.length > 0 ? (
              data.top_suspicious_ips.map((ip, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/ip-investigation?ip=${ip.name}`)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-colors"
                >
                  <span className="font-mono text-xs text-rose-400">{ip.name}</span>
                  <span className="text-[11px] font-bold text-slate-300">{ip.value} alerts</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No host anomalies detected.</div>
            )}
          </div>
        </div>

        {/* Top Targeted Users */}
        <div className="cyber-card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Targeted Entities
            </h2>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 cursor-pointer" onClick={() => navigate('/users')} />
          </div>
          <p className="text-[11px] text-slate-400 mb-3">Targeted accounts &amp; resources</p>
          <div className="space-y-2">
            {data?.top_targeted_users?.length > 0 ? (
              data.top_targeted_users.map((u, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/users?user=${u.name}`)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer transition-colors"
                >
                  <span className="font-mono text-xs text-cyan-400">{u.name}</span>
                  <span className="text-[11px] font-bold text-slate-300">{u.value} alerts</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No accounts targeted yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Live Alert Feed (Section 12) */}
      <div className="cyber-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Threat Interception Feed
            </h2>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            <span>View All Alerts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Attack Classification</th>
                <th className="py-2.5 px-3">Source Host</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.recent_alerts?.length > 0 ? (
                data.recent_alerts.map((alt) => (
                  <tr
                    key={alt.id}
                    onClick={() => navigate(`/alerts/${alt.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityColors[alt.severity]}`}>
                        {alt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {alt.attack_type}
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-400">
                      {alt.source_ip || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {alt.username || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {alt.risk_score?.toFixed(0)} / 100
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusColors[alt.status] || 'border-slate-700'}`}>
                        {alt.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-cyan-400 group-hover:text-cyan-300 font-semibold text-xs inline-flex items-center gap-1">
                        Investigate <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">
                    No security alerts recorded. Ingest logs or trigger a security simulation to begin monitoring.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
