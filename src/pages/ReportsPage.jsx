import React, { useState, useEffect } from 'react';
import {
  FileDown,
  RefreshCw,
  FileText,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export function ReportsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const [message, setMessage] = useState(null);

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

  const handleGeneratePdf = async (incidentId) => {
    setGeneratingId(incidentId);
    setMessage(null);
    try {
      const res = await api.generateReport({ incident_id: incidentId });
      setMessage({
        type: 'success',
        text: `Report generated: ${res.filename}`,
        url: res.download_url
      });
      window.open(res.download_url, '_blank');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Report generation failed' });
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Incident Reports &amp; Formal Documentation
          </h1>
          <p className="text-xs text-slate-400">
            Generate and export publication-ready PDF security incident reports with evidence grounding and remediation plans
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

      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{message.text}</span>
          </div>
          {message.url && (
            <a
              href={message.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-bold text-cyan-400 underline"
            >
              <span>Download PDF File</span>
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Incidents Ready For PDF Generation */}
      <div className="cyber-card p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Available Incident Dossiers ({incidents.length})
        </h2>

        <div className="divide-y divide-slate-800/80">
          {incidents.map((inc) => (
            <div key={inc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">{inc.incident_id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/40 bg-rose-500/20 text-rose-300">
                    {inc.severity}
                  </span>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    Risk: {inc.risk_score?.toFixed(0)}/100
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-white">{inc.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-1">{inc.summary}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleGeneratePdf(inc.id)}
                  disabled={generatingId === inc.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{generatingId === inc.id ? 'Generating...' : 'Export PDF Report'}</span>
                </button>
              </div>
            </div>
          ))}

          {incidents.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No incidents available. Run a security simulation or upload an attack log to generate incidents and PDF reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
