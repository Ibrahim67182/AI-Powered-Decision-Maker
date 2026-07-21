'use client';

import { useState } from 'react';
import { Decision } from '@/lib/types';
import { runMockAssistant } from '@/lib/mockAssistant';

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

    // Mock mode: run entirely client-side, no network call, no API involved at all.
    if (useMock) {
      try {
        const { recommendation, trace } = runMockAssistant(decision);
        setResult({ recommendation, trace, mode: 'mock' });
      } catch {
        setResult({ error: 'Could not generate a demo recommendation for this decision.' });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Live mode: hits your Next.js API route, which calls Groq server-side.
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, decision }),
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
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
            placeholder="Ask the assistant, e.g. 'Which option should we pick?'"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && askAssistant()}
          />
          <button
            onClick={askAssistant}
            disabled={loading || !question.trim()}
            className="px-5 py-2.5 text-sm bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
          <input type="checkbox" checked={useMock} onChange={e => setUseMock(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          Use demo mode (no AI calls, deterministic engine only)
        </label>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-indigo-600 py-4 font-medium animate-in fade-in duration-300">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="ml-2">{useMock ? 'Running deterministic engine…' : 'Consulting the AI assistant…'}</span>
        </div>
      )}

      {!loading && result?.error && (
        <div className="text-sm text-rose-700 border-l-4 border-rose-500 bg-rose-50 rounded-r-lg p-4 shadow-sm">
          {result.error}
        </div>
      )}

      {!loading && result?.recommendation && (
        <div className="space-y-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2">
            {result.mode && (
              <span
                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                  result.mode === 'mock' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {result.mode === 'mock' ? 'Demo mode' : 'Live AI'}
              </span>
            )}
          </div>

          {recommendedOption ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Recommendation</p>
              <p className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{recommendedOption.name}</p>
              <p className="text-base text-slate-800 mt-2 leading-relaxed font-medium">{result.recommendation.explanation}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">No recommendation</p>
              <p className="text-base text-slate-800 leading-relaxed font-medium">{result.recommendation.explanation}</p>
            </div>
          )}

          {result.recommendation.tradeoffs.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-800 uppercase tracking-widest font-bold mb-2">Trade-offs</p>
              <ul className="text-sm text-amber-900 list-disc list-inside space-y-1">
                {result.recommendation.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {result.recommendation.unresolvedQuestions.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-800 uppercase tracking-widest font-bold mb-2">Unresolved questions</p>
              <ul className="text-sm text-indigo-900 list-disc list-inside space-y-1">
                {result.recommendation.unresolvedQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          {result.recommendation.supportingFacts.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-600 uppercase tracking-widest font-bold mb-2">Supporting facts</p>
              <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                {result.recommendation.supportingFacts.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {result.trace && result.trace.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Agent trace</p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                {result.trace.map((t, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md border ${
                        t.status === 'success'
                          ? 'border-slate-200 bg-slate-50 text-slate-600'
                          : 'border-rose-200 bg-rose-50 text-rose-600'
                      }`}
                    >
                      {t.tool} {t.status === 'success' ? '✓' : '✗'}
                    </span>
                    {i < result.trace!.length - 1 && <span className="text-slate-300">→</span>}
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