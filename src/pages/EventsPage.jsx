import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileText,
  AlertTriangle,
  CheckCircle,
  FileCode,
  Database,
  Download,
  Sparkles,
  ShieldAlert,
  Terminal,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceIp, setSourceIp] = useState('');
  const [username, setUsername] = useState('');
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [attackType, setAttackType] = useState('');

  // Sample datasets state
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [uploadMode, setUploadMode] = useState('text'); // default to 'text' for instant 1-click loading!
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (sourceIp) params.source_ip = sourceIp;
      if (username) params.username = username;
      if (eventType) params.event_type = eventType;
      if (severity) params.severity = severity;
      if (attackType) params.attack_type = attackType;

      const res = await api.getEvents(params);
      setEvents(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSamples = async () => {
    try {
      const res = await api.getSampleDatasets();
      setSamples(res || []);
    } catch (err) {
      console.error('Failed to load sample datasets:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSamples();
  }, [page, pageSize, eventType, severity, attackType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setUploadMode('text');
    setRawText(sample.content || '');
    setUploadStatus(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadStatus(null);
    try {
      let res;
      if (uploadMode === 'file') {
        if (!uploadFile) {
          throw new Error('Please select a log file to upload, or use the 1-Click Attack Datasets below.');
        }
        res = await api.uploadLogFile(uploadFile);
      } else {
        if (!rawText.trim()) {
          throw new Error('Please enter log text or click one of the 1-Click Attack Datasets below.');
        }
        res = await api.ingestRawLogs(rawText);
      }
      setUploadStatus({
        type: 'success',
        text: `Success: Ingested ${res.parsed_events} events (${res.format_detected} format). Alerts generated: ${res.alerts_generated}`
      });
      fetchEvents();
      // Also notify layout/dashboard of new events
      window.dispatchEvent(new Event('soc-refresh'));

      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus(null);
        setUploadFile(null);
        setRawText('');
        setSelectedSample(null);
      }, 2500);
    } catch (err) {
      setUploadStatus({ type: 'error', text: err.message || 'Ingestion failed' });
    } finally {
      setUploadLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Normalized Events Explorer</span>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">
              {total.toLocaleString()} Ingested
            </span>
          </h1>
          <p className="text-xs text-neutral-400">
            Search, filter, and inspect normalized security logs across all ingested telemetry formats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsUploadModalOpen(true);
              if (samples.length > 0 && !rawText) {
                handleSelectSample(samples[0]);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-950/40 transition active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest Logs / Upload</span>
          </button>
          <button
            onClick={fetchEvents}
            className="p-1.5 rounded-lg text-xs bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-yellow-400 hover:border-yellow-500/40 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Dataset Discovery Banner */}
      <div className="cyber-card p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-yellow-500/20 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Investigation Datasets Library</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-yellow-400 text-black font-extrabold uppercase">
                8 Scenarios Ready
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Instant real-world attack logs for testing: SSH Brute Force, SQLi, Port Scan, Windows PrivEsc, Ransomware &amp; CIC-IDS2017
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsUploadModalOpen(true);
            if (samples.length > 0) handleSelectSample(samples[0]);
          }}
          className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-yellow-400 border border-yellow-500/30 transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Open Datasets Ingestor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search message, raw log, resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Source IP (e.g. 192.168)"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
            />
          </div>

          <div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-yellow-500 transition"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-yellow-500 transition"
            >
              <option value="">All Types</option>
              <option value="AUTH">AUTH</option>
              <option value="WEB">WEB</option>
              <option value="NETWORK">NETWORK</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="UNKNOWN_EVENT">UNKNOWN</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-lg text-xs transition"
            >
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Events Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="soc-table">
            <thead>
              <tr>
                <th className="w-12">Inspect</th>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>Source IP : Port</th>
                <th>User / Identity</th>
                <th>Action &amp; Target</th>
                <th>Attack Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-500 font-sans">
                    <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin mx-auto mb-2" />
                    <span>Querying normalized events telemetry...</span>
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-yellow-500/5 transition-colors">
                    <td className="text-center font-sans">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="p-1.5 rounded-md hover:bg-yellow-400/10 text-neutral-400 hover:text-yellow-400 transition"
                        title="Forensic Deep Inspection"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="whitespace-nowrap text-neutral-400">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold">
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          ev.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : ev.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : ev.severity === 'MEDIUM'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        {ev.severity}
                      </span>
                    </td>
                    <td className="text-neutral-200">
                      <span className="text-yellow-400 font-semibold">{ev.source_ip || 'local'}</span>
                      {ev.source_port ? `:${ev.source_port}` : ''}
                    </td>
                    <td className="text-neutral-300">{ev.username || '-'}</td>
                    <td className="max-w-xs truncate text-neutral-300">
                      <span className={ev.status === 'FAILURE' ? 'text-rose-400 font-semibold mr-1' : 'text-emerald-400 mr-1'}>
                        [{ev.status}]
                      </span>
                      <span>{ev.action}</span>
                      {ev.resource && <span className="text-neutral-500"> ({ev.resource})</span>}
                    </td>
                    <td className="text-amber-400 font-semibold">{ev.attack_type || 'NORMAL'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-500 font-sans">
                    No security events found. Ingest a sample dataset above to start real-time telemetry analysis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div>
            Showing {events.length} of {total} events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-neutral-900 border border-neutral-800 disabled:opacity-30 hover:bg-neutral-800 text-neutral-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-neutral-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-neutral-900 border border-neutral-800 disabled:opacity-30 hover:bg-neutral-800 text-neutral-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Event Forensic Inspection (ID #{selectedEvent.id})</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Normalized Attributes Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Timestamp</span>
                <p className="font-mono text-neutral-200 mt-0.5">{new Date(selectedEvent.timestamp).toISOString()}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Classification &amp; Risk</span>
                <p className="font-mono text-amber-400 font-bold mt-0.5">
                  {selectedEvent.attack_type} (Score: {selectedEvent.risk_score?.toFixed(1)})
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Source Host / Port</span>
                <p className="font-mono text-yellow-400 mt-0.5">
                  {selectedEvent.source_ip || 'N/A'}:{selectedEvent.source_port || '-'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Target Entity / Destination</span>
                <p className="font-mono text-neutral-200 mt-0.5">
                  {selectedEvent.username || selectedEvent.destination_ip || 'N/A'}:{selectedEvent.destination_port || '-'}
                </p>
              </div>
            </div>

            {/* Raw Log Viewer */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-neutral-300">Original Immutable Raw Log</span>
                <span className="text-[10px] text-neutral-500 font-mono">Format: Preserved</span>
              </div>
              <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                {selectedEvent.raw_log}
              </pre>
            </div>

            {/* Normalized Event JSON Representation */}
            <div>
              <span className="text-xs font-semibold text-neutral-300 mb-1.5 block">Normalized JSON Schema</span>
              <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Log Ingestion / Upload Modal with 1-Click Investigation Datasets */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Log Telemetry Ingestion Engine</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">
                  Real-time Normalizer
                </span>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1-Click Sample Datasets Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Ready Attack Datasets for Investigation</span>
                </span>
                <span className="text-[10px] text-neutral-400">Click any preset to load instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samples.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      selectedSample?.id === s.id
                        ? 'bg-yellow-500/15 border-yellow-400 text-white shadow-md shadow-yellow-950/40'
                        : 'bg-neutral-950 border-neutral-800/80 hover:border-yellow-500/40 text-neutral-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white truncate">{s.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-yellow-400 font-mono shrink-0">
                          {s.line_count} lines
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{s.description}</p>
                      <span className="text-[9px] text-amber-400/90 font-mono block mt-1">
                        🎯 {s.mitre_tactic}
                      </span>
                    </div>

                    <a
                      href={s.download_url}
                      download={s.filename}
                      onClick={(e) => e.stopPropagation()}
                      title={`Download ${s.filename}`}
                      className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-yellow-500/50 text-neutral-400 hover:text-yellow-400 transition shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingestion Mode Toggle */}
            <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`flex-1 py-1.5 rounded-md font-bold transition-colors ${
                  uploadMode === 'text' ? 'bg-yellow-400 text-black' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Direct Raw Text Stream (Loaded: {rawText ? rawText.split('\n').length : 0} lines)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-1.5 rounded-md font-bold transition-colors ${
                  uploadMode === 'file' ? 'bg-yellow-400 text-black' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                File Upload (.log, .txt, .csv, .json)
              </button>
            </div>

            {uploadStatus && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}>
                {uploadStatus.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>{uploadStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadMode === 'text' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-neutral-300">
                      Raw Security Log Stream
                    </label>
                    {selectedSample && (
                      <span className="text-[10px] text-yellow-400 font-mono">
                        Active Preset: {selectedSample.filename}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste raw log lines or click any of the 1-Click Attack Datasets above..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-neutral-800 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-colors">
                    <FileText className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-300 font-semibold mb-1">
                      Select or drag-and-drop security log file
                    </p>
                    <p className="text-[10px] text-neutral-500 mb-3">
                      Supported: Linux Auth, Apache/Nginx, Windows Events, CSV, JSON
                    </p>
                    <input
                      type="file"
                      accept=".log,.txt,.csv,.json"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                    <span className="font-semibold text-neutral-300 block">Or select existing dataset from your project:</span>
                    <p className="font-mono text-[10px] text-yellow-400/80">
                      📂 sample_data\brute_force\ssh_brute_force.log<br />
                      📂 sample_data\suspicious\exfiltration_web.log<br />
                      📂 sample_data\port_scan\ufw_port_scan.log<br />
                      📂 sample_data\suspicious\windows_privilege_escalation.log<br />
                      📂 sample_data\cicids2017\cicids2017_flow_sample.csv
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-[11px] text-neutral-400">
                  Runs auto-normalization + AI ML detection pipeline
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-950/40 disabled:opacity-50 transition active:scale-95"
                  >
                    {uploadLoading ? 'Normalizing & Scoring...' : 'Ingest & Analyze'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}