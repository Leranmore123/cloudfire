'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { FolderGit2, Plus, Trash2, Radio, Server } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [defaultPort, setDefaultPort] = useState('3000');
  const [description, setDescription] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    const res = await fetchApi('/api/projects');
    if (res.success) {
      setProjects(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const res = await fetchApi(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.success) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchApi('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name,
        defaultPort: parseInt(defaultPort, 10),
        description
      })
    });

    if (res.success) {
      setIsModalOpen(false);
      setName('');
      setDefaultPort('3000');
      setDescription('');
      loadProjects();
    } else {
      alert(res.error?.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-sm text-slate-400">Organize your applications, port presets, and assigned tunnels</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center">
          <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Projects Configured</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Group your local services into projects with predefined port mappings.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 py-2 px-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-sm font-medium transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 relative group hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-white mt-4">{p.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description || 'No description provided'}</p>

              <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-mono text-sky-400">
                  <Server className="w-3.5 h-3.5" />
                  :{p.defaultPort}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Radio className="w-3.5 h-3.5" />
                  {p.tunnels?.length || 0} tunnels
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Project</h3>
            <p className="text-xs text-slate-400 mb-4">Set up a project template for fast CLI binding.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Backend Microservice"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Default Port</label>
                <input
                  type="number"
                  required
                  value={defaultPort}
                  onChange={(e) => setDefaultPort(e.target.value)}
                  placeholder="3000"
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Express.js REST API with Postgres"
                  rows={2}
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
