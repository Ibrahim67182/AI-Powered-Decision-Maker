'use client';

import { Option, Constraint } from '@/lib/types';
import { ScoredOption } from '@/lib/deterministicEngine';

interface Props {
  scored: ScoredOption;
  isTopPick: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function OptionCard({ scored, isTopPick, onEdit, onDelete }: Props) {
  const { option, disqualified, disqualifiedReasons, score, matchedPreferences } = scored;

  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        disqualified
          ? 'border-rose-200 bg-rose-50/50'
          : isTopPick
          ? 'border-indigo-200 bg-indigo-50/50 shadow-md shadow-indigo-100/50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-3">
            {option.name || 'Untitled option'}
            {isTopPick && !disqualified && (
              <span className="text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-bold shadow-sm">
                Recommended
              </span>
            )}
          </h3>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-3 text-xs font-medium">
            {onEdit && <button onClick={onEdit} className="text-slate-500 hover:text-indigo-600 transition-colors">Edit</button>}
            {onDelete && <button onClick={onDelete} className="text-slate-500 hover:text-rose-600 transition-colors">Delete</button>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        {Object.entries(option.attributes).map(([key, value]) => (
          <span key={key} className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-medium">
            <span className="text-slate-500 mr-1">{key}:</span> 
            {Array.isArray(value) ? value.join(', ') : String(value)}
          </span>
        ))}
      </div>

      {disqualified ? (
        <div className="text-sm text-rose-700 bg-white rounded-lg p-3 border border-rose-200 shadow-sm">
          <p className="font-bold text-rose-600 mb-1.5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Ruled out
          </p>
          <ul className="list-disc list-inside space-y-1 ml-1 text-rose-600/80">
            {disqualifiedReasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      ) : (
        <div className="text-sm bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
          <p className="text-indigo-600 font-bold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Score: {score}
          </p>
          {matchedPreferences.length > 0 && (
            <p className="text-slate-500 mt-2 text-xs leading-relaxed">
              <span className="font-semibold text-slate-700">Matches:</span> {matchedPreferences.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}