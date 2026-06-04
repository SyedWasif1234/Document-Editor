import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, FileText } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/login', form);
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex transition-colors duration-200">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
                      bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900
                      dark:from-dark-900 dark:via-dark-900 dark:to-dark-950
                      items-center justify-center p-12">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 dark:bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-white/5 dark:bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 dark:bg-primary-500/20 backdrop-blur-sm border border-white/20 dark:border-primary-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <FileText size={36} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            CollabDocs
          </h1>
          <p className="text-primary-100 dark:text-dark-400 text-lg max-w-sm leading-relaxed">
            Write, collaborate, and share documents in real time with your team.
          </p>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              '✦ Rich text editing with Quill',
              '✦ Share with editor or viewer roles',
              '✦ Upload .txt and .md files instantly',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 dark:bg-dark-800/60 border border-white/20 dark:border-dark-700/50 text-white/90 dark:text-dark-300 text-sm">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-200 dark:shadow-primary-900/40">
              <FileText size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-xl">
              Collab<span className="text-primary-600 dark:text-primary-400">Docs</span>
            </span>
          </div>

          <div className="card">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="text-slate-500 dark:text-dark-400 text-sm mt-1">Sign in to your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label" htmlFor="email">Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-500">
                    <Mail size={15} />
                  </div>
                  <input id="email" name="email" type="email" autoComplete="email" required
                    className="input-field pl-10" placeholder="you@example.com"
                    value={form.email} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="password">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-500">
                    <Lock size={15} />
                  </div>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" required
                    className="input-field pl-10 pr-10" placeholder="••••••••"
                    value={form.password} onChange={handleChange} />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-500 hover:text-slate-700 dark:hover:text-dark-300 transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                  <AlertCircle size={15} className="flex-shrink-0" />{error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3 text-base" disabled={loading}>
                {loading && <Loader2 size={17} className="animate-spin" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-dark-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
