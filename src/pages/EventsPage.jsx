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
  FileCode
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

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'text'
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

  useEffect(() => {
    fetchEvents();
  }, [page, pageSize, eventType, severity, attackType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadStatus(null);
    try {
      let res;
      if (uploadMode === 'file') {
        if (!uploadFile) throw new Error('Please select a log file to upload.');
        res = await api.uploadLogFile(uploadFile);
      } else {
        if (!rawText.trim()) throw new Error('Please provide raw log text.');
        res = await api.ingestRawLogs(rawText);
      }
      setUploadStatus({
        type: 'success',
        text: `Success: Ingested ${res.parsed_events} events. Alerts triggered: ${res.alerts_generated}. Format: ${res.format_detected}`
      });
      fetchEvents();
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus(null);
        setUploadFile(null);
        setRawText('');
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
          <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Normalized Events Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Search, filter, and inspect normalized security logs across all ingested formats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest Logs / Upload</span>
          </button>
          <button
            onClick={fetchEvents}
            className="p-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search message, raw log, resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Source IP (e.g. 192.168)"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Events Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Source Host</th>
                <th className="py-2.5 px-3">Target / Resource</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto mb-2" />
                    <span>Querying normalized events...</span>
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {e.event_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{e.action || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={e.status === 'FAILURE' ? 'text-rose-400' : (e.status === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-400')}>
                        {e.status || '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-cyan-400">{e.source_ip || '-'}</td>
                    <td className="py-2 px-3 font-sans text-slate-300 truncate max-w-xs">
                      {e.username || e.resource || '-'}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        e.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                        e.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        e.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {e.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-amber-400">
                      {e.risk_score?.toFixed(0)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="text-slate-400 hover:text-cyan-400">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    No matching events found. Use the "Ingest Logs" button above or trigger a simulation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total.toLocaleString()} events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal (Section 16: Raw log viewing & Normalized JSON) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Event Forensic Inspection (ID #{selectedEvent.id})</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Normalized Attributes Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Timestamp</span>
                <p className="font-mono text-slate-200 mt-0.5">{new Date(selectedEvent.timestamp).toISOString()}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Classification &amp; Risk</span>
                <p className="font-mono text-amber-400 font-bold mt-0.5">
                  {selectedEvent.attack_type} (Score: {selectedEvent.risk_score?.toFixed(1)})
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Source Host / Port</span>
                <p className="font-mono text-cyan-400 mt-0.5">
                  {selectedEvent.source_ip || 'N/A'}:{selectedEvent.source_port || '-'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Target Entity / Destination</span>
                <p className="font-mono text-slate-200 mt-0.5">
                  {selectedEvent.username || selectedEvent.destination_ip || 'N/A'}:{selectedEvent.destination_port || '-'}
                </p>
              </div>
            </div>

            {/* Raw Log Viewer (Section 4 & Section 16: Never destroy original raw log) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Original Immutable Raw Log</span>
                <span className="text-[10px] text-slate-500 font-mono">Format: Preserved</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                {selectedEvent.raw_log}
              </pre>
            </div>

            {/* Normalized Event JSON Representation */}
            <div>
              <span className="text-xs font-semibold text-slate-300 mb-1.5 block">Normalized JSON Schema</span>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Log Ingestion / Upload Modal (Section 4: Ingestion Modes) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Log Telemetry Ingestion Engine</h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ingestion Mode Toggle */}
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-colors ${
                  uploadMode === 'file' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                File Upload (.log, .txt, .csv, .json)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-colors ${
                  uploadMode === 'text' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Direct Raw Text Stream
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
              {uploadMode === 'file' ? (
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors">
                  <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-semibold mb-1">
                    Select or drag-and-drop security log file
                  </p>
                  <p className="text-[10px] text-slate-500 mb-3">
                    Supported: Linux Auth, Apache/Nginx, Windows Events, CSV, JSON
                  </p>
                  <input
                    type="file"
                    accept=".log,.txt,.csv,.json"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Paste Raw Log Lines
                  </label>
                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Oct 10 14:22:01 server sshd[12345]: Failed password for root from 192.168.1.100 port 44212 ssh2&#10;192.168.1.50 - - [10/Oct/2026:14:00:00 +0000] &quot;GET /admin HTTP/1.1&quot; 401 256"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md disabled:opacity-50"
                >
                  {uploadLoading ? 'Normalizing & Scoring...' : 'Ingest & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
