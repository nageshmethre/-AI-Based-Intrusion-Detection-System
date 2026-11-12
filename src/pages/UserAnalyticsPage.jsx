import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { api } from '../services/api';

export function UserAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialUser = searchParams.get('user') || 'backup_admin';

  const [username, setUsername] = useState(initialUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runUserAnalysis = async (userToQuery) => {
    if (!userToQuery) return;
    setLoading(true);
    try {
      const res = await api.investigateUser(userToQuery);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUser) {
      runUserAnalysis(initialUser);
    }
  }, [initialUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ user: username });
    runUserAnalysis(username);
  };

  // Convert hours dictionary to chart format
  const hoursData = data?.login_hours
    ? Object.entries(data.login_hours).map(([hour, count]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        count
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
          User Behavior &amp; Authentication Analytics
        </h1>
        <p className="text-xs text-slate-400">
          Baseline authentication profiling, off-hours access patterns, and impossible travel detection
        </p>
      </div>

      {/* Search Input */}
      <div className="cyber-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Users className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Username to Profile (e.g. backup_admin, admin, developer1)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md disabled:opacity-50"
          >
            {loading ? 'Profiling...' : 'Analyze User'}
          </button>
        </form>
      </div>

      {data && (
        <div className="space-y-4">
          {/* User Profile Card */}
          <div className="cyber-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-cyan-400">@{data.username}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    data.threat_level === 'COMPROMISED_RISK' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    data.threat_level === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {data.threat_level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Active across {data.source_ips.length} source IPs • {data.off_hours_logins} off-hours events flagged
                </p>
              </div>

              <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800 min-w-[120px]">
                <span className="text-[10px] uppercase font-bold text-slate-500">Risk Score</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                  {data.risk_score?.toFixed(0)} / 100
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Logins</span>
                <p className="font-mono text-lg font-bold text-white mt-1">{data.login_count}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Failed Attempts</span>
                <p className="font-mono text-lg font-bold text-rose-400 mt-1">{data.failed_login_count}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Successful Logins</span>
                <p className="font-mono text-lg font-bold text-emerald-400 mt-1">{data.successful_login_count}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Associated Source IPs</span>
                <p className="font-mono text-lg font-bold text-cyan-400 mt-1">{data.source_ips.length}</p>
              </div>
            </div>

            {/* Source IPs */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2">Authenticated Source IPs</span>
              <div className="flex flex-wrap gap-2">
                {data.source_ips.map((ip, i) => (
                  <span
                    key={i}
                    onClick={() => navigate(`/ip-investigation?ip=${ip}`)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono cursor-pointer transition-colors"
                  >
                    {ip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Login Activity By Hour (Section 15: Login Times) */}
          <div className="cyber-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">
              Authentication Distribution by Hour of Day
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Highlights off-hours and irregular access shifts</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursData}>
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" name="Logins" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
