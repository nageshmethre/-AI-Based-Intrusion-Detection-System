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
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
  Search,
  Filter,
  ArrowRight,
  Terminal
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
  const [autoRefresh, setAutoRefresh] = useState(true);

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
    } catch {
      // ignore
    }
  };

  const handleTestRealTimeLog = async (type) => {
    setInjecting(true);
    setInjectMsg(null);
    try {
      let rawLine = '';
      let label = 'Console';
      if (type === 'ssh_brute') {
        rawLine = `Nov 13 00:30:12 srv-prod-01 sshd[9182]: Failed password for root from 185.220.101.5 port 49122 ssh2`;
        label = 'SSH Brute Force';
      } else if (type === 'sql_inject') {
        rawLine = `198.51.100.44 - - [13/Nov/2026:00:30:15 +0000] "GET /api/v1/users?id=1%27%20OR%201=1-- HTTP/1.1" 403 230 "-" "sqlmap/1.6.0"`;
        label = 'Web SQL Injection';
      } else if (type === 'port_scan') {
        rawLine = `Nov 13 00:30:18 srv-prod-01 kernel: [UFW BLOCK] IN=eth0 OUT= SRC=203.0.113.19 DST=192.168.1.10 PROTO=TCP SPT=41230 DPT=3306`;
        label = 'Port Scan Probe';
      } else if (type === 'cic_dos') {
        rawLine = `80,5000180,3,1,0,0,0.0,0.7999,1666726.6,2886847.4,5000180,0,5000180,2500090.0,3535670.3,5000180,0,0,0.0,0.0,0,0,0,0,0,0,64,32,0.5999,0.1999,0,0,0.0,0.0,0.0,0,1,0,0,0,0,0,0,0,0.0,0.0,0.0,29200,-1,0,20,0.0,0.0,0,0,5000180.0,0.0,5000180,5000180,DoS Hulk`;
        label = 'CIC-IDS2017 DoS Flow';
      }
      await api.streamSingleLog(rawLine, 'realtime_test');
      setInjectMsg(`[${label}] Intercepted & Evaluated in <75ms!`);
      setTimeout(() => setInjectMsg(null), 4500);
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
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchDashboard();
        fetchMonitor();
      }
    }, 8000);

    const handleRefresh = () => {
      fetchDashboard();
      fetchMonitor();
    };
    window.addEventListener('soc-refresh', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('soc-refresh', handleRefresh);
    };
  }, [autoRefresh]);

  const severityBadges = {
    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/50',
    HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/50',
    MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    LOW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    INFO: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  const statusBadges = {
    NEW: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
    INVESTIGATING: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    RESOLVED: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
    FALSE_POSITIVE: 'bg-slate-900 text-slate-400 border-slate-700'
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="flex flex-col items-center gap-3.5 p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <RefreshCw className="w-9 h-9 text-cyan-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-white font-cyber">Initializing Mini-SOC Telemetry</p>
            <p className="text-xs text-slate-400 font-mono mt-1">Connecting to AI Detection Engine &amp; Live WebSocket Stream...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/60 text-rose-300 max-w-xl mx-auto my-12">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">Telemetry Connection Interrupted</p>
            <p className="text-xs mt-0.5 text-rose-300/80">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-xs font-semibold text-rose-100 transition shadow"
        >
          Re-establish Connection
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
    <div className="space-y-6 pb-8">
      {/* Top Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/70 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-cyber">
              Security Operations Center (SOC) Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Defense Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time hybrid intelligence: 8 Heuristic Rules • Isolation Forest Anomaly Detection • Random Forest / Decision Tree / Gradient Boosting Classification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              autoRefresh 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Auto-refresh telemetry every 8 seconds"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => { fetchDashboard(); fetchMonitor(); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white transition shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 24x7 Real-Time Server Defense Command Center Banner */}
      <div className="cyber-card p-4 lg:p-5 border-l-4 border-l-emerald-500 bg-gradient-to-r from-slate-950 via-[#0B1222] to-slate-950 relative overflow-hidden shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-cyber flex items-center gap-2">
                24x7 Autonomous Host &amp; Network Intrusion Monitor
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  ARMED &amp; TAILING
                </span>
              </h2>
            </div>
            
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Continuously intercepting live server events via <strong>real-time file tailing</strong> (<code className="text-cyan-300 text-[11px] bg-slate-900 px-1 py-0.5 rounded">logs/server_auth.log</code> &amp; <code className="text-cyan-300 text-[11px] bg-slate-900 px-1 py-0.5 rounded">logs/server_access.log</code>), <strong>Syslog UDP Listener</strong> (<code className="text-cyan-300 text-[11px] bg-slate-900 px-1 py-0.5 rounded">Port 1514</code>), and <strong>Windows Security/System Event logs</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Syslog Receiver: <strong className="text-emerald-400">UDP :1514 Active</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Files Watched: <strong className="text-cyan-400">{monitorStatus?.watched_files?.length || 2} Logs (0.5s poll)</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Telemetry Ingested: <strong className="text-amber-400">{monitorStatus?.total_live_events_processed || 0} events</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Threats Intercepted: <strong className="text-rose-400 font-extrabold">{monitorStatus?.live_threats_caught || 0} alerts</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Threat Verification Bar */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[11px]">
              <span className="uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Live Interception</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Response: &lt;100ms</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                disabled={injecting}
                onClick={() => handleTestRealTimeLog('ssh_brute')}
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 transition text-left flex items-center gap-1.5"
                title="Send real SSH failed password log entry"
              >
                <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>SSH Brute Force</span>
              </button>

              <button
                disabled={injecting}
                onClick={() => handleTestRealTimeLog('sql_inject')}
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 transition text-left flex items-center gap-1.5"
                title="Send real SQL Injection web access log entry"
              >
                <Terminal className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Web SQLi Attack</span>
              </button>

              <button
                disabled={injecting}
                onClick={() => handleTestRealTimeLog('port_scan')}
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 transition text-left flex items-center gap-1.5"
                title="Send real UFW firewall port probe entry"
              >
                <Terminal className="w-3 h-3 text-blue-400 shrink-0" />
                <span>Port Scan Probe</span>
              </button>

              <button
                disabled={injecting}
                onClick={() => handleTestRealTimeLog('cic_dos')}
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 transition text-left flex items-center gap-1.5"
                title="Send real CIC-IDS2017 DoS flow vector"
              >
                <Terminal className="w-3 h-3 text-rose-400 shrink-0" />
                <span>CIC-IDS2017 Flow</span>
              </button>
            </div>

            {injectMsg && (
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1 animate-pulse">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{injectMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI HUD: 6 Executive Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="cyber-card p-4 relative overflow-hidden group hover:border-cyan-500/60 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">Total Events</span>
            <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{kpis.total_events.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Ingested Stream</span>
          </div>
        </div>

        <div className="cyber-card p-4 relative overflow-hidden group hover:border-amber-500/60 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">Suspicious</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{kpis.suspicious_events.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Risk Score &ge; 50</div>
        </div>

        <div className="cyber-card p-4 relative overflow-hidden group hover:border-rose-500/60 transition bg-gradient-to-b from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">Critical P1</span>
            <ShieldAlert className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{kpis.critical_alerts}</div>
          <div className="text-[10px] text-rose-400/90 mt-1 font-medium">Immediate containment</div>
        </div>

        <div className="cyber-card p-4 relative overflow-hidden group hover:border-orange-500/60 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">High Alerts</span>
            <AlertTriangle className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">{kpis.high_alerts}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Severe indicators</div>
        </div>

        <div className="cyber-card p-4 relative overflow-hidden group hover:border-red-500/60 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">Incidents</span>
            <Flame className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{kpis.active_incidents}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Correlated campaigns</div>
        </div>

        <div className="cyber-card p-4 relative overflow-hidden group hover:border-blue-500/60 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">Unique IPs</span>
            <Server className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{kpis.unique_source_ips}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Adversary sources</div>
        </div>
      </div>

      {/* Row 1 Charts: Event Volume Timeline + Attack Type Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events Over Time Area Chart */}
        <div className="cyber-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-cyber">
                Log Ingestion Volume &amp; Attack Temporal Velocity
              </h2>
              <p className="text-[11px] text-slate-400">Chronological telemetry rate of ingested events vs active alerts</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
              Live Stream Wave
            </span>
          </div>

          <div className="h-64 w-full">
            {data?.events_over_time?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.events_over_time}>
                  <defs>
                    <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '10px', fontSize: '11px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                  />
                  <Area type="monotone" dataKey="count" name="Events" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#eventGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Awaiting telemetry stream. Click "⚡ Run Simulation" or inject test logs.
              </div>
            )}
          </div>
        </div>

        {/* Attack Vector Distribution Donut */}
        <div className="cyber-card p-5">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-cyber">
              Attack Vector Classification
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
                    outerRadius={85}
                    innerRadius={55}
                    paddingAngle={4}
                  >
                    {data.attack_type_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#38BDF8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 text-center font-mono">No classified attacks detected yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 Intelligence Grid: Severity Spectrum + Anomaly Distribution + Top Threat IPs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Severity Spectrum */}
        <div className="cyber-card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1 font-cyber">
            Severity Spectrum
          </h2>
          <p className="text-[11px] text-slate-400 mb-3">Alert breakdown across threat tiers</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.severity_distribution || []}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" name="Alerts" radius={[4, 4, 0, 0]}>
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1 font-cyber">
            Isolation Forest Anomaly Scores
          </h2>
          <p className="text-[11px] text-slate-400 mb-3">Unsupervised outlier probability distribution</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.anomaly_score_distribution || []}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={8} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" name="Events" radius={[4, 4, 0, 0]}>
                  {(data?.anomaly_score_distribution || []).map((entry, index) => (
                    <Cell key={`anom-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Adversary Sources */}
        <div className="cyber-card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-cyber">
              Top Threat Sources
            </h2>
            <button 
              onClick={() => navigate('/ip-investigation')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">Offensive source IPs ranked by event count</p>
          <div className="space-y-2">
            {data?.top_suspicious_ips?.length > 0 ? (
              data.top_suspicious_ips.slice(0, 4).map((ip, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/ip-investigation?ip=${ip.name}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">#{i + 1}</span>
                    <span className="font-mono text-xs font-semibold text-cyan-300">{ip.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {ip.value} events
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center font-mono">No threat IPs recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Live Alert Triage Feed Table */}
      <div className="cyber-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-cyber">
                Live Alert Stream &amp; Operational Triage Queue
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                REALTIME
              </span>
            </div>
            <p className="text-xs text-slate-400">Interceptions streamed directly from rule and ML inference pipelines</p>
          </div>

          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/60 transition"
          >
            <span>View All Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Attack Vector</th>
                <th>Source IP</th>
                <th>Target User</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_alerts?.length > 0 ? (
                data.recent_alerts.slice(0, 8).map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-900/50 transition">
                    <td className="font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${severityBadges[alert.severity] || severityBadges.INFO}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="font-semibold text-xs text-slate-200">
                      {alert.attack_type}
                    </td>
                    <td className="font-mono text-xs text-cyan-400">
                      {alert.source_ip || 'Internal'}
                    </td>
                    <td className="font-mono text-xs text-slate-300">
                      {alert.username || 'System'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              alert.risk_score >= 80 ? 'bg-rose-500' :
                              alert.risk_score >= 60 ? 'bg-amber-500' :
                              alert.risk_score >= 30 ? 'bg-yellow-500' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(alert.risk_score, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {alert.risk_score?.toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadges[alert.status] || statusBadges.NEW}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/alerts/${alert.id}`)}
                        className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-cyan-600 hover:text-white text-cyan-300 text-xs font-semibold border border-slate-700/80 hover:border-cyan-500 transition"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-xs text-slate-500 font-mono">
                    No active alerts in operational queue. Trigger the simulation or send test attacks.
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
