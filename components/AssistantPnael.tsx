
// AI assistant panel UI component

'use client';

import { useState } from 'react';
import { Decision } from '@/lib/types';

interface Recommendation {
  recommendedOptionId: string;
  explanation: string;
  tradeoffs: string[];
  unresolvedQuestions: string[];
  supportingFacts: string[];
}

interface TraceEntry {
  tool: string;
  status: 'success' | 'error';
  error?: string;
}

interface AssistantResponse {
  recommendation?: Recommendation;
  trace?: TraceEntry[];
  mode?: 'mock' | 'live';
  error?: string;
}

interface Props {
  decision: Decision;
}

export default function AssistantPanel({ decision }: Props) {
  const [question, setQuestion] = useState('');
  const [useMock, setUseMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantResponse | null>(null);

  const askAssistant = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, decision, useMock }),
      });
      const data: AssistantResponse = await res.json();
      setResult(data);
    } catch {
      setResult({ error: 'Could not reach the assistant. Check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const recommendedOption = result?.recommendation?.recommendedOptionId
    ? decision.options.find(o => o.id === result.recommendation!.recommendedOptionId)
    : null;

  return (
    <div className="border border-zinc-700 bg-zinc-800 rounded-xl p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm"
            placeholder="Ask the assistant, e.g. 'Which option should we pick?'"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && askAssistant()}
          />
          <button
            onClick={askAssistant}
            disabled={loading || !question.trim()}
            className="px-4 py-2 text-sm bg-amber-400 text-zinc-900 rounded font-medium hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={useMock} onChange={e => setUseMock(e.target.checked)} />
          Use demo mode (no AI calls, deterministic engine only)
        </label>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-400 py-4">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse [animation-delay:300ms]" />
          <span className="ml-2">Consulting the decision engine…</span>
        </div>
      )}

      {!loading && result?.error && (
        <div className="text-sm text-red-400 border border-red-900 bg-red-950/30 rounded-lg p-3">
          {result.error}
        </div>
      )}

      {!loading && result?.recommendation && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {result.mode && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  result.mode === 'mock'
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-amber-400 text-zinc-900'
                }`}
              >
                {result.mode === 'mock' ? 'Demo mode' : 'Live AI'}
              </span>
            )}
          </div>

          {recommendedOption ? (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Recommendation</p>
              <p className="text-lg font-semibold text-amber-400">{recommendedOption.name}</p>
              <p className="text-sm text-zinc-300 mt-1">{result.recommendation.explanation}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">No recommendation</p>
              <p className="text-sm text-zinc-300">{result.recommendation.explanation}</p>
            </div>
          )}

          {result.recommendation.tradeoffs.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Trade-offs</p>
              <ul className="text-sm text-zinc-300 list-disc list-inside space-y-0.5">
                {result.recommendation.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {result.recommendation.unresolvedQuestions.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Unresolved questions</p>
              <ul className="text-sm text-amber-300 list-disc list-inside space-y-0.5">
                {result.recommendation.unresolvedQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          {result.recommendation.supportingFacts.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Supporting facts</p>
              <ul className="text-sm text-zinc-400 list-disc list-inside space-y-0.5">
                {result.recommendation.supportingFacts.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {result.trace && result.trace.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Agent trace</p>
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {result.trace.map((t, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className={`px-2 py-1 rounded border ${
                        t.status === 'success'
                          ? 'border-zinc-700 bg-zinc-900 text-zinc-300'
                          : 'border-red-800 bg-red-950/30 text-red-400'
                      }`}
                    >
                      {t.tool} {t.status === 'success' ? '✓' : '✗'}
                    </span>
                    {i < result.trace!.length - 1 && <span className="text-zinc-600">→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}