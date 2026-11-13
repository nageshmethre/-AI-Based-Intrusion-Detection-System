const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('soc_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('soc_token', data.access_token);
    localStorage.setItem('soc_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('soc_token');
    localStorage.removeItem('soc_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('soc_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  // Dashboard Telemetry
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load dashboard summary');
    return res.json();
  },

  // Events & Ingestion
  async getEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/events?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load events');
    return res.json();
  },

  async uploadLogFile(file) {
    const token = localStorage.getItem('soc_token');
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/events/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload log file');
    }
    return res.json();
  },

  async ingestRawLogs(raw_logs) {
    const res = await fetch(`${API_BASE}/events/raw`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ raw_logs })
    });
    if (!res.ok) throw new Error('Failed to ingest raw logs');
    return res.json();
  },

  async getSampleDatasets() {
    const res = await fetch(`${API_BASE}/events/samples`);
    if (!res.ok) throw new Error('Failed to load sample datasets');
    return res.json();
  },

  // Alerts & AI Explanation
  async getAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/alerts?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  },

  async getAlertDetail(id) {
    const res = await fetch(`${API_BASE}/alerts/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load alert details');
    return res.json();
  },

  async updateAlertStatus(id, status, resolution_notes = '') {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, resolution_notes })
    });
    if (!res.ok) throw new Error('Failed to update alert status');
    return res.json();
  },

  async getAlertExplanation(id) {
    const res = await fetch(`${API_BASE}/alerts/${id}/explanation`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load AI explanation');
    return res.json();
  },

  // Incidents
  async getIncidents(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/incidents?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load incidents');
    return res.json();
  },

  async getIncidentDetail(id) {
    const res = await fetch(`${API_BASE}/incidents/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load incident details');
    return res.json();
  },

  async updateIncident(id, data) {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update incident');
    return res.json();
  },

  // Investigations (IP & User)
  async investigateIP(ip) {
    const res = await fetch(`${API_BASE}/analytics/ip/${encodeURIComponent(ip)}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load IP investigation telemetry');
    return res.json();
  },

  async investigateUser(username) {
    const res = await fetch(`${API_BASE}/analytics/user/${encodeURIComponent(username)}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load user behavior telemetry');
    return res.json();
  },

  // IOCs
  async getIOCs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/iocs?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load IOCs');
    return res.json();
  },

  async updateIOC(id, data) {
    const res = await fetch(`${API_BASE}/iocs/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update IOC');
    return res.json();
  },

  // Detection Rules
  async getRules() {
    const res = await fetch(`${API_BASE}/rules`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load detection rules');
    return res.json();
  },

  async updateRule(id, data) {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update detection rule');
    return res.json();
  },

  // Machine Learning
  async getMLModels() {
    const res = await fetch(`${API_BASE}/ml/models`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load ML model metadata');
    return res.json();
  },

  async triggerMLRetrain() {
    const res = await fetch(`${API_BASE}/ml/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sample_size: 10000 })
    });
    if (!res.ok) throw new Error('Failed to retrain ML models');
    return res.json();
  },

  async testMLPredict(features) {
    const res = await fetch(`${API_BASE}/ml/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ features })
    });
    if (!res.ok) throw new Error('Failed to run ML prediction');
    return res.json();
  },

  // Reports
  async generateReport(payload) {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate PDF incident report');
    return res.json();
  },

  // Security Simulation (1-Click Demo)
  async triggerSimulation() {
    const res = await fetch(`${API_BASE}/simulation/run`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to execute security simulation');
    return res.json();
  },

  // 24x7 Real-Time Host Monitoring
  async getMonitorStatus() {
    const res = await fetch(`${API_BASE}/monitor/status`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load monitor status');
    return res.json();
  },

  async startMonitor() {
    const res = await fetch(`${API_BASE}/monitor/start`, { method: 'POST', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to start monitor');
    return res.json();
  },

  async stopMonitor() {
    const res = await fetch(`${API_BASE}/monitor/stop`, { method: 'POST', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to stop monitor');
    return res.json();
  },

  async streamSingleLog(rawLog, sourceLabel = 'analyst_console') {
    const res = await fetch(`${API_BASE}/monitor/stream-log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ raw_log: rawLog, source_label: sourceLabel })
    });
    if (!res.ok) throw new Error('Failed to stream log');
    return res.json();
  }
};
