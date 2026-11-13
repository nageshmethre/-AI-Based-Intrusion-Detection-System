import React, { useState } from 'react';
import { Shield, Lock, User, KeyRound, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api';

export function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setRolePreset = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gold Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-neutral-950/80 to-[#070707] pointer-events-none"></div>

      <div className="relative max-w-md w-full z-10">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-xl shadow-yellow-500/20 mb-3 text-black">
            <Shield className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Security Operations Center
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            AI-Based Suspicious Log Detector &amp; Security Analytics Platform
          </p>
        </div>

        {/* Login Panel */}
        <div className="cyber-card p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-2.5 rounded-xl text-xs shadow-lg shadow-yellow-950/40 active:scale-98 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Authenticate to Platform'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-neutral-800">
            <p className="text-[11px] font-semibold text-neutral-400 mb-2.5 text-center">
              Evaluation &amp; Viva Demo Presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRolePreset('admin', 'Admin@12345')}
                className={`px-2 py-1.5 rounded-lg border text-left text-[11px] transition-all ${
                  username === 'admin'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Admin</span>
                  {username === 'admin' && <Check className="w-3 h-3 text-rose-400" />}
                </div>
                <div className="text-[9px] text-neutral-500 truncate">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => setRolePreset('analyst', 'Analyst@12345')}
                className={`px-2 py-1.5 rounded-lg border text-left text-[11px] transition-all ${
                  username === 'analyst'
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Analyst</span>
                  {username === 'analyst' && <Check className="w-3 h-3 text-yellow-400" />}
                </div>
                <div className="text-[9px] text-neutral-500 truncate">Investigate</div>
              </button>

              <button
                type="button"
                onClick={() => setRolePreset('viewer', 'Viewer@12345')}
                className={`px-2 py-1.5 rounded-lg border text-left text-[11px] transition-all ${
                  username === 'viewer'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Viewer</span>
                  {username === 'viewer' && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="text-[9px] text-neutral-500 truncate">Read-Only</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
