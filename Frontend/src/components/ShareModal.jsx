import { useState, useEffect, useRef } from 'react';
import { X, Share2, UserPlus, Check, AlertCircle, Loader2, Users, Link as LinkIcon, Copy } from 'lucide-react';
import api from '../services/api';

export default function ShareModal({ docId, isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const shareLink = `${window.location.origin}/doc/${docId}`;

  useEffect(() => {
    if (isOpen) {
      setEmail(''); setRole('EDITOR'); setSuccess(''); setError(''); setCopied(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post(`/api/docs/${docId}/share`, { email: email.trim(), role });
      setSuccess(res.data.message || `Shared successfully with ${email}!`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share document.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative glass-card w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/15 border border-primary-200 dark:border-primary-500/20 flex items-center justify-center">
              <Share2 size={18} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Share Document</h2>
              <p className="text-xs text-slate-500 dark:text-dark-400">Invite others to collaborate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-dark-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-700 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="input-label">Email address</label>
            <input
              ref={inputRef}
              type="email"
              className="input-field"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="input-label">Access level</label>
            <div className="grid grid-cols-2 gap-2">
              {['EDITOR', 'VIEWER'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                    role === r
                      ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/30'
                      : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-600 dark:text-dark-300 hover:border-primary-300 dark:hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {r === 'EDITOR' ? <UserPlus size={13} /> : <Users size={13} />}
                    {r === 'EDITOR' ? 'Can Edit' : 'Can View'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm animate-fade-in">
              <Check size={15} className="flex-shrink-0" />{success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fade-in">
              <AlertCircle size={15} className="flex-shrink-0" />{error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary w-full" disabled={loading || !email.trim()}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
              {loading ? 'Sharing…' : 'Share via Email'}
            </button>
          </div>
        </form>

        {/* Link Sharing */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-dark-800">
          <label className="input-label mb-2">Share link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-dark-700 overflow-hidden">
              <LinkIcon size={14} className="text-slate-400 dark:text-dark-500 flex-shrink-0" />
              <input
                type="text"
                readOnly
                value={shareLink}
                className="bg-transparent border-none outline-none text-sm text-slate-600 dark:text-dark-300 w-full truncate"
                onClick={(e) => e.target.select()}
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-secondary px-3 py-2.5 flex-shrink-0"
              title="Copy link"
            >
              {copied ? <Check size={15} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={15} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
