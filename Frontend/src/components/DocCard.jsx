import { useNavigate } from 'react-router-dom';
import { Clock, Users, ChevronRight, Crown } from 'lucide-react';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

function getInitials(title) {
  return title.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');
}

const GRADIENT_PAIRS = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
];

export default function DocCard({ doc, isShared = false, index = 0 }) {
  const navigate = useNavigate();
  const gradient = GRADIENT_PAIRS[index % GRADIENT_PAIRS.length];
  const collaboratorCount = doc.collaborators?.length || 0;

  return (
    <div
      onClick={() => navigate(`/doc/${doc.id}`)}
      className="group relative
                 bg-white dark:bg-dark-900
                 border border-slate-200 dark:border-dark-800
                 hover:border-primary-300 dark:hover:border-dark-600
                 rounded-2xl p-5 cursor-pointer
                 transition-all duration-200
                 hover:shadow-lg hover:shadow-primary-100/60 dark:hover:shadow-black/40
                 hover:-translate-y-0.5 animate-fade-in"
    >
      {/* Color accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
          <span className="text-white font-bold text-sm">{getInitials(doc.title)}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1.5">
          {isShared ? (
            <span className="badge-shared">
              <Users size={10} />
              Shared
            </span>
          ) : (
            <span className="badge-owner">
              <Crown size={10} />
              Owner
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-4 font-semibold text-slate-900 dark:text-dark-100 text-base leading-snug line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-white transition-colors">
        {doc.title}
      </h3>

      {/* Content preview */}
      {doc.content && (
        <p className="mt-1.5 text-slate-400 dark:text-dark-500 text-xs line-clamp-2 leading-relaxed">
          {doc.content.replace(/<[^>]*>/g, '').slice(0, 120) || 'No content yet…'}
        </p>
      )}

      {/* Footer meta */}
      <div className="mt-4 flex items-center justify-between text-slate-400 dark:text-dark-500 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock size={11} />
          <span>{timeAgo(doc.updatedAt)}</span>
        </div>
        {collaboratorCount > 0 && (
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{collaboratorCount} collaborator{collaboratorCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Hover arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
        <ChevronRight size={16} className="text-primary-400 dark:text-dark-400" />
      </div>
    </div>
  );
}
