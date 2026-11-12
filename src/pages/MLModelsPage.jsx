import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Database,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export function MLModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await api.getMLModels();
      setModels(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setMessage(null);
    try {
      const res = await api.triggerMLRetrain();
      setMessage({ type: 'success', text: res.message });
      fetchModels();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Retraining failed' });
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Machine Learning Intelligence &amp; Model Evaluation
          </h1>
          <p className="text-xs text-slate-400">
            Real statistical evaluation metrics, feature pipelines, and model registry (Isolation Forest &amp; Random Forest)
          </p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Retraining Models...' : 'Retrain ML Models'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
          message.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {models.map((model) => {
          let metricsObj = {};
          let featureList = [];
          try {
            if (model.metrics_json) metricsObj = JSON.parse(model.metrics_json);
            if (model.features) featureList = JSON.parse(model.features);
          } catch {
            metricsObj = {};
            featureList = [];
          }

          return (
            <div key={model.id} className="cyber-card p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{model.model_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        v{model.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{model.algorithm}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Trained On</span>
                  <span className="text-xs text-slate-300 font-mono">
                    {new Date(model.training_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Genuine Metrics Grid (Section 9: Do not display fake metrics) */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Accuracy</span>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    {model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Precision</span>
                  <span className="font-mono text-base font-extrabold text-cyan-400">
                    {model.precision ? `${(model.precision * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Recall</span>
                  <span className="font-mono text-base font-extrabold text-blue-400">
                    {model.recall ? `${(model.recall * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">F1-Score</span>
                  <span className="font-mono text-base font-extrabold text-amber-400">
                    {model.f1_score ? `${(model.f1_score * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Dataset & Methodology Notes (Section 8: Show dataset source, preprocessing, limitations) */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Dataset Source</span>
                  <p className="text-slate-300 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 mt-0.5">
                    {model.dataset}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Input Feature Dimensions ({featureList.length})</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {featureList.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {metricsObj.classes && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Target Attack Classes</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {metricsObj.classes.map((cls, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 text-[10px] font-mono border border-cyan-900">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Methodology & Academic Transparency Note */}
      <div className="cyber-card p-5 border-slate-800 text-xs space-y-2 text-slate-400">
        <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Academic Evaluation Methodology &amp; Limitations Notice</span>
        </h3>
        <p className="leading-relaxed">
          1. <b>Strict Featurization Ordering:</b> Datasets are partitioned into an 80% training set and a 20% held-out test set prior to fitting preprocessing pipelines (StandardScaler &amp; SimpleImputer) to guarantee zero data leakage.
        </p>
        <p className="leading-relaxed">
          2. <b>Provenance:</b> All reported metrics are computed on the held-out test partition using scikit-learn standard evaluation functions without synthetic inflation.
        </p>
        <p className="leading-relaxed">
          3. <b>Dual Model Architecture:</b> Isolation Forest provides unsupervised anomaly scoring (0–100) for zero-day behavioral deviations, while Random Forest classifies known attack vectors (BRUTE_FORCE, PORT_SCAN, DOS, SUSPICIOUS_LOGIN, DATA_EXFILTRATION).
        </p>
      </div>
    </div>
  );
}
