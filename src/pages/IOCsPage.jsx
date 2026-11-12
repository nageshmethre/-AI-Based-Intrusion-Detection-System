import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export function IOCsPage() {
  const [iocs, setIocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const fetchIOCs = async () => {
    try {
      setLoading(true);
      const params = { page, page_size: 50 };
      if (search) params.search = search;
      if (typeFilter) params.ioc_type = typeFilter;
      if (riskFilter) params.risk_level = riskFilter;

      const res = await api.getIOCs(params);
      setIocs(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIOCs();
  }, [page, typeFilter, riskFilter]);

  const handleStatusToggle = async (ioc, newStatus) => {
    try {
      await api.updateIOC(ioc.id, { status: newStatus });
      fetchIOCs();
    } catch (err) {
      alert(err.message || 'Failed to update IOC');
    }
  };

  const riskColors = {
    MALICIOUS: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    SUSPICIOUS: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    SAFE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Threat Intelligence &amp; IOC Repository
          </h1>
          <p className="text-xs text-slate-400">
            Automated extraction of IPv4 addresses, URLs, domains, and cryptographic hashes from ingested logs
          </p>
        </div>
        <button
          onClick={fetchIOCs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh IOCs</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="cyber-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search indicator value (IP, URL, Hash)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchIOCs()}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Indicator Types</option>
          <option value="IPV4">IPv4 Addresses</option>
          <option value="URL">URLs / URIs</option>
          <option value="DOMAIN">Domains</option>
          <option value="SHA256">SHA256 Hashes</option>
          <option value="MD5">MD5 Hashes</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => {
            setRiskFilter(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Risk Ratings</option>
          <option value="SUSPICIOUS">Suspicious</option>
          <option value="MALICIOUS">Malicious</option>
          <option value="SAFE">Safe / RFC-1918</option>
        </select>
      </div>

      {/* Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-4">Indicator Value</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Event Count</th>
                <th className="py-2.5 px-3">First Seen</th>
                <th className="py-2.5 px-3">Last Seen</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto mb-2" />
                    <span>Loading threat intelligence...</span>
                  </td>
                </tr>
              ) : iocs.length > 0 ? (
                iocs.map((ioc) => (
                  <tr key={ioc.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-200 truncate max-w-sm">
                      {ioc.value}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {ioc.ioc_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColors[ioc.risk_level] || 'bg-slate-800 text-slate-400'}`}>
                        {ioc.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        ioc.status === 'BLOCKED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        ioc.status === 'WHITELISTED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {ioc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-cyan-400 font-bold">
                      {ioc.event_count}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans text-[10px]">
                      {new Date(ioc.first_seen).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans text-[10px]">
                      {new Date(ioc.last_seen).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1">
                        {ioc.status !== 'BLOCKED' && (
                          <button
                            onClick={() => handleStatusToggle(ioc, 'BLOCKED')}
                            className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-semibold"
                          >
                            Block
                          </button>
                        )}
                        {ioc.status !== 'WHITELISTED' && (
                          <button
                            onClick={() => handleStatusToggle(ioc, 'WHITELISTED')}
                            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-semibold"
                          >
                            Whitelist
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 font-sans">
                    No IOCs extracted yet. Ingest logs to automatically extract IP, domain, URL, and hash indicators.
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
