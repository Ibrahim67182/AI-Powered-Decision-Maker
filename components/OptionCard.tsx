'use client';

import { Option, Constraint } from '@/lib/types';
import { ScoredOption } from '@/lib/deterministicEngine';

interface Props {
  scored: ScoredOption;
  isTopPick: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OptionCard({ scored, isTopPick, onEdit, onDelete }: Props) {
  const { option, disqualified, disqualifiedReasons, score, matchedPreferences } = scored;

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition ${
        disqualified
          ? 'border-red-900 bg-red-950/30'
          : isTopPick
          ? 'border-amber-400 bg-zinc-800 shadow-lg shadow-amber-400/10'
          : 'border-zinc-700 bg-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
            {option.name || 'Untitled option'}
            {isTopPick && !disqualified && (
              <span className="text-xs bg-amber-400 text-zinc-900 px-2 py-0.5 rounded-full font-medium">
                Recommended
              </span>
            )}
          </h3>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={onEdit} className="text-zinc-400 hover:text-amber-400">Edit</button>
          <button onClick={onDelete} className="text-zinc-400 hover:text-red-400">Delete</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
        {Object.entries(option.attributes).map(([key, value]) => (
          <span key={key} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1">
            {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
          </span>
        ))}
      </div>

      {disqualified ? (
        <div className="text-sm text-red-400">
          <p className="font-medium mb-1">Ruled out:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {disqualifiedReasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      ) : (
        <div className="text-sm">
          <p className="text-amber-400 font-medium">Score: {score}</p>
          {matchedPreferences.length > 0 && (
            <p className="text-zinc-400 mt-1">Matches: {matchedPreferences.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}