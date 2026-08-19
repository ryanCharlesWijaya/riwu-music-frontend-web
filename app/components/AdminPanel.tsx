'use client';

import React, { useEffect, useState } from 'react';
import { Shield, ToggleLeft, ToggleRight, Users, Cpu, Activity, Database, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ModuleState, SystemStats, User as UserType, fetchWithAuth } from '../lib/api';

interface AdminPanelProps {
  token: string | null;
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  const loadAdminData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [modData, statsData, usersData] = await Promise.all([
        fetchWithAuth('/admin/modules', token),
        fetchWithAuth('/admin/stats', token),
        fetchWithAuth('/admin/users', token),
      ]);
      setModules(modData);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleToggleModule = async (moduleId: string, currentStatus: boolean) => {
    if (!token) return;
    setTogglingModule(moduleId);
    try {
      await fetchWithAuth('/admin/modules/toggle', token, {
        method: 'POST',
        body: JSON.stringify({
          module_id: moduleId,
          is_enabled: !currentStatus,
        }),
      });
      // Refresh modules & stats
      loadAdminData();
    } catch (err: any) {
      alert(`Error toggling module: ${err.message}`);
    } finally {
      setTogglingModule(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!token) return;
    try {
      await fetchWithAuth('/admin/users/role', token, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          role: newRole,
        }),
      });
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-purple-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="w-48 h-48 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Shield className="w-6 h-6" />
              </span>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white">Administrative Control Center</h1>
            </div>
            <p className="text-sm text-slate-300">
              Manage core Go monolithic server plugins, asynchronous worker queues, and RBAC user roles.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-sm font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Metrics
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Active Plugins</span>
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.active_modules}</div>
            <div className="text-xs text-slate-400 mt-1">Modular Media Sources</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Worker Pool</span>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-cyan-400">{stats.active_workers} Active</div>
            <div className="text-xs text-slate-400 mt-1">{stats.pending_tasks} Tasks in Queue</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Registered Users</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.total_users}</div>
            <div className="text-xs text-slate-400 mt-1">RBAC Account Profiles</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Total Downloads</span>
              <Database className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.total_downloads}</div>
            <div className="text-xs text-slate-400 mt-1">Processed Offline Media</div>
          </div>
        </div>
      )}

      {/* Module Plugin Management Section */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Media Source Module Plugins</h2>
          <p className="text-xs text-slate-400">
            Dynamically enable or disable modular streaming connectors. Disabled modules stop servicing client search and stream requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.module_id}
              className={`p-5 rounded-2xl border transition-all ${
                mod.is_enabled
                  ? 'bg-slate-900/80 border-purple-500/40 shadow-lg shadow-purple-950/30'
                  : 'bg-slate-950/60 border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  {mod.module_id}
                </span>

                <button
                  onClick={() => handleToggleModule(mod.module_id, mod.is_enabled)}
                  disabled={togglingModule === mod.module_id}
                  className="transition transform active:scale-95"
                >
                  {mod.is_enabled ? (
                    <ToggleRight className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>

              <h3 className="font-bold text-white text-base mb-1">{mod.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{mod.description}</p>

              <div className="flex items-center gap-2 text-xs font-semibold">
                {mod.is_enabled ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Active & Routing
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Module Disabled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC User Management Section */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">User Directory & Role-Based Access (RBAC)</h2>
          <p className="text-xs text-slate-400">
            Promote accounts to Administrator or demote to Standard Listener.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Registered At</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-purple-400">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role === 'admin' ? (
                      <button
                        onClick={() => handleUpdateRole(u.id, 'user')}
                        className="text-xs px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
                      >
                        Demote to User
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateRole(u.id, 'admin')}
                        className="text-xs px-3 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition"
                      >
                        Promote to Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
