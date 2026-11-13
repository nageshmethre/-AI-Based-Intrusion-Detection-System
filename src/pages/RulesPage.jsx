import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Save, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { api } from '../services/api';

export function RulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.getRules();
      setRules(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleRuleChange = (id, field, value) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveRule = async (rule) => {
    setSavingId(rule.id);
    setMessage(null);
    try {
      await api.updateRule(rule.id, {
        threshold_value: parseFloat(rule.threshold_value),
        time_window_minutes: parseInt(rule.time_window_minutes),
        severity: rule.severity,
        is_enabled: rule.is_enabled
      });
      setMessage({ type: 'success', text: `Rule ${rule.rule_code} updated successfully!` });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save rule settings' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Detection Rules Configuration</span>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">
              8 Heuristics
            </span>
          </h1>
          <p className="text-xs text-neutral-400">
            Configure transparent deterministic security rules, sliding time windows, and threshold limits
          </p>
        </div>
        <button
          onClick={fetchRules}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-yellow-400 hover:border-yellow-500/40 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Rules</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border backdrop-blur-md ${
          message.type === 'success' ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300' : 'bg-rose-950/70 border-rose-700 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="cyber-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-yellow-400">{rule.rule_code}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    rule.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    rule.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  }`}>
                    {rule.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">{rule.name}</h3>
              </div>

              {/* Toggle Enabled */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.is_enabled}
                  onChange={(e) => handleRuleChange(rule.id, 'is_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-400"></div>
              </label>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">{rule.description}</p>

            {/* Inputs: Threshold & Window */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800/80 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                  Threshold Value
                </label>
                <input
                  type="number"
                  value={rule.threshold_value}
                  onChange={(e) => handleRuleChange(rule.id, 'threshold_value', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-yellow-400 text-xs focus:outline-none focus:border-yellow-500 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                  Window (Minutes)
                </label>
                <input
                  type="number"
                  value={rule.time_window_minutes}
                  onChange={(e) => handleRuleChange(rule.id, 'time_window_minutes', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-200 text-xs focus:outline-none focus:border-yellow-500 transition"
                />
              </div>
            </div>

            {/* Severity Selector & Save Button */}
            <div className="flex items-center justify-between pt-2">
              <select
                value={rule.severity}
                onChange={(e) => handleRuleChange(rule.id, 'severity', e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-yellow-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>

              <button
                onClick={() => handleSaveRule(rule)}
                disabled={savingId === rule.id}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-950/40 disabled:opacity-50 transition active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingId === rule.id ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
