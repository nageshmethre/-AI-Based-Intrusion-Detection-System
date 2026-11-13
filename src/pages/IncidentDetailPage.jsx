import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  FileDown,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidentDetail(id);
      setIncident(res);
      setNotes(res.analyst_notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    setPdfMessage(null);
    try {
      const res = await api.generateReport({ incident_id: parseInt(id) });
      setPdfMessage({
        type: 'success',
        text: `Report generated: ${res.filename}`,
        url: res.download_url
      });
      window.open(res.download_url, '_blank');
    } catch (err) {
      setPdfMessage({ type: 'error', text: err.message || 'Report generation failed' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const updated = await api.updateIncident(id, { analyst_notes: notes });
      setIncident(updated);
    } catch (err) {
      alert(err.message || 'Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading || !incident) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/incidents')}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </button>

        <button
          onClick={handleGeneratePdf}
          disabled={pdfLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 shadow-md transition-colors"
        >
          <FileDown className="w-4 h-4" />
          <span>{pdfLoading ? 'Generating PDF...' : 'Download Incident PDF'}</span>
        </button>
      </div>

      {pdfMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
          pdfMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
        }`}>
          <span>{pdfMessage.text}</span>
          {pdfMessage.url && (
            <a href={pdfMessage.url} target="_blank" rel="noreferrer" className="underline font-bold text-yellow-400">
              Download Again
            </a>
          )}
        </div>
      )}

      {/* Incident Header Card */}
      <div className="cyber-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-rose-400">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-yellow-400 font-bold">{incident.incident_id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/40 bg-rose-500/20 text-rose-300">
                  {incident.severity}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 border border-neutral-700 text-neutral-300">
                  {incident.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {incident.title}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">{incident.summary}</p>
            </div>
          </div>

          <div className="text-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Incident Risk</span>
            <div className="text-3xl font-extrabold font-mono text-rose-400 mt-0.5">
              {incident.risk_score?.toFixed(0)}
            </div>
            <span className="text-[10px] text-neutral-500">{incident.alert_count} Alerts Linked</span>
          </div>
        </div>

        {/* Campaign Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans">First Observed</span>
            <span className="text-neutral-200">{new Date(incident.start_time).toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Last Activity</span>
            <span className="text-neutral-200">{new Date(incident.end_time || incident.start_time).toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Offending Source</span>
            <span className="text-rose-400">{incident.primary_ip || 'Internal'}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Target Asset</span>
            <span className="text-yellow-400">{incident.primary_user || 'Multiple'}</span>
          </div>
        </div>
      </div>

      {/* Correlated Alerts Sequence */}
      <div className="cyber-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-3">
          Correlated Alerts Sequence ({incident.alerts?.length || 0})
        </h3>
        <div className="space-y-2">
          {incident.alerts && incident.alerts.length > 0 ? (
            incident.alerts.map((alt) => (
              <div
                key={alt.id}
                onClick={() => navigate(`/alerts/${alt.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 hover:border-yellow-500/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-yellow-400 font-bold">{alt.alert_id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-500/40 text-rose-300">
                    {alt.severity}
                  </span>
                  <span className="text-xs font-semibold text-neutral-200">{alt.attack_type}</span>
                  <span className="text-xs text-neutral-400 hidden sm:inline">{alt.description}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-amber-400 font-bold">{alt.risk_score?.toFixed(0)}/100</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500">No individual alerts linked directly.</p>
          )}
        </div>
      </div>

      {/* Analyst Investigation Notes */}
      <div className="cyber-card p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
          Analyst Investigation Notes &amp; Remediation Plan
        </h3>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Document incident findings, verified attack vectors, and applied counter-measures..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-yellow-500 transition"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-md disabled:opacity-50 transition active:scale-95"
          >
            {savingNotes ? 'Saving...' : 'Save Analyst Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}