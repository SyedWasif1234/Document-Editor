import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import TurndownService from 'turndown';
import html2pdf from 'html2pdf.js';
import {
  Save, Share2, ArrowLeft, Loader2, Check,
  AlertCircle, Users, Clock, Trash2, Download, ChevronDown, FileText, FileCode, FileIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ShareModal from '../components/ShareModal';
import api from '../services/api';

// Quill toolbar configuration
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
];

const QUILL_MODULES = {
  toolbar: TOOLBAR_OPTIONS,
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline',
  'list', 'bullet', 'blockquote', 'link',
];

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [userRole, setUserRole] = useState('VIEWER'); // 'OWNER', 'EDITOR', 'VIEWER'

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const saveTimeoutRef = useRef(null);
  const downloadRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch document
  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/docs/${id}`);
        const d = res.data.document;
        setDoc(d);
        setTitle(d.title);
        setContent(d.content || '');
        setUserRole(res.data.role);
      } catch (err) {
        setError('Document not found or you do not have access.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  // Clear save status after 3s
  useEffect(() => {
    if (saveStatus) {
      const t = setTimeout(() => setSaveStatus(null), 3000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await api.put(`/api/docs/update/${id}`, { title, content });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [title, content]);

  const isOwner = userRole === 'OWNER';
  const isViewer = userRole === 'VIEWER';
  const collaboratorCount = doc?.collaborators?.length || 0;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/docs/${id}`);
      navigate('/');
    } catch (err) {
      alert('Failed to delete document.');
      setDeleting(false);
    }
  };

  const handleDownload = (format) => {
    setDownloadOpen(false);
    const fileName = title || 'Document';

    if (format === 'txt') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, `${fileName}.txt`);
    } 
    else if (format === 'md') {
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(content);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      downloadBlob(blob, `${fileName}.md`);
    } 
    else if (format === 'pdf') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Inter, sans-serif';
      tempDiv.style.color = '#1e293b';
      tempDiv.style.lineHeight = '1.6';
      
      const opt = {
        margin:       10,
        filename:     `${fileName}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(tempDiv).save();
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const SaveStatusIndicator = () => {
    if (saving) return (
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-dark-400 text-xs">
        <Loader2 size={13} className="animate-spin" />
        Saving…
      </div>
    );
    if (saveStatus === 'saved') return (
      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs animate-fade-in">
        <Check size={13} />
        Saved
      </div>
    );
    if (saveStatus === 'error') return (
      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs animate-fade-in">
        <AlertCircle size={13} />
        Failed to save
      </div>
    );
    return (
      <span className="text-slate-400 dark:text-dark-600 text-xs hidden sm:inline">Ctrl+S to save</span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-950 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center mx-auto mb-4 shadow-sm dark:shadow-none">
              <Loader2 size={24} className="text-primary-600 dark:text-primary-400 animate-spin" />
            </div>
            <p className="text-slate-500 dark:text-dark-400 text-sm">Loading document…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-950 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center max-w-sm animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-slate-500 dark:text-dark-400 text-sm mb-6">{error}</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              <ArrowLeft size={15} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col transition-colors duration-200">
      <Navbar />

      {/* Editor Top Bar */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-dark-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-dark-800 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={() => navigate(currentUser.id ? '/' : '/login')}
            className="btn-ghost p-2 flex-shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Editable title */}
          {isViewer ? (
            <div className="flex-1 text-slate-900 dark:text-white font-semibold text-base truncate">
              {title || 'Untitled Document'}
              <span className="ml-3 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-dark-400">View Only</span>
            </div>
          ) : (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent text-slate-900 dark:text-white font-semibold text-base
                         placeholder-slate-400 dark:placeholder-dark-600 focus:outline-none border-b border-transparent
                         focus:border-primary-300 dark:focus:border-dark-600 pb-0.5 transition-colors truncate"
              placeholder="Document title…"
            />
          )}

          {/* Right side controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!isViewer && <SaveStatusIndicator />}

            {/* Collaborators pill */}
            {collaboratorCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-dark-400 text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm dark:shadow-none">
                <Users size={12} />
                {collaboratorCount}
              </div>
            )}

            {/* Download Dropdown — owner only */}
            {isOwner && (
              <div className="relative" ref={downloadRef}>
                <button
                  onClick={() => setDownloadOpen((o) => !o)}
                  className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
                  title="Download Document"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${downloadOpen ? 'rotate-180' : ''}`} />
                </button>

                {downloadOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl overflow-hidden
                                 bg-white dark:bg-dark-900
                                 border border-slate-200 dark:border-dark-700
                                 shadow-xl shadow-slate-200/80 dark:shadow-black/40
                                 animate-slide-up z-50 p-1.5">
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-dark-300 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors"
                    >
                      <FileIcon size={15} className="text-red-500" />
                      <span>PDF Document (.pdf)</span>
                    </button>
                    <button
                      onClick={() => handleDownload('md')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-dark-300 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors"
                    >
                      <FileCode size={15} className="text-violet-500" />
                      <span>Markdown (.md)</span>
                    </button>
                    <button
                      onClick={() => handleDownload('txt')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-dark-300 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors"
                    >
                      <FileText size={15} className="text-blue-500" />
                      <span>Plain Text (.txt)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Share — owner only */}
            {isOwner && (
              <button
               onClick={() => setShareOpen(true)}
                className="btn-secondary text-xs px-3 py-2"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {/* Delete — owner only */}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="btn-danger text-xs px-3 py-2"
                disabled={deleting}
                title="Delete Document"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}

            {/* Save — not for viewers */}
            {!isViewer && (
              <button
                onClick={handleSave}
                className="btn-primary text-xs px-4 py-2"
                disabled={saving}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document meta bar */}
      {doc && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 text-xs text-slate-500 dark:text-dark-500">
          <div className="flex items-center gap-1.5">
            <Clock size={11} />
            Updated {new Date(doc.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
          {doc.owner && (
            <span>· by {doc.owner.name || doc.owner.email}</span>
          )}
        </div>
      )}

      {/* Quill Editor Area */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-10 mt-4">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          readOnly={isViewer}
          modules={isViewer ? { toolbar: false } : QUILL_MODULES}
          formats={QUILL_FORMATS}
          placeholder="Start writing your document…"
          className="h-full shadow-sm dark:shadow-none rounded-xl overflow-hidden"
        />
      </div>

      {/* Share Modal */}
      <ShareModal
        docId={id}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
