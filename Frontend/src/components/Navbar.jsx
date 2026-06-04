import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Sun, Moon, User, LogOut, Layout, ChevronDown, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isEditorPage = location.pathname.startsWith('/doc/');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-dark-800 bg-white/90 dark:bg-dark-950/90 backdrop-blur-xl shadow-sm dark:shadow-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-200 dark:shadow-primary-900/40 group-hover:scale-110 transition-transform duration-200">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              Collab<span className="text-primary-600 dark:text-primary-400">Docs</span>
            </span>
          </Link>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">


            {/* ── Theme Toggle ── */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center
                         text-slate-500 dark:text-dark-400
                         hover:text-slate-900 dark:hover:text-white
                         hover:bg-slate-100 dark:hover:bg-dark-800
                         border border-slate-200 dark:border-dark-700
                         transition-all duration-200"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-primary-600" />
              )}
            </button>

            {/* ── Profile Dropdown ── */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl
                           bg-slate-100 dark:bg-dark-800
                           hover:bg-slate-200 dark:hover:bg-dark-700
                           border border-slate-200 dark:border-dark-700
                           transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <User size={13} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-dark-200 hidden sm:block max-w-[120px] truncate">
                  {user.name || user.email || 'User'}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 dark:text-dark-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Panel */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden
                               bg-white dark:bg-dark-900
                               border border-slate-200 dark:border-dark-700
                               shadow-xl shadow-slate-200/80 dark:shadow-black/40
                               animate-slide-up z-50">

                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-dark-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5">
                 
                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 text-sm text-red-500 dark:text-red-400
                                 hover:bg-red-50 dark:hover:bg-red-500/10
                                 transition-colors duration-150"
                    >
                      <LogOut size={15} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
