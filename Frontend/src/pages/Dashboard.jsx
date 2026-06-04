import { useState, useEffect, useRef } from 'react';
import {
  Plus, Upload, FolderOpen, Users, FileText,
  Loader2, AlertCircle, RefreshCw, Search,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import DocCard from '../components/DocCard';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDocs = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/docs');
      setDocuments(res.data.documents || []);
    } catch {
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const ownedDocs  = documents.filter((d) => d.ownerId === currentUser.id);
  const sharedDocs = documents.filter((d) => d.ownerId !== currentUser.id);

  const filterDocs = (docs) =>
    docs.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const res = await api.post('/api/docs/create', { title: 'Untitled Document', content: '' });
      navigate(`/doc/${res.data.document.id}`);
    } catch {
      setError('Failed to create document.'); setCreating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'md'].includes(ext)) { setError('Only .txt and .md files are supported.'); return; }
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/docs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/doc/${res.data.document.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.'); setUploading(false);
    }
    e.target.value = '';
  };

  const EmptyState = ({ message, icon: Icon }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-14 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400 dark:text-dark-500" />
      </div>
      <p className="text-slate-400 dark:text-dark-400 text-sm">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Workspace
            </h1>
            <p className="text-slate-500 dark:text-dark-400 text-sm mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" disabled={uploading}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Uploading…' : 'Upload File'}
            </button>
            <button onClick={handleCreateNew} className="btn-primary" disabled={creating}>
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {creating ? 'Creating…' : 'New Document'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-500" />
          <input type="text" className="input-field pl-10" placeholder="Search documents…"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fade-in">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={fetchDocs} className="flex items-center gap-1.5 hover:text-red-700 dark:hover:text-red-300 font-medium">
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-5 h-44 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-800" />
                  <div className="w-16 h-5 rounded-full bg-slate-100 dark:bg-dark-800" />
                </div>
                <div className="h-4 bg-slate-100 dark:bg-dark-800 rounded-lg w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 dark:bg-dark-800 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">

            {/* Section A: My Documents */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/15 border border-primary-200 dark:border-primary-500/20 flex items-center justify-center">
                  <FolderOpen size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Documents</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-500 dark:text-dark-400 text-xs font-medium">
                  {filterDocs(ownedDocs).length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filterDocs(ownedDocs).length > 0 ? (
                  filterDocs(ownedDocs).map((doc, i) => <DocCard key={doc.id} doc={doc} isShared={false} index={i} />)
                ) : (
                  <EmptyState
                    message={searchQuery ? 'No documents match your search.' : 'No documents yet. Create one to get started!'}
                    icon={FileText}
                  />
                )}
              </div>
            </section>

            {/* Section B: Shared with Me */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center">
                  <Users size={16} className="text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shared with Me</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-500 dark:text-dark-400 text-xs font-medium">
                  {filterDocs(sharedDocs).length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filterDocs(sharedDocs).length > 0 ? (
                  filterDocs(sharedDocs).map((doc, i) => <DocCard key={doc.id} doc={doc} isShared={true} index={i + 10} />)
                ) : (
                  <EmptyState
                    message={searchQuery ? 'No shared documents match your search.' : 'No documents have been shared with you yet.'}
                    icon={Users}
                  />
                )}
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
