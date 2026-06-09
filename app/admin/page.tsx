'use client';

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar, { type AdminView } from '@/components/AdminSidebar';
import * as api from '@/lib/api';
import type {
  DashboardStats, Vehicle, VehicleListItem, FinancingRequest, Review, TradeIn, ServiceAppointment,
  FinancingStatus, ReviewStatus, TransmissionType, FuelType, VehicleStatus,
  VehicleAIPreviewResponse, VehicleAIImageAnalysisResponse, ContactMessageOut,
  AgentResult, PhaseBRequest, PhaseCRequest,
} from '@/lib/types';
import { Trash2, LogOut, Check, X, Eye, EyeOff, Upload, ChevronLeft, Pencil, Phone, Sparkles, Bot, Copy } from 'lucide-react';

// ── Admin Setup screen ─────────────────────────────────────────────────────────
function AdminSetup({ onCreated }: { onCreated: () => void }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pw !== confirm) { setError('Passwords do not match'); return; }
    if (pw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.adminSetup(pw);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <p className="text-[10px] uppercase tracking-[3px] text-gray-500 text-center">Create Admin Password</p>
        <div className="relative">
          <input autoFocus type={showPw ? 'text' : 'password'} value={pw}
            onChange={e => setPw(e.target.value)} placeholder="Password"
            className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
          <button type="button" onClick={() => setShowPw(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <div className="relative">
          <input type={showConfirm ? 'text' : 'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="Confirm Password"
            className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
          <button type="button" onClick={() => setShowConfirm(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold uppercase tracking-wide text-xs rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
          {loading ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  );
}

// ── Admin Login screen ─────────────────────────────────────────────────────────
function AdminLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.adminLogin(pw);
      localStorage.setItem('adminAuthenticated', 'true');
      onLoggedIn();
    } catch {
      setShake(true);
      setPw('');
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <form onSubmit={submit}
        className={`w-full max-w-xs space-y-4 ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        <p className="text-[10px] uppercase tracking-[3px] text-gray-500 text-center">Admin Password</p>
        <div className="relative">
          <input autoFocus type={show ? 'text' : 'password'} value={pw}
            onChange={e => setPw(e.target.value)} placeholder="Password"
            className="w-full px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold uppercase tracking-wide text-xs rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

// ── AI content generation ──────────────────────────────────────────────────────

type AIContentType = 'description' | 'highlights' | 'seo';

/** Fields the AI banner and modal need from the vehicle form. */
interface AIVehicleFormSnapshot {
  title: string; make: string; model: string; year: number;
  engine: string; drive: string; fuel_economy: string;
  mileage: number; color: string; body_type: string;
  transmission: string; features: string;
}

/** Returns true when the minimum set of fields required for AI generation are filled. */
function aiReadyToGenerate(f: AIVehicleFormSnapshot): boolean {
  return (
    f.title.trim() !== '' && f.make.trim() !== '' && f.model.trim() !== '' &&
    f.year > 0 && f.engine.trim() !== '' && f.drive.trim() !== '' && f.mileage > 0
  );
}

// ── AI Assist Banner ────────────────────────────────────────────────────────────
function AIAssistBanner({ onGenerate }: { onGenerate: (t: AIContentType) => void }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3.5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} className="text-blue-600" />
        <span className="text-[10px] font-black uppercase tracking-[2px] text-blue-600">
          AI Suggestions Available
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['description', 'highlights', 'seo'] as AIContentType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => onGenerate(t)}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            Generate {t === 'description' ? 'Description' : t === 'highlights' ? 'Highlights' : 'SEO Copy'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AI Content Modal ────────────────────────────────────────────────────────────
function AIContentModal({
  type, snapshot, onAccept, onClose,
}: {
  type: AIContentType;
  snapshot: AIVehicleFormSnapshot;
  onAccept: (type: AIContentType, result: VehicleAIPreviewResponse) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [genError, setGenError] = useState('');
  const [result, setResult] = useState<VehicleAIPreviewResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editHighlights, setEditHighlights] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [copied, setCopied] = useState(false);

  const label = type === 'description' ? 'Description' : type === 'highlights' ? 'Highlights' : 'SEO Copy';

  const generate = useCallback(async () => {
    setLoading(true); setGenError(''); setEditing(false);
    try {
      const res = await api.adminGenerateAIContent({
        title:        snapshot.title,
        make:         snapshot.make,
        model:        snapshot.model,
        year:         snapshot.year,
        engine:       snapshot.engine,
        drive:        snapshot.drive,
        fuel_economy: snapshot.fuel_economy,
        mileage:      snapshot.mileage,
        color:        snapshot.color,
        body_type:    snapshot.body_type,
        transmission: snapshot.transmission,
        features:     snapshot.features.split('\n').map(x => x.trim()).filter(Boolean),
      });
      setResult(res);
      setEditDesc(res.description);
      setEditHighlights(res.highlights.join('\n'));
      setEditSeoTitle(res.seo_title);
      setEditMetaDesc(res.meta_description);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Generation failed. Check that ANTHROPIC_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  useEffect(() => { generate(); }, [generate]);

  const handleAccept = () => {
    if (!result) return;
    onAccept(type, {
      ...result,
      description:      editDesc,
      highlights:       editHighlights.split('\n').map(x => x.trim()).filter(Boolean),
      seo_title:        editSeoTitle,
      meta_description: editMetaDesc,
    });
    onClose();
  };

  const copyAll = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(`SEO Title: ${editSeoTitle}\n\nMeta Description: ${editMetaDesc}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-[2px] text-gray-900">
              AI Generated {label}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-[160px]">

          {loading && (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Generating AI content…</p>
            </div>
          )}

          {!loading && genError && (
            <div className="flex flex-col items-center justify-center h-36 gap-3">
              <p className="text-red-400 text-sm text-center">{genError}</p>
              <button onClick={generate}
                className="px-4 py-1.5 text-xs font-bold border border-gray-200 text-gray-500 rounded-lg hover:border-blue-500 hover:text-blue-600 transition">
                Retry
              </button>
            </div>
          )}

          {!loading && result && !editing && (
            <div className="space-y-2.5">
              {type === 'description' && (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{result.description}</p>
              )}
              {type === 'highlights' && (
                <ul className="space-y-2.5">
                  {result.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="text-blue-600 shrink-0 mt-0.5">✦</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
              {type === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 mb-1.5">SEO Title</p>
                    <p className="text-sm text-gray-900 font-bold">{result.seo_title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{result.seo_title.length} / 60 chars</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 mb-1.5">Meta Description</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{result.meta_description}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{result.meta_description.length} / 160 chars</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && result && editing && (
            <div className="space-y-3">
              {type === 'description' && (
                <>
                  <p className="text-[10px] uppercase tracking-[2px] text-gray-400">Edit Description</p>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={7}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </>
              )}
              {type === 'highlights' && (
                <>
                  <p className="text-[10px] uppercase tracking-[2px] text-gray-400">Edit Highlights — one per line</p>
                  <textarea value={editHighlights} onChange={e => setEditHighlights(e.target.value)} rows={7}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </>
              )}
              {type === 'seo' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 mb-1.5">SEO Title</p>
                    <input type="text" value={editSeoTitle} onChange={e => setEditSeoTitle(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    <p className="text-[10px] text-gray-500 mt-0.5">{editSeoTitle.length} / 60 chars</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 mb-1.5">Meta Description</p>
                    <textarea value={editMetaDesc} onChange={e => setEditMetaDesc(e.target.value)} rows={3}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    <p className="text-[10px] text-gray-500 mt-0.5">{editMetaDesc.length} / 160 chars</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(result && !loading) && (
          <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 shrink-0 flex-wrap">
            {type === 'seo' && !editing ? (
              <button onClick={copyAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-black font-black uppercase tracking-wide text-xs rounded-xl hover:bg-blue-700 transition">
                {copied && <Check size={11} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            ) : (
              <button onClick={handleAccept}
                className="px-4 py-2 bg-blue-600 text-black font-black uppercase tracking-wide text-xs rounded-xl hover:bg-blue-700 transition">
                Accept
              </button>
            )}
            <button onClick={generate}
              className="px-4 py-2 text-xs font-bold border border-gray-200 text-gray-500 rounded-xl hover:border-blue-500 hover:text-blue-600 transition">
              Regenerate
            </button>
            <button onClick={() => setEditing(e => !e)}
              className="px-4 py-2 text-xs font-bold border border-gray-200 text-gray-500 rounded-xl hover:border-gray-400 hover:text-gray-700 transition">
              {editing ? 'Preview' : 'Edit'}
            </button>
            <button onClick={onClose} className="ml-auto px-3 py-2 text-xs text-gray-400 hover:text-gray-700 transition">
              Cancel
            </button>
          </div>
        )}
        {(!result && !loading) && (
          <div className="flex justify-end px-6 py-4 border-t border-gray-100 shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-700 transition">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI image analyse panel ─────────────────────────────────────────────────────
function AIImageAnalyzePanel({
  image,
  onApply,
}: {
  image: File;
  onApply: (field: string, value: unknown) => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<VehicleAIImageAnalysisResponse | null>(null);
  const [errMsg, setErrMsg] = useState('');
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const analyze = useCallback(async () => {
    setPhase('loading'); setErrMsg(''); setResult(null); setApplied(new Set());
    try {
      const res = await api.adminAnalyzeVehicleImage(image);
      setResult(res);
      setPhase('done');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Analysis failed');
      setPhase('error');
    }
  }, [image]);

  const applyOne = (field: string, value: unknown) => {
    onApply(field, value);
    setApplied(prev => { const s = new Set(Array.from(prev)); s.add(field); return s; });
  };

  const applyAll = () => {
    if (!result) return;
    const pairs: [string, unknown][] = [
      ['title',     result.title],
      ['make',      result.make],
      ['model',     result.model],
      ['year',      result.year],
      ['color',     result.color],
      ['body_type', result.body_type],
    ];
    const next = new Set(Array.from(applied));
    pairs.forEach(([field, value]) => {
      if (value !== null && value !== undefined) { onApply(field, value); next.add(field); }
    });
    setApplied(next);
  };

  // Build flat list of non-null suggestions
  const suggestions: { field: string; label: string; value: string | number }[] = result
    ? ([
        result.title     && { field: 'title',     label: 'Title',     value: result.title },
        result.make      && { field: 'make',       label: 'Make',      value: result.make },
        result.model     && { field: 'model',      label: 'Model',     value: result.model },
        result.year      && { field: 'year',       label: 'Year',      value: result.year },
        result.color     && { field: 'color',      label: 'Color',     value: result.color },
        result.body_type && { field: 'body_type',  label: 'Body Type', value: result.body_type },
      ] as const).filter(Boolean) as { field: string; label: string; value: string | number }[]
    : [];

  const allApplied = suggestions.length > 0 && suggestions.every(s => applied.has(s.field));

  /* ── idle ── */
  if (phase === 'idle') return (
    <button type="button" onClick={analyze}
      className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-600 transition mt-2">
      <Sparkles size={11} />
      Analyze image with AI
    </button>
  );

  /* ── loading ── */
  if (phase === 'loading') return (
    <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
      <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      Analyzing image…
    </div>
  );

  /* ── error ── */
  if (phase === 'error') return (
    <div className="flex items-center gap-3 text-xs mt-2">
      <span className="text-red-400">{errMsg}</span>
      <button type="button" onClick={analyze}
        className="text-gray-500 hover:text-gray-700 transition underline underline-offset-2">Retry</button>
    </div>
  );

  /* ── done: no detectable fields ── */
  if (!result || suggestions.length === 0) return (
    <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
      <span>AI could not identify vehicle details from this image.</span>
      <button type="button" onClick={analyze}
        className="text-gray-500 hover:text-gray-700 transition underline underline-offset-2">Re-analyze</button>
    </div>
  );

  /* ── done: suggestions panel ── */
  return (
    <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3.5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-[2px] text-blue-600">
            AI Detected Details
          </span>
        </div>
        {!allApplied && (
          <button type="button" onClick={applyAll}
            className="text-[10px] font-black uppercase tracking-wide text-blue-600 hover:text-blue-700 transition">
            Apply All
          </button>
        )}
        {allApplied && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <Check size={10} /> All applied
          </span>
        )}
      </div>

      {/* Field rows */}
      <div className="space-y-2">
        {suggestions.map(({ field, label, value }) => {
          const isApplied = applied.has(field);
          return (
            <div key={field} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 w-16 shrink-0">{label}</span>
              <span className="text-xs text-gray-900 flex-1 truncate">{String(value)}</span>
              <button type="button" onClick={() => !isApplied && applyOne(field, value)}
                className={`shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border transition ${
                  isApplied
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}>
                {isApplied ? <><Check size={9} /> Applied</> : 'Apply'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Confidence note */}
      {result.confidence_note && (
        <p className="text-[10px] text-gray-500 border-t border-gray-100 pt-2.5 leading-relaxed">
          {result.confidence_note}
        </p>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-4 pt-0.5">
        <button type="button" onClick={analyze}
          className="text-[10px] text-gray-400 hover:text-blue-600 transition">
          Re-analyze
        </button>
        <button type="button" onClick={() => { setPhase('idle'); setResult(null); }}
          className="text-[10px] text-gray-400 hover:text-gray-500 transition">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── Shared: drag-and-drop image zone ──────────────────────────────────────────
interface ImgEntry {
  file: File;
  preview: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
}

function ImageDropZone({ onFiles, className = '' }: { onFiles: (f: File[]) => void; className?: string }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (list: FileList | null) => {
    if (!list) return;
    const imgs = Array.from(list).filter(f => f.type.startsWith('image/'));
    if (imgs.length) onFiles(imgs);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragEnter={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-8 transition select-none ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
    >
      <Upload size={22} className="text-gray-400 pointer-events-none" />
      <div className="text-center pointer-events-none">
        <p className="text-sm text-gray-500">Drag and drop images here</p>
        <p className="text-xs text-gray-500 mt-1">or</p>
      </div>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
        className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide border border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition"
      >
        Choose Images
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handle(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

// ── Shared: image entry preview grid ──────────────────────────────────────────
function ImageEntryGrid({
  entries,
  onRemove,
}: {
  entries: ImgEntry[];
  onRemove: (i: number) => void;
}) {
  if (!entries.length) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 mt-3">
      {entries.map((entry, i) => (
        <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group">
          <img src={entry.preview} alt="" className="w-full h-full object-cover" />
          {entry.status === 'idle' && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition"
            >
              <X size={10} />
            </button>
          )}
          {entry.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {entry.status === 'done' && (
            <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center">
              <Check size={18} className="text-emerald-400" />
            </div>
          )}
          {entry.status === 'error' && (
            <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
              <X size={18} className="text-red-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[2px] text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-blue-600">{sub}</p>}
    </div>
  );
});

// ── Status badge ───────────────────────────────────────────────────────────────
const Badge = memo(function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400',
    approved: 'bg-emerald-500/10 text-emerald-400',
    rejected: 'bg-red-500/10 text-red-400',
    in_review: 'bg-blue-500/10 text-blue-400',
    available: 'bg-emerald-500/10 text-emerald-400',
    sold: 'bg-red-500/10 text-red-400',
    scheduled: 'bg-blue-500/10 text-blue-400',
    confirmed: 'bg-emerald-500/10 text-emerald-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${map[status] ?? 'bg-gray-200 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
});

// ── Dashboard skeleton ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div>
      <div className="h-8 w-44 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="h-2.5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-8 w-14 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-2.5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard view ─────────────────────────────────────────────────────────────
function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getDashboardStats()
      .then(data => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error || !stats) return <p className="text-gray-500">Failed to load stats.</p>;

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Vehicles" value={stats.vehicles.total} sub={`${stats.vehicles.available} available · ${stats.vehicles.sold} sold`} />
        <StatCard label="Total Users" value={stats.users.total} />
        <StatCard label="Financing" value={stats.financing.total} sub={`${stats.financing.pending} pending`} />
        <StatCard label="Trade-Ins" value={stats.trade_ins.total} />
        <StatCard label="Appointments" value={stats.appointments.total} />
        <StatCard label="Reviews" value={stats.reviews.total} sub={`${stats.reviews.pending} awaiting approval`} />
      </div>
    </div>
  );
}

// ── Edit vehicle images view ───────────────────────────────────────────────────
function EditVehicleImages({ vehicle, onDone }: { vehicle: VehicleListItem; onDone: () => void }) {
  const [images, setImages] = useState<string[]>(vehicle.images);
  const [pending, setPending] = useState<ImgEntry[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    return () => { pendingRef.current.forEach(e => URL.revokeObjectURL(e.preview)); };
  }, []);

  const handleNewFiles = (files: File[]) => {
    const entries: ImgEntry[] = files.map(f => ({
      file: f, preview: URL.createObjectURL(f), status: 'idle',
    }));
    setPending(prev => [...prev, ...entries]);
  };

  const removeEntry = (i: number) => {
    setPending(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Delete this image?')) return;
    setDeleting(url);
    try {
      const updated = await api.adminDeleteVehicleImage(vehicle.id, url);
      setImages(updated.images);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleDrop = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setImages(reordered);
    setReordering(true);
    try {
      await api.adminReorderImages(vehicle.id, reordered);
    } catch {
      setImages(images); // rollback
      alert('Failed to save order');
    } finally {
      setReordering(false);
    }
  };

  const uploadAll = async () => {
    const idleCount = pending.filter(e => e.status === 'idle').length;
    if (!idleCount) return;
    setUploading(true);
    for (let i = 0; i < pending.length; i++) {
      if (pending[i].status !== 'idle') continue;
      setPending(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'uploading' } : e));
      try {
        const updated = await api.adminUploadImage(vehicle.id, pending[i].file);
        setImages(updated.images);
        setPending(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'done' } : e));
      } catch {
        setPending(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'error' } : e));
      }
    }
    setUploading(false);
  };

  const idleCount = pending.filter(e => e.status === 'idle').length;
  const doneCount = pending.filter(e => e.status === 'done').length;
  const allDone = pending.length > 0 && pending.every(e => e.status === 'done');

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onDone}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition">
          <ChevronLeft size={14} /> Back
        </button>
        <h1 className="text-xl font-black text-gray-900">{vehicle.title} — Images</h1>
        {reordering && <span className="text-xs text-blue-600">Saving order…</span>}
      </div>

      {/* Existing images — draggable to reorder */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] uppercase tracking-[2px] text-gray-400">
            Current Images{images.length > 0 ? ` (${images.length})` : ''}
          </p>
          {images.length > 1 && (
            <p className="text-[10px] text-gray-500">drag to reorder</p>
          )}
        </div>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
                onDragLeave={() => setDragOverIdx(null)}
                onDrop={e => {
                  e.preventDefault();
                  if (dragIdx !== null) handleDrop(dragIdx, i);
                  setDragIdx(null);
                  setDragOverIdx(null);
                }}
                className={`relative aspect-video rounded-xl overflow-hidden bg-gray-100 group cursor-grab active:cursor-grabbing transition-all ${
                  dragIdx === i ? 'opacity-40 scale-95' : ''
                } ${
                  dragOverIdx === i && dragIdx !== i
                    ? 'ring-2 ring-blue-500 scale-[1.03]'
                    : ''
                }`}
              >
                <img src={api.getImageUrl(url)} alt="" className="w-full h-full object-cover pointer-events-none" />
                {/* first image badge */}
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-semibold uppercase rounded">
                    Cover
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                  <button
                    onClick={() => handleDelete(url)}
                    disabled={!!deleting}
                    className="px-3 py-1 text-[10px] font-bold bg-red-600/90 text-white rounded hover:bg-red-500 transition disabled:opacity-50"
                  >
                    {deleting === url ? '…' : 'Delete'}
                  </button>
                </div>
                {deleting === url && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No images yet.</p>
        )}
      </div>

      {/* Add more */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[2px] text-gray-400 mb-3">Add More Images</p>
        <ImageDropZone onFiles={handleNewFiles} />
        <ImageEntryGrid entries={pending} onRemove={removeEntry} />
      </div>

      {/* Upload controls */}
      {pending.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={uploadAll}
            disabled={uploading || idleCount === 0}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold uppercase tracking-wide text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploading
              ? `Uploading ${doneCount} / ${pending.length}…`
              : `Upload ${idleCount} Image${idleCount !== 1 ? 's' : ''}`}
          </button>
          {allDone && <span className="text-xs text-emerald-400">All uploaded!</span>}
        </div>
      )}

      <button onClick={onDone}
        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wide border border-gray-200 text-gray-500 rounded-xl hover:border-blue-500 hover:text-blue-600 transition">
        Done
      </button>
    </div>
  );
}

// ── Edit vehicle details view ──────────────────────────────────────────────────
function EditVehicleDetailsView({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [aiModal, setAiModal] = useState<AIContentType | null>(null);

  const [form, setForm] = useState({
    title: '', make: '', model: '', year: new Date().getFullYear(),
    mileage: 0, price: '', price_on_call: false,
    transmission: 'automatic' as TransmissionType,
    fuel_type: 'gasoline' as FuelType,
    vin: '', description: '', color: '', body_type: '',
    featured: false, status: 'available' as VehicleStatus,
    stock_number: '', engine: '', drive: '', fuel_economy: '', features: '',
  });

  useEffect(() => {
    let cancelled = false;
    api.getVehicle(vehicleId).then((v: Vehicle) => {
      if (cancelled) return;
      setForm({
        title: v.title,
        make: v.make,
        model: v.model,
        year: v.year,
        mileage: v.mileage,
        price: v.price,
        price_on_call: v.price_on_call,
        transmission: v.transmission,
        fuel_type: v.fuel_type,
        vin: v.vin,
        description: v.description ?? '',
        color: v.color ?? '',
        body_type: v.body_type ?? '',
        featured: v.featured,
        status: v.status,
        stock_number: v.stock_number ?? '',
        engine: v.engine ?? '',
        drive: v.drive ?? '',
        fuel_economy: v.fuel_economy ?? '',
        features: (v.features ?? []).join('\n'),
      });
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setError('Failed to load vehicle'); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [vehicleId]);

  const set = useCallback((k: string, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }));
  }, []);

  const handleAIAccept = useCallback((type: AIContentType, result: VehicleAIPreviewResponse) => {
    if (type === 'description') {
      set('description', result.description);
    } else if (type === 'highlights') {
      setForm(f => ({
        ...f,
        features: f.features.trim()
          ? f.features.trim() + '\n' + result.highlights.join('\n')
          : result.highlights.join('\n'),
      }));
    }
    // 'seo' is clipboard-only — no form field to write
  }, [set]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.adminUpdateVehicle(vehicleId, {
        ...form,
        description: form.description || undefined,
        color: form.color || undefined,
        body_type: form.body_type || undefined,
        features: form.features.split('\n').map(x => x.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(onDone, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        placeholder={placeholder}
        onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-56 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-6 max-w-2xl space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <div className="h-2.5 w-20 bg-gray-200 rounded animate-pulse mb-1.5" />
              <div className="h-10 bg-gray-200/80 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.06 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {aiModal && (
        <AIContentModal
          type={aiModal}
          snapshot={form}
          onAccept={handleAIAccept}
          onClose={() => setAiModal(null)}
        />
      )}

      <div className="flex items-center gap-4 mb-6">
        <button onClick={onDone} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition">
          <ChevronLeft size={14} /> Back
        </button>
        <h1 className="text-xl font-black text-gray-900">Edit Vehicle</h1>
      </div>

      <form onSubmit={save} className="bg-white border border-gray-100 rounded-xl p-6 max-w-2xl space-y-5">

        {/* Core identity */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-gray-500 mb-3">Identity</p>
          {field('Title', 'title', 'text', '2023 BMW M3 Competition')}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {field('Make', 'make', 'text', 'BMW')}
            {field('Model', 'model', 'text', 'M3')}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {field('Year', 'year', 'number')}
            {field('VIN (17 chars)', 'vin', 'text')}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Specs */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-gray-500 mb-3">Specs</p>
          <div className="grid grid-cols-2 gap-4">
            {field('Mileage', 'mileage', 'number')}
            {field('Color', 'color', 'text', 'Midnight Black')}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {field('Body Type', 'body_type', 'text', 'Sedan')}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Transmission</label>
              <select value={form.transmission} onChange={e => set('transmission', e.target.value as TransmissionType)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
                <option value="dct">Dual-Clutch</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Fuel Type</label>
            <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value as FuelType)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="plug_in_hybrid">Plug-In Hybrid</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {field('Stock Number', 'stock_number', 'text', 'BMW-M3-001')}
            {field('Engine', 'engine', 'text', '3.0L Twin Turbo I6')}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {field('Drive', 'drive', 'text', 'AWD')}
            {field('Fuel Economy', 'fuel_economy', 'text', '16 city / 23 highway')}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Pricing */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-gray-500 mb-3">Pricing</p>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              {field('Price ($)', 'price', 'text', '89500.00')}
            </div>
            <label className={`flex items-center gap-2.5 shrink-0 mb-0.5 px-4 py-2.5 rounded-xl border cursor-pointer transition select-none ${
              form.price_on_call
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
            }`}>
              <input type="checkbox" checked={form.price_on_call}
                onChange={e => set('price_on_call', e.target.checked)} className="hidden" />
              <Phone size={13} />
              <span className="text-xs font-bold uppercase tracking-wide">Call for Price</span>
            </label>
          </div>
          {form.price_on_call && (
            <p className="mt-2 text-[11px] text-blue-500">
              Price is saved internally but customers will see &quot;Call for Price&quot; instead.
            </p>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Availability */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-gray-500 mb-3">Availability</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as VehicleStatus)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <label className={`flex items-center gap-2.5 shrink-0 mt-5 px-4 py-2.5 rounded-xl border cursor-pointer transition select-none ${
              form.featured
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
            }`}>
              <input type="checkbox" checked={form.featured}
                onChange={e => set('featured', e.target.checked)} className="hidden" />
              <span className="text-xs font-bold uppercase tracking-wide">Featured</span>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* AI suggestions (shown once minimum required fields are filled) */}
        {aiReadyToGenerate(form) && (
          <AIAssistBanner onGenerate={t => setAiModal(t)} />
        )}

        {/* Description */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-gray-500 mb-3">Description</p>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            placeholder="Optional description shown to customers on the vehicle detail page…"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none placeholder-gray-400"
          />
        </div>

        {/* Features */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-gray-500 mb-3">Features</p>
          <textarea
            value={form.features}
            onChange={e => set('features', e.target.value)}
            rows={4}
            placeholder={"Carbon Fiber Trim\nHeads-Up Display\nApple CarPlay\nHarman Kardon Audio"}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none placeholder-gray-400"
          />
          <p className="mt-1 text-[10px] text-gray-500">One feature per line</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {saved && <p className="text-emerald-400 text-sm">Saved! Returning to list…</p>}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving || saved}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold uppercase tracking-wide text-xs rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button type="button" onClick={onDone}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wide border border-gray-200 text-gray-500 rounded-xl hover:border-blue-500 hover:text-blue-600 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Table skeleton ─────────────────────────────────────────────────────────────
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-6 px-5 py-3 border-b border-gray-100">
        {[120, 48, 72, 64, 56, 32].map((w, i) => (
          <div key={i} className="h-2.5 bg-gray-200 rounded animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            <div className="h-4 flex-1 bg-gray-200/80 rounded animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
            <div className="h-4 w-12 bg-gray-200/60 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200/60 rounded animate-pulse" />
            <div className="h-5 w-16 bg-gray-200/60 rounded-full animate-pulse" />
            <div className="h-4 w-14 bg-gray-200/60 rounded animate-pulse" />
            <div className="h-4 w-10 bg-gray-200/40 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Vehicles view ──────────────────────────────────────────────────────────────
function VehiclesView() {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<VehicleListItem | null>(null);
  const [editingDetailsId, setEditingDetailsId] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListVehicles(page, 15);
      setVehicles(data.items);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const del = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    setDeleting(id);
    try {
      await api.adminDeleteVehicle(id);
      setVehicles(v => v.filter(x => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (editingDetailsId) {
    return (
      <EditVehicleDetailsView
        vehicleId={editingDetailsId}
        onDone={() => { setEditingDetailsId(null); fetchVehicles(); }}
      />
    );
  }

  if (editingVehicle) {
    return (
      <EditVehicleImages
        vehicle={editingVehicle}
        onDone={() => { setEditingVehicle(null); fetchVehicles(); }}
      />
    );
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Vehicles</h1>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] uppercase tracking-[2px] text-gray-400">
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Year</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Images</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-900 font-medium">{v.title}</td>
                <td className="px-5 py-3 text-gray-500">{v.year}</td>
                <td className="px-5 py-3">
                  {v.price_on_call ? (
                    <span className="flex items-center gap-1 text-blue-500 text-xs font-bold">
                      <Phone size={11} /> Call
                    </span>
                  ) : (
                    <span className="text-blue-600 font-bold">${parseFloat(v.price).toLocaleString()}</span>
                  )}
                </td>
                <td className="px-5 py-3"><Badge status={v.status} /></td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setEditingVehicle(v)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition"
                  >
                    <span className="text-gray-500">{v.images.length}</span>
                    <span className="underline underline-offset-2">Images</span>
                  </button>
                </td>
                <td className="px-5 py-3 flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => setEditingDetailsId(v.id)}
                    title="Edit vehicle details"
                    className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                    <Pencil size={14} />
                  </button>
                  <Link href={`/inventory/${v.id}`} target="_blank"
                    className="text-xs text-gray-500 hover:text-gray-700 transition px-1">View</Link>
                  <button onClick={() => del(v.id)} disabled={deleting === v.id}
                    className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}

// ── Add vehicle view ───────────────────────────────────────────────────────────
function AddVehicleView({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', make: '', model: '', year: new Date().getFullYear(),
    mileage: 0, price: '', transmission: 'automatic' as TransmissionType,
    fuel_type: 'gasoline' as FuelType, vin: '', description: '',
    color: '', body_type: '', featured: false, price_on_call: false,
    status: 'available' as VehicleStatus,
    stock_number: '', engine: '', drive: '', fuel_economy: '', features: '',
  });
  const [imgEntries, setImgEntries] = useState<ImgEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'creating' | 'uploading' | 'done'>('idle');
  const [aiModal, setAiModal] = useState<AIContentType | null>(null);
  const imgEntriesRef = useRef(imgEntries);
  imgEntriesRef.current = imgEntries;

  useEffect(() => {
    return () => { imgEntriesRef.current.forEach(e => URL.revokeObjectURL(e.preview)); };
  }, []);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleImages = (files: File[]) => {
    const entries: ImgEntry[] = files.map(f => ({
      file: f, preview: URL.createObjectURL(f), status: 'idle',
    }));
    setImgEntries(prev => [...prev, ...entries]);
  };

  const removeImg = (i: number) => {
    setImgEntries(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleAIAccept = (type: AIContentType, result: VehicleAIPreviewResponse) => {
    if (type === 'description') {
      set('description', result.description);
    } else if (type === 'highlights') {
      setForm(f => ({
        ...f,
        features: f.features.trim()
          ? f.features.trim() + '\n' + result.highlights.join('\n')
          : result.highlights.join('\n'),
      }));
    }
    // 'seo' is clipboard-only — no form field to write
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPhase('creating');

    let vehicleId: string;
    try {
      const vehicle = await api.adminCreateVehicle({
        ...form,
        price: form.price,
        features: form.features.split('\n').map(x => x.trim()).filter(Boolean),
      });
      vehicleId = vehicle.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
      setLoading(false);
      setPhase('idle');
      return;
    }

    if (imgEntries.length > 0) {
      setUploading(true);
      setPhase('uploading');
      for (let i = 0; i < imgEntries.length; i++) {
        setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'uploading' } : e));
        try {
          await api.adminUploadImage(vehicleId, imgEntries[i].file);
          setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'done' } : e));
        } catch {
          setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'error' } : e));
        }
      }
      setUploading(false);
    }

    setPhase('done');
    setLoading(false);

    // Reset form fields
    setForm({
      title: '', make: '', model: '', year: new Date().getFullYear(),
      mileage: 0, price: '', transmission: 'automatic',
      fuel_type: 'gasoline', vin: '', description: '',
      color: '', body_type: '', featured: false, price_on_call: false, status: 'available',
      stock_number: '', engine: '', drive: '', fuel_economy: '', features: '',
    });
    imgEntriesRef.current.forEach(e => URL.revokeObjectURL(e.preview));
    setImgEntries([]);

    // Switch to vehicles view after short delay so user sees done state
    setTimeout(onCreated, 1200);
  };

  const input = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">{label}</label>
      <input type={type} value={String(form[key as keyof typeof form])} placeholder={placeholder}
        onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
    </div>
  );

  const doneCount = imgEntries.filter(e => e.status === 'done').length;

  return (
    <div>
      {aiModal && (
        <AIContentModal
          type={aiModal}
          snapshot={form}
          onAccept={handleAIAccept}
          onClose={() => setAiModal(null)}
        />
      )}

      <h1 className="text-2xl font-black text-gray-900 mb-6">Add Vehicle</h1>
      <form onSubmit={submit} className="bg-white border border-gray-100 rounded-xl p-6 max-w-2xl space-y-4">
        {input('Title', 'title', 'text', '2023 BMW M3 Competition')}
        <div className="grid grid-cols-2 gap-4">
          {input('Make', 'make', 'text', 'BMW')}
          {input('Model', 'model', 'text', 'M3')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {input('Year', 'year', 'number')}
          {input('Mileage', 'mileage', 'number')}
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Price ($)</label>
          <div className="flex gap-3 items-center">
            <input type="text" value={form.price} placeholder="89500.00"
              onChange={e => set('price', e.target.value)}
              className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
            <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition select-none whitespace-nowrap ${
              form.price_on_call
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
            }`}>
              <input type="checkbox" checked={form.price_on_call}
                onChange={e => set('price_on_call', e.target.checked)} className="hidden" />
              <Phone size={12} />
              <span className="text-xs font-bold uppercase tracking-wide">Call for Price</span>
            </label>
          </div>
          {form.price_on_call && (
            <p className="mt-1.5 text-[11px] text-blue-500">Price stored internally; customers see &quot;Call for Price&quot;.</p>
          )}
        </div>
        {input('VIN (17 chars)', 'vin', 'text', 'WBS8M9C52P5A00001')}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Transmission</label>
            <select value={form.transmission} onChange={e => set('transmission', e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
              <option value="cvt">CVT</option>
              <option value="dct">Dual-Clutch</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Fuel Type</label>
            <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="plug_in_hybrid">Plug-In Hybrid</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {input('Color', 'color', 'text', 'Midnight Black')}
          {input('Body Type', 'body_type', 'text', 'Sedan')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {input('Stock Number', 'stock_number', 'text', 'BMW-M3-001')}
          {input('Engine', 'engine', 'text', '3.0L Twin Turbo I6')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {input('Drive', 'drive', 'text', 'AWD')}
          {input('Fuel Economy', 'fuel_economy', 'text', '16 city / 23 highway')}
        </div>
        {/* AI suggestions (shown once minimum required fields are filled) */}
        {aiReadyToGenerate(form) && (
          <AIAssistBanner onGenerate={t => setAiModal(t)} />
        )}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Features</label>
          <textarea value={form.features} onChange={e => set('features', e.target.value)} rows={4}
            placeholder={"Carbon Fiber Trim\nHeads-Up Display\nApple CarPlay\nHarman Kardon Audio"}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none placeholder-gray-400" />
          <p className="mt-1 text-[10px] text-gray-500">One feature per line</p>
        </div>

        {/* ── Image upload section ─────────────────────────────────────── */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 block mb-1.5">Vehicle Images</label>
          <ImageDropZone onFiles={handleImages} />
          <ImageEntryGrid entries={imgEntries} onRemove={removeImg} />
          {/* AI image analysis — appears as soon as the first image is dropped */}
          {imgEntries.length > 0 && phase === 'idle' && (
            <AIImageAnalyzePanel
              key={imgEntries[0].preview}
              image={imgEntries[0].file}
              onApply={set}
            />
          )}
          {uploading && (
            <p className="text-xs text-blue-600 mt-2">
              Uploading {doneCount} / {imgEntries.length} images…
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-600">Featured</span>
          </label>
          <div className="flex-1" />
          <div>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {phase === 'done' && (
          <p className="text-emerald-400 text-sm">Vehicle created. Redirecting to inventory…</p>
        )}

        <button type="submit" disabled={loading || phase === 'done'}
          className="w-full py-3 bg-blue-600 text-white font-semibold uppercase tracking-wide text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
          {phase === 'creating' ? 'Creating vehicle…'
            : phase === 'uploading' ? `Uploading images ${doneCount}/${imgEntries.length}…`
            : phase === 'done' ? 'Done!'
            : imgEntries.length > 0 ? `Create & Upload ${imgEntries.length} Image${imgEntries.length !== 1 ? 's' : ''}`
            : 'Create Vehicle'}
        </button>
      </form>
    </div>
  );
}

// ── Financing view ─────────────────────────────────────────────────────────────
function FinancingView() {
  const [items, setItems] = useState<FinancingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListFinancing(undefined, page);
      setItems(data.items); setPages(data.pages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (id: string, status: FinancingStatus) => {
    setUpdating(id);
    try {
      const updated = await api.adminUpdateFinancing(id, { status });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  }, []);

  if (loading) return (
    <div>
      <div className="h-8 w-52 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Financing Requests</h1>
      <div className="space-y-3">
        {items.map(req => (
          <div key={req.id} className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Badge status={req.status} />
                <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-900 font-bold text-sm truncate">{req.phone} · {req.address}</p>
              <p className="text-gray-500 text-xs mt-1">
                Income: ${parseFloat(req.annual_income).toLocaleString()} · Credit: {req.credit_score_range} · Down: ${parseFloat(req.down_payment).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {req.status === 'pending' && (
                <>
                  <button onClick={() => update(req.id, 'approved')} disabled={updating === req.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition disabled:opacity-50">
                    <Check size={12} /> Approve
                  </button>
                  <button onClick={() => update(req.id, 'rejected')} disabled={updating === req.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition disabled:opacity-50">
                    <X size={12} /> Reject
                  </button>
                </>
              )}
              {req.status === 'in_review' && (
                <button onClick={() => update(req.id, 'approved')} disabled={updating === req.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition disabled:opacity-50">
                  <Check size={12} /> Approve
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No financing requests.</p>}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}

// ── Reviews view ───────────────────────────────────────────────────────────────
function ReviewsView() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListReviews(undefined, page);
      setItems(data.items); setPages(data.pages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (id: string, status: ReviewStatus) => {
    setUpdating(id);
    try {
      const updated = await api.adminUpdateReview(id, { status });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  }, []);

  const del = useCallback(async (id: string) => {
    if (!confirm('Delete this review?')) return;
    setUpdating(id);
    try {
      await api.adminDeleteReview(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  }, []);

  if (loading) return (
    <div>
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Reviews</h1>
      <div className="space-y-3">
        {items.map(r => (
          <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge status={r.status} />
                  <span className="text-amber-400 text-xs font-bold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-900 font-bold text-sm">{r.title}</p>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{r.body}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => update(r.id, 'approved')} disabled={updating === r.id}
                      className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50">
                      <Check size={13} />
                    </button>
                    <button onClick={() => update(r.id, 'rejected')} disabled={updating === r.id}
                      className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
                      <X size={13} />
                    </button>
                  </>
                )}
                <button onClick={() => del(r.id)} disabled={updating === r.id}
                  className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition disabled:opacity-50">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No reviews.</p>}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}

// ── Contact / Inquiries view ───────────────────────────────────────────────────
function ContactView() {
  const [items, setItems]   = useState<ContactMessageOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [marking, setMarking] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListContactMessages(page);
      setItems(data.items as ContactMessageOut[]);
      setPages(data.pages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const markRead = useCallback(async (id: string) => {
    setMarking(id);
    try {
      await api.adminMarkContactRead(id);
      setItems(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setMarking(null); }
  }, []);

  if (loading) return (
    <div>
      <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );

  const unread = items.filter(m => !m.read).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-gray-900">Inquiries</h1>
        {unread > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-600 border border-blue-200">
            {unread} unread
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No inquiries yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map(m => {
            const isOpen = expanded === m.id;
            return (
              <div key={m.id}
                className={`bg-white rounded-xl border transition-colors ${
                  m.read ? 'border-gray-100' : 'border-blue-200'
                }`}>
                {/* Header row — always visible */}
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 text-left"
                  onClick={() => {
                    setExpanded(isOpen ? null : m.id);
                    if (!m.read) markRead(m.id);
                  }}
                >
                  {/* Unread dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${m.read ? 'bg-transparent' : 'bg-blue-600'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-900 font-bold text-sm">{m.name}</span>
                      <span className="text-gray-400 text-xs truncate">{m.email}</span>
                      {m.phone && <span className="text-gray-500 text-xs">· {m.phone}</span>}
                    </div>
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-wide mt-0.5">{m.subject}</p>
                  </div>

                  <span className="text-gray-500 text-xs shrink-0">
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round"
                    className={`text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded message body */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed pt-4 whitespace-pre-wrap">{m.message}</p>
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                      <a href={`mailto:${m.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition">
                        <Phone size={11} /> Reply via Email
                      </a>
                      {!m.read && (
                        <button onClick={() => markRead(m.id)} disabled={marking === m.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-100 transition disabled:opacity-50">
                          <Check size={11} /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}

// ── Card skeleton (for list views) ────────────────────────────────────────────
function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5" style={{ opacity: 1 - i * 0.12 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 w-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ── Trade-ins view ─────────────────────────────────────────────────────────────
function TradeInsView() {
  const [items, setItems] = useState<TradeIn[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  const load = useCallback(() => {
    if (fetched.current) return;
    fetched.current = true;
    api.adminListTradeIns()
      .then(d => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div>
      <div className="h-8 w-36 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Trade-Ins</h1>
      <div className="space-y-3">
        {items.map(t => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Badge status={t.status} />
              <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-900 font-bold">{t.year} {t.make} {t.model} · {t.mileage.toLocaleString()} mi</p>
            <p className="text-gray-500 text-xs mt-1">
              Condition: {t.condition} · Accident: {t.accident_history ? 'Yes' : 'No'}
              {t.asking_price && ` · Asking: $${parseFloat(t.asking_price).toLocaleString()}`}
            </p>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No trade-ins.</p>}
      </div>
    </div>
  );
}

// ── Appointments view ──────────────────────────────────────────────────────────
function AppointmentsView() {
  const [items, setItems] = useState<ServiceAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const fetched = useRef(false);

  const load = useCallback(() => {
    if (fetched.current) return;
    fetched.current = true;
    api.adminListAppointments()
      .then(d => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmAppt = async (id: string) => {
    setUpdating(id);
    try {
      const updated = await api.adminUpdateAppointment(id, { status: 'confirmed' });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  };

  if (loading) return (
    <div>
      <div className="h-8 w-44 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Appointments</h1>
      <div className="space-y-3">
        {items.map(a => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <Badge status={a.status} />
                <span className="text-xs text-gray-400">{new Date(a.appointment_date).toLocaleString()}</span>
              </div>
              <p className="text-gray-900 font-bold capitalize">{a.service_type.replace('_', ' ')}</p>
              <p className="text-gray-500 text-xs">{a.phone}</p>
            </div>
            {a.status === 'scheduled' && (
              <button onClick={() => confirmAppt(a.id)} disabled={updating === a.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition disabled:opacity-50">
                <Check size={12} /> Confirm
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No appointments.</p>}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

const Pagination = memo(function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-blue-500 hover:text-blue-600 transition">
        Prev
      </button>
      <span className="text-xs text-gray-400">{page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-blue-500 hover:text-blue-600 transition">
        Next
      </button>
    </div>
  );
});

// ── AI Sales Agent view ────────────────────────────────────────────────────────


// ── Wizard types ──────────────────────────────────────────────────────────────

type WizardPhase =
  | 'vin-input'
  | 'phase-a'
  | 'clarify'
  | 'phase-b'
  | 'features'
  | 'review'
  | 'phase-c'
  | 'complete';

interface UserReviewData {
  mileage: number;
  color: string;
  asking_price: string;
  condition: string;
  title_status: string;
  body_type: string;
  drive: string;
  features: string;
  service_history: string;
  notes: string;
  stock_number: string;
  fuel_economy: string;
  featured: boolean;
  status: VehicleStatus;
}

interface ListingEdit {
  listing_title: string;
  listing_description: string;
  suggested_price: string;
  key_features: string[];
  facebook_copy: string;
  ebay_listing_description: string;
}


function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-500 rounded-lg hover:border-blue-500 hover:text-blue-600 bg-white transition">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function normalizeTransmission(raw?: string): TransmissionType {
  const s = (raw || '').toLowerCase();
  if (s.includes('cvt') || s.includes('continuously variable')) return 'cvt';
  if (s.includes('dual clutch') || s.includes('dct')) return 'dct';
  if (s.includes('manual')) return 'manual';
  return 'automatic';
}

function normalizeFuelType(raw?: string): FuelType {
  const s = (raw || '').toLowerCase();
  if (s.includes('plug') || s.includes('phev')) return 'plug_in_hybrid';
  if (s.includes('hybrid')) return 'hybrid';
  if (s.includes('electric') || s.includes('bev')) return 'electric';
  if (s.includes('diesel')) return 'diesel';
  return 'gasoline';
}

function SaveToInventoryForm({ result, vin }: { result: AgentResult; vin: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  const [imgEntries, setImgEntries] = useState<ImgEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const imgEntriesRef = useRef(imgEntries);
  imgEntriesRef.current = imgEntries;

  useEffect(() => {
    return () => { imgEntriesRef.current.forEach(e => URL.revokeObjectURL(e.preview)); };
  }, []);

  const [form, setForm] = useState({
    title: result.listing_title || '',
    make: result.make || '',
    model: result.model || '',
    year: result.year || new Date().getFullYear(),
    engine: result.engine || '',
    transmission: normalizeTransmission(result.transmission),
    fuel_type: normalizeFuelType(result.fuel_type),
    price: result.suggested_price ? String(result.suggested_price) : '',
    description: result.listing_description || '',
    mileage: 0,
    color: '',
    body_type: '',
    stock_number: '',
    drive: '',
    fuel_economy: '',
    featured: false,
    status: 'available' as VehicleStatus,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.price || Number(form.price) <= 0) { setSaveError('Price is required.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const vehicle = await api.adminCreateVehicle({
        title: form.title, make: form.make, model: form.model, year: form.year,
        mileage: form.mileage, price: form.price, transmission: form.transmission,
        fuel_type: form.fuel_type, vin,
        description: form.description || undefined, color: form.color || undefined,
        body_type: form.body_type || undefined, stock_number: form.stock_number || undefined,
        engine: form.engine || undefined, drive: form.drive || undefined,
        fuel_economy: form.fuel_economy || undefined, featured: form.featured, status: form.status,
      });
      setVehicleId(vehicle.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const handleImages = (files: File[]) => {
    setImgEntries(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), status: 'idle' as const }))]);
  };

  const removeImg = (i: number) => {
    setImgEntries(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
  };

  const uploadImages = async () => {
    if (!vehicleId || imgEntries.length === 0) { setAllDone(true); return; }
    setUploading(true);
    for (let i = 0; i < imgEntries.length; i++) {
      setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'uploading' } : e));
      try {
        await api.adminUploadImage(vehicleId, imgEntries[i].file);
        setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'done' } : e));
      } catch {
        setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'error' } : e));
      }
    }
    setUploading(false);
    setAllDone(true);
  };

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1.5">{label}</label>
      <input type={type} value={String(form[key as keyof typeof form])} placeholder={placeholder}
        onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-300" />
    </div>
  );

  const sel = (label: string, key: string, options: { value: string; label: string }[]) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1.5">{label}</label>
      <select value={String(form[key as keyof typeof form])} onChange={e => set(key, e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const doneCount = imgEntries.filter(e => e.status === 'done').length;

  // ── Phase 2: image upload ──────────────────────────────────────────────────
  if (vehicleId) {
    if (allDone) {
      return (
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center shrink-0">
            <Check size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-sm">Vehicle saved to inventory!</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {doneCount > 0 ? `${doneCount} photo${doneCount !== 1 ? 's' : ''} uploaded.` : 'No photos added.'} Manage it anytime under Vehicles.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center">
              <Check size={13} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Vehicle Created</p>
              <p className="text-xs text-gray-400">Now add photos to your listing</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Step 2 of 2</span>
        </div>
        <div className="px-6 pb-6 pt-4 space-y-4">
          <ImageDropZone onFiles={handleImages} />
          <ImageEntryGrid entries={imgEntries} onRemove={uploading ? () => {} : removeImg} />
          {uploading && (
            <p className="text-xs text-blue-600 font-medium">Uploading {doneCount} / {imgEntries.length} photos…</p>
          )}
          <button onClick={uploadImages} disabled={uploading}
            className="w-full py-2.5 bg-blue-600 text-gray-900 font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm">
            {uploading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
              : imgEntries.length > 0
                ? <><Upload size={14} /> Upload {imgEntries.length} Photo{imgEntries.length !== 1 ? 's' : ''}</>
                : <><Check size={14} /> Finish — Skip Photos</>
            }
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 1: vehicle details form ─────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Check size={14} className="text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">Save to Inventory</p>
            <p className="text-xs text-gray-400">Review details then add to your lot</p>
          </div>
        </div>
        <span className="text-gray-400 text-xs font-medium">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-5">
          {inp('Listing Title', 'title', 'text', '2023 BMW M3 Competition')}
          <div className="grid grid-cols-2 gap-4">
            {inp('Make', 'make')}
            {inp('Model', 'model')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Year', 'year', 'number')}
            {inp('Mileage *', 'mileage', 'number', '0')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Price ($) *</label>
              <input type="number" value={form.price} placeholder="38500"
                onChange={e => set('price', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition" />
            </div>
            {inp('Color', 'color', 'text', 'Mineral White')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sel('Transmission', 'transmission', [
              { value: 'automatic', label: 'Automatic' }, { value: 'manual', label: 'Manual' },
              { value: 'cvt', label: 'CVT' }, { value: 'dct', label: 'DCT' },
            ])}
            {sel('Fuel Type', 'fuel_type', [
              { value: 'gasoline', label: 'Gasoline' }, { value: 'diesel', label: 'Diesel' },
              { value: 'electric', label: 'Electric' }, { value: 'hybrid', label: 'Hybrid' },
              { value: 'plug_in_hybrid', label: 'Plug-in Hybrid' },
            ])}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Body Type', 'body_type', 'text', 'Sedan')}
            {inp('Drive', 'drive', 'text', 'AWD')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Engine', 'engine', 'text', '3.0L Turbo')}
            {inp('Fuel Economy', 'fuel_economy', 'text', '19/26 mpg')}
          </div>
          {inp('Stock Number', 'stock_number', 'text', 'STK-001')}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition resize-none" />
          </div>
          <div className="flex items-center gap-6 pt-1">
            {sel('Status', 'status', [
              { value: 'available', label: 'Available' }, { value: 'reserved', label: 'Reserved' },
              { value: 'sold', label: 'Sold' }, { value: 'pending', label: 'Pending' },
            ])}
            <label className="flex items-center gap-2 cursor-pointer select-none mt-5">
              <div onClick={() => set('featured', !form.featured)}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.featured ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.featured ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-gray-600">Featured</span>
            </label>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <X size={13} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-xs">{saveError}</p>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-gray-900 font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Check size={14} /> Save to Inventory</>
            }
          </button>
        </form>
      )}
    </div>
  );
}

const FEATURE_CATEGORIES: { label: string; features: string[] }[] = [
  {
    label: 'Safety',
    features: [
      'Blind Spot Monitoring', 'Lane Departure Warning', 'Adaptive Cruise Control',
      'Rear Cross Traffic Alert', 'Parking Sensors', 'Automatic Emergency Braking',
      'Collision Warning',
    ],
  },
  {
    label: 'Technology',
    features: [
      'Apple CarPlay', 'Android Auto', 'Bluetooth', 'Navigation',
      'Wireless Charging', 'Premium Audio', 'Heads-Up Display',
    ],
  },
  {
    label: 'Comfort',
    features: [
      'Heated Seats', 'Ventilated Seats', 'Leather Seats', 'Power Seats',
      'Heated Steering Wheel', 'Memory Seats', 'Dual Zone Climate Control',
    ],
  },
  {
    label: 'Exterior',
    features: [
      'Sunroof', 'Panoramic Roof', 'Tow Package', 'Running Boards',
      'Power Liftgate', 'Roof Rack',
    ],
  },
  {
    label: 'Performance',
    features: ['AWD', '4WD', 'Turbocharged Engine', 'Sport Package', 'Paddle Shifters'],
  },
];

const ALL_PREDEFINED = FEATURE_CATEGORIES.flatMap(c => c.features);

function AIAgentView() {
  const [wizardPhase, setWizardPhase] = useState<WizardPhase>('vin-input');
  const [vin, setVin] = useState('');
  const [userReview, setUserReview] = useState<UserReviewData>({
    mileage: 0, color: '', asking_price: '', condition: 'good', title_status: 'clean',
    body_type: '', drive: '', features: '', service_history: '',
    notes: '', stock_number: '', fuel_economy: '', featured: false, status: 'available',
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [listingEdit, setListingEdit] = useState<ListingEdit>({
    listing_title: '', listing_description: '', suggested_price: '', key_features: [], facebook_copy: '', ebay_listing_description: '',
  });
  const [phaseAResult, setPhaseAResult] = useState<AgentResult | null>(null);
  const [phaseCResult, setPhaseCResult] = useState<AgentResult | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureSearch, setFeatureSearch] = useState('');
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [imgEntries, setImgEntries] = useState<ImgEntry[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      imgEntries.forEach(e => URL.revokeObjectURL(e.preview));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setR = (k: keyof UserReviewData, v: unknown) => setUserReview(prev => ({ ...prev, [k]: v }));
  const setLE = (k: keyof ListingEdit, v: string) => setListingEdit(prev => ({ ...prev, [k]: v }));

  const resetWizard = () => {
    setWizardPhase('vin-input'); setVin(''); setError(''); setSaveError(''); setAdvancedOpen(false);
    setPhaseAResult(null); setPhaseCResult(null);
    setListingEdit({ listing_title: '', listing_description: '', suggested_price: '', key_features: [], facebook_copy: '', ebay_listing_description: '' });
    setSelectedFeatures([]); setFeatureSearch(''); setCustomFeatureInput('');
    imgEntries.forEach(e => URL.revokeObjectURL(e.preview));
    setImgEntries([]);
    setUserReview({ mileage: 0, color: '', asking_price: '', condition: 'good', title_status: 'clean',
      body_type: '', drive: '', features: '', service_history: '',
      notes: '', stock_number: '', fuel_economy: '', featured: false, status: 'available' });
  };

  const runPhaseA = async () => {
    const trimmedVin = vin.trim().toUpperCase();
    if (trimmedVin.length !== 17) { setError('VIN must be exactly 17 characters.'); return; }
    setError(''); setRunning(true);
    setWizardPhase('phase-a');
    try {
      const result = await api.fetchVehicleIntelligence(trimmedVin);
      if (!mountedRef.current) return;
      setPhaseAResult(result);
      setUserReview(prev => ({
        ...prev,
        body_type: result.body_style || prev.body_type,
        drive: result.drive_type || prev.drive,
      }));
      setWizardPhase('clarify');
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Phase A failed.');
    } finally {
      if (mountedRef.current) setRunning(false);
    }
  };

  const runPhaseB = async () => {
    if (!phaseAResult) return;
    setError(''); setRunning(true);
    setWizardPhase('phase-b');
    const phaseBreq: PhaseBRequest = {
      vin: vin.trim().toUpperCase(),
      make: phaseAResult.make, model: phaseAResult.model, year: phaseAResult.year,
      trim: phaseAResult.trim, engine: phaseAResult.engine, fuel_type: phaseAResult.fuel_type,
      transmission: phaseAResult.transmission, body_style: phaseAResult.body_style,
      drive_type: phaseAResult.drive_type, market_price_range: phaseAResult.market_price_range,
      selling_points: phaseAResult.selling_points, market_insights: phaseAResult.market_insights,
      mileage: userReview.mileage || undefined,
      asking_price: userReview.asking_price ? parseFloat(userReview.asking_price) : undefined,
      condition: userReview.condition || undefined, title_status: userReview.title_status || undefined,
      features: userReview.features ? userReview.features.split(',').map(f => f.trim()).filter(Boolean) : undefined,
      service_history: userReview.service_history || undefined, notes: userReview.notes || undefined,
    };
    try {
      const result = await api.fetchGenerateListing(phaseBreq);
      if (!mountedRef.current) return;
      const aiFeatures = result.key_features || [];
      setListingEdit({
        listing_title: result.listing_title || '',
        listing_description: result.listing_description || '',
        suggested_price: result.suggested_price ? String(Math.round(result.suggested_price)) : '',
        key_features: aiFeatures,
        facebook_copy: result.facebook_copy || '',
        ebay_listing_description: result.ebay_listing_description || '',
      });
      setSelectedFeatures(aiFeatures);
      setWizardPhase('features');
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Phase B failed.');
    } finally {
      if (mountedRef.current) setRunning(false);
    }
  };

  // One-click: save → upload images → distribute
  const approveAndPublish = async () => {
    setError(''); setSaveError(''); setRunning(true);
    let vehicleCreated = false;
    try {
      const priceStr = listingEdit.suggested_price;
      const priceNum = parseFloat(priceStr);
      if (!priceStr || isNaN(priceNum) || priceNum <= 0) {
        throw new Error('A valid asking price is required before publishing.');
      }

      const vehicle = await api.adminCreateVehicle({
        title: listingEdit.listing_title || [phaseAResult?.year, phaseAResult?.make, phaseAResult?.model].filter(Boolean).join(' '),
        make: phaseAResult?.make || '',
        model: phaseAResult?.model || '',
        year: phaseAResult?.year || new Date().getFullYear(),
        mileage: userReview.mileage || 0,
        price: priceStr,
        transmission: normalizeTransmission(phaseAResult?.transmission),
        fuel_type: normalizeFuelType(phaseAResult?.fuel_type),
        vin: vin.trim().toUpperCase(),
        description: listingEdit.listing_description || undefined,
        color: userReview.color || undefined,
        body_type: userReview.body_type || phaseAResult?.body_style || undefined,
        stock_number: userReview.stock_number || undefined,
        engine: phaseAResult?.engine || undefined,
        drive: userReview.drive || phaseAResult?.drive_type || undefined,
        fuel_economy: userReview.fuel_economy || undefined,
        features: selectedFeatures.length ? selectedFeatures : undefined,
        featured: userReview.featured,
        status: userReview.status,
      });
      vehicleCreated = true;
      const vid = vehicle.id;

      for (let i = 0; i < imgEntries.length; i++) {
        setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'uploading' } : e));
        try {
          await api.adminUploadImage(vid, imgEntries[i].file);
          setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'done' } : e));
        } catch {
          setImgEntries(prev => prev.map((e, idx) => idx === i ? { ...e, status: 'error' } : e));
        }
      }

      setWizardPhase('phase-c');
      const phaseCReq: PhaseCRequest = {
        vehicle_id: vid,
        vin: vin.trim().toUpperCase(),
        make: phaseAResult?.make,
        model: phaseAResult?.model,
        year: phaseAResult?.year,
        listing_title: listingEdit.listing_title,
        listing_description: listingEdit.listing_description,
        facebook_copy: listingEdit.facebook_copy,
        ebay_listing_description: listingEdit.ebay_listing_description,
        suggested_price: priceNum,
      };
      const distResult = await api.fetchDistribute(phaseCReq);
      if (mountedRef.current) setPhaseCResult(distResult);
    } catch (err) {
      if (mountedRef.current) setSaveError(err instanceof Error ? err.message : 'Failed to publish.');
    } finally {
      if (mountedRef.current) {
        setRunning(false);
        // Only transition to complete if the vehicle was actually saved.
        // If creation failed, stay on 'review' so saveError is visible.
        if (vehicleCreated) setWizardPhase('complete');
      }
    }
  };

  const WIZARD_LABELS = ['VIN Scan', 'Details', 'Generate', 'Features', 'Review', 'Publish'];
  const phaseIndex = ({
    'vin-input': 0, 'phase-a': 0, 'clarify': 1, 'phase-b': 2, 'features': 3, 'review': 4, 'phase-c': 5, 'complete': 6,
  } as Record<WizardPhase, number>)[wizardPhase] ?? 0;

  return (
    <div className="max-w-2xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">AI Sales Agent</h1>
          <p className="text-sm text-gray-400 mt-0.5">VIN → 2 questions → complete listing.</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {['NHTSA', 'DuckDuckGo', 'GPT-4o', 'eBay', 'Facebook'].map(tag => (
            <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-100">{tag}</span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
        <div className="flex items-center">
          {WIZARD_LABELS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < phaseIndex ? 'bg-emerald-500 text-white' :
                  i === phaseIndex ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < phaseIndex ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${i <= phaseIndex ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < WIZARD_LABELS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-3.5 transition-all ${i < phaseIndex ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <X size={14} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm flex-1">{error}</p>
          {wizardPhase !== 'vin-input' && (
            <button onClick={resetWizard} className="text-xs text-red-400 underline shrink-0">Start over</button>
          )}
        </div>
      )}

      {/* ─── STEP 1: VIN input ─────────────────────────────────────────────── */}
      {wizardPhase === 'vin-input' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Vehicle Identification Number</label>
              <span className={`text-xs font-bold tabular-nums ${vin.length === 17 ? 'text-emerald-500' : 'text-gray-400'}`}>{vin.length} / 17</span>
            </div>
            <input value={vin} onChange={e => { setVin(e.target.value.toUpperCase()); setError(''); }} maxLength={17}
              placeholder="e.g. 1HGCM82633A004352"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-mono placeholder-gray-300 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition" />
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${vin.length === 17 ? 'bg-emerald-400' : 'bg-blue-600'}`}
                style={{ width: `${Math.round((vin.length / 17) * 100)}%` }} />
            </div>
          </div>
          <button onClick={runPhaseA} disabled={vin.trim().length !== 17}
            className="w-full py-3.5 bg-blue-600 text-gray-900 font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2">
            <Sparkles size={15} /> Analyze Vehicle
          </button>
        </div>
      )}

      {/* ─── AI running (Phase A) ───────────────────────────────────────────── */}
      {wizardPhase === 'phase-a' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">AI Agent Working…</p>
              <p className="text-xs text-gray-400">Decoding VIN and researching the market</p>
            </div>
          </div>
          <div className="px-6 py-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* ─── STEP 2: AI clarification — just 2 questions ───────────────────── */}
      {wizardPhase === 'clarify' && phaseAResult && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Vehicle found banner */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-bold text-base">
                  Found: {[phaseAResult.year, phaseAResult.make, phaseAResult.model, phaseAResult.trim].filter(Boolean).join(' ')}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[phaseAResult.engine, phaseAResult.fuel_type, phaseAResult.transmission, phaseAResult.body_style].filter(Boolean).map(v => (
                    <span key={v} className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] font-medium text-gray-600">{v}</span>
                  ))}
                </div>
                {phaseAResult.market_price_range && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Market value: <span className="font-bold text-blue-600">{phaseAResult.market_price_range}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* The ask */}
          <div className="px-6 pt-5 pb-1">
            <p className="text-sm text-gray-500">To generate an accurate listing, I need <strong className="text-gray-800">two things</strong>:</p>
          </div>

          <div className="px-6 pb-5 space-y-3">
            {/* Required: mileage */}
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
              <div className="flex-1 relative">
                <input type="number" min={0} value={userReview.mileage || ''}
                  onChange={e => setR('mileage', Number(e.target.value))}
                  placeholder="Mileage"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-400 pr-14" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">miles</span>
              </div>
            </div>

            {/* Required: color */}
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
              <input value={userReview.color} onChange={e => setR('color', e.target.value)}
                placeholder="Exterior color  (e.g. Pearl White)"
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-400" />
            </div>

            {/* Optional advanced */}
            <div className="pt-1">
              <button onClick={() => setAdvancedOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition py-1 select-none">
                <span className={`inline-block transition-transform duration-150 ${advancedOpen ? 'rotate-90' : ''}`}>▶</span>
                Advanced details — condition, features, notes
                <span className="text-gray-300 ml-0.5">(optional, improves listing)</span>
              </button>

              {advancedOpen && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Asking Price ($)</label>
                      <input type="number" value={userReview.asking_price} onChange={e => setR('asking_price', e.target.value)}
                        placeholder="AI will suggest"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition placeholder-gray-300" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Condition</label>
                      <select value={userReview.condition} onChange={e => setR('condition', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition">
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Title Status</label>
                    <select value={userReview.title_status} onChange={e => setR('title_status', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition">
                      <option value="clean">Clean Title</option>
                      <option value="rebuilt">Rebuilt / Reconstructed</option>
                      <option value="salvage">Salvage Title</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Features <span className="font-normal text-gray-400">(comma-separated)</span></label>
                    <input value={userReview.features} onChange={e => setR('features', e.target.value)}
                      placeholder="Heated seats, Sunroof, Apple CarPlay, Lane Assist"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition placeholder-gray-300" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Service History</label>
                    <input value={userReview.service_history} onChange={e => setR('service_history', e.target.value)}
                      placeholder="e.g. Regular oil changes, dealer maintained"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition placeholder-gray-300" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Notes for AI</label>
                    <textarea value={userReview.notes} onChange={e => setR('notes', e.target.value)} rows={2}
                      placeholder="Extras, modifications, known issues…"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition resize-none placeholder-gray-300" />
                  </div>
                </div>
              )}
            </div>

            <button onClick={runPhaseB} disabled={running || !userReview.mileage}
              className="w-full py-3.5 bg-blue-600 text-gray-900 font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2 mt-2">
              {running
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                : <><Sparkles size={15} /> Generate Listing</>}
            </button>
          </div>
        </div>
      )}

      {/* ─── AI running (Phase B) ───────────────────────────────────────────── */}
      {wizardPhase === 'phase-b' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Writing Your Listing…</p>
              <p className="text-xs text-gray-400">Generating title, description, price, and marketplace copies</p>
            </div>
          </div>
          <div className="px-6 py-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* ─── STEP 3: Feature Selection ──────────────────────────────────────── */}
      {wizardPhase === 'features' && (() => {
        const query = featureSearch.toLowerCase();
        const toggleFeature = (f: string) =>
          setSelectedFeatures(prev =>
            prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
          );
        const addCustom = () => {
          const val = customFeatureInput.trim();
          if (val && !selectedFeatures.includes(val)) {
            setSelectedFeatures(prev => [...prev, val]);
          }
          setCustomFeatureInput('');
        };
        const aiSuggestions = listingEdit.key_features;

        return (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-base font-black text-gray-900">Vehicle Features</p>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {selectedFeatures.length} selected
                </span>
              </div>
              <p className="text-xs text-gray-400">Select all that apply. AI suggestions are pre-checked — adjust as needed.</p>

              {/* Search */}
              <div className="relative mt-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  value={featureSearch}
                  onChange={e => setFeatureSearch(e.target.value)}
                  placeholder="Search features…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-300"
                />
              </div>
            </div>

            {/* AI Suggested */}
            {aiSuggestions.length > 0 && !featureSearch && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">AI Suggested Features</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map(f => {
                    const checked = selectedFeatures.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => toggleFeature(f)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          checked
                            ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300'
                        }`}
                      >
                        {checked && <Check size={11} />}
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category groups */}
            {FEATURE_CATEGORIES.map(cat => {
              const visible = cat.features.filter(f =>
                !query || f.toLowerCase().includes(query)
              );
              if (visible.length === 0) return null;
              return (
                <div key={cat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{cat.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {visible.map(f => {
                      const checked = selectedFeatures.includes(f);
                      return (
                        <button
                          key={f}
                          onClick={() => toggleFeature(f)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            checked
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          {checked && <Check size={11} />}
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Custom feature */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Custom Feature</p>
              <div className="flex gap-2">
                <input
                  value={customFeatureInput}
                  onChange={e => setCustomFeatureInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { addCustom(); e.preventDefault(); } }}
                  placeholder="e.g. Third Row Seating, Cooled Cup Holders…"
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-300"
                />
                <button
                  onClick={addCustom}
                  disabled={!customFeatureInput.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition shrink-0"
                >
                  + Add
                </button>
              </div>
              {/* Custom / non-predefined selected features */}
              {selectedFeatures.filter(f => !ALL_PREDEFINED.includes(f)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                  {selectedFeatures.filter(f => !ALL_PREDEFINED.includes(f)).map(f => (
                    <span key={f} className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 border border-blue-500 text-white rounded-full text-sm font-medium">
                      {f}
                      <button onClick={() => setSelectedFeatures(prev => prev.filter(x => x !== f))} className="hover:opacity-70 transition leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Continue */}
            <button
              onClick={() => setWizardPhase('review')}
              className="w-full py-4 bg-blue-600 text-white font-black text-base rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5"
            >
              <Check size={18} /> Continue with {selectedFeatures.length} Feature{selectedFeatures.length !== 1 ? 's' : ''}
            </button>
          </div>
        );
      })()}

      {/* ─── STEP 4: Review & edit generated listing ────────────────────────── */}
      {wizardPhase === 'review' && (
        <div className="space-y-4">

          {/* Main listing document — inline editable */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Generated Listing</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click any field to edit before publishing</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Check size={10} /> Ready
              </span>
            </div>

            {/* Price */}
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Asking Price</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl text-gray-300 font-medium select-none">$</span>
                <input type="number" value={listingEdit.suggested_price} onChange={e => setLE('suggested_price', e.target.value)}
                  placeholder="0"
                  className="text-4xl font-black text-blue-600 bg-transparent border-none outline-none w-full hover:bg-gray-50 focus:bg-gray-50 rounded-xl px-2 -mx-2 py-1 transition-all" />
              </div>
            </div>

            {/* Title */}
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Listing Title</p>
              <input value={listingEdit.listing_title} onChange={e => setLE('listing_title', e.target.value)}
                className="w-full text-gray-900 font-bold text-base bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-gray-50 rounded-xl px-2 -mx-2 py-1 transition-all" />
            </div>

            {/* Description */}
            <div className="px-6 py-5 border-b border-gray-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
              <textarea value={listingEdit.listing_description} onChange={e => setLE('listing_description', e.target.value)} rows={7}
                className="w-full text-gray-600 text-sm leading-relaxed bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-gray-50 rounded-xl px-2 -mx-2 py-1 transition-all resize-none" />
            </div>

            {/* Features */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Features</p>
                <button
                  onClick={() => setWizardPhase('features')}
                  className="text-[10px] text-blue-600 hover:underline font-semibold transition"
                >
                  Edit features
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedFeatures.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                    {f}
                    <button
                      onClick={() => setSelectedFeatures(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 transition leading-none">×</button>
                  </span>
                ))}
                {selectedFeatures.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No features selected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Facebook copy */}
          {listingEdit.facebook_copy && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Facebook Marketplace</p>
                <CopyButton text={listingEdit.facebook_copy} label="Copy" />
              </div>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4 max-h-48 overflow-auto leading-relaxed">{listingEdit.facebook_copy}</pre>
            </div>
          )}

          {/* eBay copy */}
          {listingEdit.ebay_listing_description && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">eBay Listing</p>
                <CopyButton text={listingEdit.ebay_listing_description} label="Copy" />
              </div>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4 max-h-48 overflow-auto leading-relaxed">{listingEdit.ebay_listing_description}</pre>
            </div>
          )}

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Photos <span className="font-normal text-gray-300 normal-case tracking-normal">(optional)</span>
            </p>
            <ImageDropZone onFiles={files => setImgEntries(prev => [
              ...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), status: 'idle' as const }))
            ])} />
            {imgEntries.length > 0 && (
              <div className="mt-3">
                <ImageEntryGrid entries={imgEntries} onRemove={i => setImgEntries(prev => {
                  URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i);
                })} />
              </div>
            )}
          </div>

          {/* Inventory settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inventory Settings</p>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Status</label>
                <select value={userReview.status} onChange={e => setR('status', e.target.value as VehicleStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition">
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Stock #</label>
                <input value={userReview.stock_number} onChange={e => setR('stock_number', e.target.value)} placeholder="STK-001"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition placeholder-gray-300" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none pb-0.5 shrink-0">
                <div onClick={() => setR('featured', !userReview.featured)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${userReview.featured ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${userReview.featured ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-gray-600">Featured</span>
              </label>
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <X size={13} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{saveError}</p>
            </div>
          )}

          {/* One-click CTA */}
          <button onClick={approveAndPublish} disabled={running || !listingEdit.suggested_price}
            className="w-full py-4 bg-blue-600 text-white font-black text-base rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5">
            {running
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving &amp; Publishing…</>
              : <><Bot size={18} /> Approve &amp; Publish</>}
          </button>
          <p className="text-center text-xs text-gray-400 -mt-2">Saves to inventory, uploads photos, and publishes to all platforms.</p>
        </div>
      )}

      {/* ─── Publishing (Phase C) ───────────────────────────────────────────── */}
      {wizardPhase === 'phase-c' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Publishing…</p>
              <p className="text-xs text-gray-400">Distributing to eBay, Facebook, and website inventory</p>
            </div>
          </div>
          <div className="px-6 py-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* ─── Complete ───────────────────────────────────────────────────────── */}
      {wizardPhase === 'complete' && (
        <div className="space-y-4">
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center shrink-0">
                <Check size={22} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-900 font-black text-lg">Listing Published!</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  {[phaseAResult?.year, phaseAResult?.make, phaseAResult?.model].filter(Boolean).join(' ')} is now live.
                </p>
              </div>
            </div>
            {phaseCResult?.distribution_status && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                {Object.entries(phaseCResult.distribution_status).map(([platform, status]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{platform}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      ['success','mock','published','live','ready'].some(k => status.includes(k))
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>{status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
            {phaseCResult?.ebay_listing_id && (
              <p className="text-xs text-gray-400 font-mono border-t border-gray-100 pt-3">eBay ID: {phaseCResult.ebay_listing_id}</p>
            )}
          </div>
          <button onClick={resetWizard}
            className="w-full py-3 bg-white text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 border border-gray-200 transition-all flex items-center justify-center gap-2">
            <Sparkles size={15} /> Process Another Vehicle
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main admin page ────────────────────────────────────────────────────────────
type AdminState = 'checking' | 'setup' | 'login' | 'panel';

function renderView(view: AdminView, setView: (v: AdminView) => void) {
  switch (view) {
    case 'dashboard':    return <DashboardView />;
    case 'cars':         return <VehiclesView />;
    case 'add-car':      return <AddVehicleView onCreated={() => setView('cars')} />;
    case 'financing':    return <FinancingView />;
    case 'tradeins':     return <TradeInsView />;
    case 'appointments': return <AppointmentsView />;
    case 'reviews':      return <ReviewsView />;
    case 'contact':      return <ContactView />;
    case 'reports':      return <div className="text-gray-500">Reports coming soon.</div>;
    case 'settings':     return <div className="text-gray-500">Settings coming soon.</div>;
    case 'ai-agent':     return <AIAgentView />;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<AdminState>('checking');
  const [view, setView] = useState<AdminView>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') === 'true') {
      setState('panel');
      return;
    }
    api.getAdminStatus()
      .then(({ configured }) => setState(configured ? 'login' : 'setup'))
      .catch(() => setState('login'));
  }, []);

  const handleExit = () => {
    localStorage.removeItem('adminAuthenticated');
    router.push('/');
  };

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'setup') return <AdminSetup onCreated={() => setState('login')} />;
  if (state === 'login') return <AdminLogin onLoggedIn={() => setState('panel')} />;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-jakarta">
      <AdminSidebar
        activeView={view}
        onViewChange={setView}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-end px-6 py-3.5 border-b border-gray-100 bg-white">
          <button onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-500 transition font-jakarta">
            <LogOut size={12} /> Exit Admin
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto font-jakarta">
          {renderView(view, setView)}
        </main>
      </div>
    </div>
  );
}
