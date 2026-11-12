import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  BrainCircuit,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  RefreshCw,
  ExternalLink,
  Sliders,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export function AlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alert, setAlert] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfMessage, setPdfMessage] = useState(null);

  const fetchAlertData = async () => {
    try {
      setLoading(true);
      const altData = await api.getAlertDetail(id);
      setAlert(altData);

      // Fetch AI analytical explanation
      const expData = await api.getAlertExplanation(id);
      setExplanation(expData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertData();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const updated = await api.updateAlertStatus(id, newStatus, resolutionNotes);
      setAlert(updated);
      setResolutionNotes('');
    } catch (err) {
      alert(err.message || 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleGeneratePdf = async () => {
    setPdfGenerating(true);
    setPdfMessage(null);
    try {
      const res = await api.generateReport({ alert_id: parseInt(id) });
      setPdfMessage({
        type: 'success',
        text: `Report generated: ${res.filename}`,
        url: res.download_url
      });
      // Trigger download
      window.open(res.download_url, '_blank');
    } catch (err) {
      setPdfMessage({ type: 'error', text: err.message || 'Failed to generate PDF' });
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading || !alert) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Aggregating alert evidence and ML forensic context...</p>
        </div>
      </div>
    );
  }

  // Parse evidence JSON safely
  let evidenceObj = {};
  try {
    if (alert.evidence) evidenceObj = JSON.parse(alert.evidence);
  } catch {
    evidenceObj = {};
  }

  const riskScore = alert.risk_score || 0;
  const riskColor = riskScore >= 80 ? 'text-rose-500' : (riskScore >= 60 ? 'text-orange-500' : (riskScore >= 30 ? 'text-amber-500' : 'text-cyan-500'));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/alerts')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Alerts List</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePdf}
            disabled={pdfGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 transition-colors shadow-sm disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{pdfGenerating ? 'Generating PDF...' : 'Download Incident PDF'}</span>
          </button>
        </div>
      </div>

      {pdfMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
          pdfMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
        }`}>
          <span>{pdfMessage.text}</span>
          {pdfMessage.url && (
            <a href={pdfMessage.url} target="_blank" rel="noreferrer" className="underline font-bold text-cyan-400">
              Download Again
            </a>
          )}
        </div>
      )}

      {/* Alert Forensic Summary Card */}
      <div className="cyber-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-cyan-400 font-bold">{alert.alert_id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {alert.severity}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300">
                  Status: {alert.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 font-['Space_Grotesk']">
                {alert.attack_type.replace('_', ' ')} Incident
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{alert.description}</p>
            </div>
          </div>

          {/* Risk Score Meter */}
          <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800/80 min-w-[130px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Composite Risk</span>
            <div className={`text-3xl font-extrabold font-mono mt-0.5 ${riskColor}`}>
              {riskScore.toFixed(0)}
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Multi-Factor Score
            </span>
          </div>
        </div>

        {/* Entity Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Timestamp</span>
            <span className="text-slate-200">{new Date(alert.timestamp).toUTCString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Offending Source IP</span>
            <span
              onClick={() => alert.source_ip && navigate(`/ip-investigation?ip=${alert.source_ip}`)}
              className="text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              {alert.source_ip || 'Internal'}
              {alert.source_ip && <ExternalLink className="w-3 h-3" />}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Targeted Entity / User</span>
            <span
              onClick={() => alert.username && navigate(`/users?user=${alert.username}`)}
              className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              {alert.username || 'System Asset'}
              {alert.username && <ExternalLink className="w-3 h-3" />}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block uppercase font-sans">Classification Confidence</span>
            <span className="text-amber-400 font-bold">{(alert.confidence * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* AI Explanation Card (Section 32: Grounded Analyst Explanation Layer) */}
      {explanation && (
        <div className="cyber-card p-6 border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-cyan-950/20">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Space_Grotesk']">
              AI Analytical Explanation &amp; Evidence Grounding
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Deterministic + ML
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="font-semibold text-cyan-300 block mb-1">What Happened?</span>
              <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                {explanation.what_happened}
              </p>
            </div>

            <div>
              <span className="font-semibold text-amber-300 block mb-1">Why Was This Suspicious?</span>
              <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                {explanation.why_suspicious}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Supporting Telemetry Evidence</span>
                <ul className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 list-disc list-inside text-slate-400">
                  {explanation.supporting_evidence.map((ev, i) => (
                    <li key={i} className="text-[11px] text-slate-300">{ev}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Triggered Detection Rules</span>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  {explanation.rules_triggered.map((rule, i) => (
                    <span key={i} className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/40">
                      {rule}
                    </span>
                  ))}
                  <p className="text-[11px] text-slate-400 mt-1">
                    {explanation.ml_detection_summary}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-emerald-300 block mb-1">Recommended SOC Response Actions</span>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1 text-slate-300">
                {explanation.recommended_investigation_steps.map((step, i) => (
                  <p key={i} className="text-[11px]">{step}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyst Action & Lifecycle Workflow */}
      <div className="cyber-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
          Triage &amp; Incident Lifecycle Actions
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Add analyst investigation note..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleStatusChange('INVESTIGATING')}
              disabled={statusUpdating}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition-colors"
            >
              Mark Investigating
            </button>
            <button
              onClick={() => handleStatusChange('RESOLVED')}
              disabled={statusUpdating}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-colors"
            >
              Mark Resolved
            </button>
            <button
              onClick={() => handleStatusChange('FALSE_POSITIVE')}
              disabled={statusUpdating}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              False Positive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
