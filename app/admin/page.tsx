'use client';

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar, { type AdminView } from '@/components/AdminSidebar';
import * as api from '@/lib/api';
import type {
  DashboardStats, Vehicle, VehicleListItem, FinancingRequest, Review, TradeIn, ServiceAppointment,
  FinancingStatus, ReviewStatus, TransmissionType, FuelType, VehicleStatus,
} from '@/lib/types';
import { Trash2, LogOut, Check, X, Eye, EyeOff, Upload, ChevronLeft, Pencil, Phone } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <p className="text-[10px] uppercase tracking-[3px] text-slate-600 text-center">Create Admin Password</p>
        <div className="relative">
          <input autoFocus type={showPw ? 'text' : 'password'} value={pw}
            onChange={e => setPw(e.target.value)} placeholder="Password"
            className="w-full px-4 py-3 pr-10 bg-[#111] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#C9A84C]/50 transition" />
          <button type="button" onClick={() => setShowPw(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <div className="relative">
          <input type={showConfirm ? 'text' : 'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="Confirm Password"
            className="w-full px-4 py-3 pr-10 bg-[#111] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#C9A84C]/50 transition" />
          <button type="button" onClick={() => setShowConfirm(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition">
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#C9A84C] text-black font-black uppercase tracking-wide text-xs rounded-xl hover:bg-[#D4B96A] disabled:opacity-60 transition">
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
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <form onSubmit={submit}
        className={`w-full max-w-xs space-y-4 ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        <p className="text-[10px] uppercase tracking-[3px] text-slate-600 text-center">Admin Password</p>
        <div className="relative">
          <input autoFocus type={show ? 'text' : 'password'} value={pw}
            onChange={e => setPw(e.target.value)} placeholder="Password"
            className="w-full px-4 py-3 pr-10 bg-[#111] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#C9A84C]/50 transition" />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#C9A84C] text-black font-black uppercase tracking-wide text-xs rounded-xl hover:bg-[#D4B96A] disabled:opacity-60 transition">
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
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
        dragging ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/10 hover:border-white/20'
      } ${className}`}
    >
      <Upload size={22} className="text-slate-500 pointer-events-none" />
      <div className="text-center pointer-events-none">
        <p className="text-sm text-slate-400">Drag and drop images here</p>
        <p className="text-xs text-slate-600 mt-1">or</p>
      </div>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
        className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide border border-slate-600 text-slate-300 rounded-lg hover:border-[#C9A84C] hover:text-[#C9A84C] transition"
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
        <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 group">
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
    <div className="bg-[#111] border border-[#C9A84C]/10 rounded-xl p-5">
      <p className="text-xs uppercase tracking-[2px] text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#C9A84C]">{sub}</p>}
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
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${map[status] ?? 'bg-slate-700 text-slate-300'}`}>
      {status.replace('_', ' ')}
    </span>
  );
});

// ── Dashboard skeleton ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div>
      <div className="h-8 w-44 bg-slate-800 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#C9A84C]/10 rounded-xl p-5">
            <div className="h-2.5 w-24 bg-slate-800 rounded animate-pulse mb-3" />
            <div className="h-8 w-14 bg-slate-800 rounded animate-pulse mb-2" />
            <div className="h-2.5 w-32 bg-slate-700 rounded animate-pulse" />
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
  if (error || !stats) return <p className="text-slate-400">Failed to load stats.</p>;

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Dashboard</h1>
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
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
          <ChevronLeft size={14} /> Back
        </button>
        <h1 className="text-xl font-black text-white">{vehicle.title} — Images</h1>
        {reordering && <span className="text-xs text-[#C9A84C]">Saving order…</span>}
      </div>

      {/* Existing images — draggable to reorder */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] uppercase tracking-[2px] text-slate-500">
            Current Images{images.length > 0 ? ` (${images.length})` : ''}
          </p>
          {images.length > 1 && (
            <p className="text-[10px] text-slate-600">drag to reorder</p>
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
                className={`relative aspect-video rounded-xl overflow-hidden bg-slate-800 group cursor-grab active:cursor-grabbing transition-all ${
                  dragIdx === i ? 'opacity-40 scale-95' : ''
                } ${
                  dragOverIdx === i && dragIdx !== i
                    ? 'ring-2 ring-[#C9A84C] scale-[1.03]'
                    : ''
                }`}
              >
                <img src={api.getImageUrl(url)} alt="" className="w-full h-full object-cover pointer-events-none" />
                {/* first image badge */}
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#C9A84C] text-black text-[9px] font-black uppercase rounded">
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
          <p className="text-slate-500 text-sm">No images yet.</p>
        )}
      </div>

      {/* Add more */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[2px] text-slate-500 mb-3">Add More Images</p>
        <ImageDropZone onFiles={handleNewFiles} />
        <ImageEntryGrid entries={pending} onRemove={removeEntry} />
      </div>

      {/* Upload controls */}
      {pending.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={uploadAll}
            disabled={uploading || idleCount === 0}
            className="px-5 py-2.5 bg-[#C9A84C] text-black font-black uppercase tracking-wide text-xs rounded-xl hover:bg-[#D4B96A] disabled:opacity-50 transition"
          >
            {uploading
              ? `Uploading ${doneCount} / ${pending.length}…`
              : `Upload ${idleCount} Image${idleCount !== 1 ? 's' : ''}`}
          </button>
          {allDone && <span className="text-xs text-emerald-400">All uploaded!</span>}
        </div>
      )}

      <button onClick={onDone}
        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wide border border-slate-700 text-slate-400 rounded-xl hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
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

  const [form, setForm] = useState({
    title: '', make: '', model: '', year: new Date().getFullYear(),
    mileage: 0, price: '', price_on_call: false,
    transmission: 'automatic' as TransmissionType,
    fuel_type: 'gasoline' as FuelType,
    vin: '', description: '', color: '', body_type: '',
    featured: false, status: 'available' as VehicleStatus,
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
      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        placeholder={placeholder}
        onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C] transition"
      />
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
          <div className="h-7 w-56 bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="bg-[#111] border border-white/[0.06] rounded-xl p-6 max-w-2xl space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <div className="h-2.5 w-20 bg-slate-800 rounded animate-pulse mb-1.5" />
              <div className="h-10 bg-slate-800/80 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.06 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onDone} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
          <ChevronLeft size={14} /> Back
        </button>
        <h1 className="text-xl font-black text-white">Edit Vehicle</h1>
      </div>

      <form onSubmit={save} className="bg-[#111] border border-white/[0.06] rounded-xl p-6 max-w-2xl space-y-5">

        {/* Core identity */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-slate-600 mb-3">Identity</p>
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

        <div className="border-t border-white/[0.04]" />

        {/* Specs */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-slate-600 mb-3">Specs</p>
          <div className="grid grid-cols-2 gap-4">
            {field('Mileage', 'mileage', 'number')}
            {field('Color', 'color', 'text', 'Midnight Black')}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {field('Body Type', 'body_type', 'text', 'Sedan')}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Transmission</label>
              <select value={form.transmission} onChange={e => set('transmission', e.target.value as TransmissionType)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C]">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
                <option value="dct">Dual-Clutch</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Fuel Type</label>
            <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value as FuelType)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C]">
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="plug_in_hybrid">Plug-In Hybrid</option>
            </select>
          </div>
        </div>

        <div className="border-t border-white/[0.04]" />

        {/* Pricing */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-slate-600 mb-3">Pricing</p>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              {field('Price ($)', 'price', 'text', '89500.00')}
            </div>
            <label className={`flex items-center gap-2.5 shrink-0 mb-0.5 px-4 py-2.5 rounded-xl border cursor-pointer transition select-none ${
              form.price_on_call
                ? 'border-[#C9A84C]/60 bg-[#C9A84C]/8 text-[#C9A84C]'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
            }`}>
              <input type="checkbox" checked={form.price_on_call}
                onChange={e => set('price_on_call', e.target.checked)} className="hidden" />
              <Phone size={13} />
              <span className="text-xs font-bold uppercase tracking-wide">Call for Price</span>
            </label>
          </div>
          {form.price_on_call && (
            <p className="mt-2 text-[11px] text-[#C9A84C]/70">
              Price is saved internally but customers will see &quot;Call for Price&quot; instead.
            </p>
          )}
        </div>

        <div className="border-t border-white/[0.04]" />

        {/* Availability */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-slate-600 mb-3">Availability</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as VehicleStatus)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C]">
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <label className={`flex items-center gap-2.5 shrink-0 mt-5 px-4 py-2.5 rounded-xl border cursor-pointer transition select-none ${
              form.featured
                ? 'border-[#C9A84C]/60 bg-[#C9A84C]/8 text-[#C9A84C]'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
            }`}>
              <input type="checkbox" checked={form.featured}
                onChange={e => set('featured', e.target.checked)} className="hidden" />
              <span className="text-xs font-bold uppercase tracking-wide">Featured</span>
            </label>
          </div>
        </div>

        <div className="border-t border-white/[0.04]" />

        {/* Description */}
        <div>
          <p className="text-[9px] uppercase tracking-[3px] text-slate-600 mb-3">Description</p>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            placeholder="Optional description shown to customers on the vehicle detail page…"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C] resize-none placeholder-slate-600"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {saved && <p className="text-emerald-400 text-sm">Saved! Returning to list…</p>}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving || saved}
            className="px-6 py-2.5 bg-[#C9A84C] text-black font-black uppercase tracking-wide text-xs rounded-xl hover:bg-[#D4B96A] disabled:opacity-60 transition">
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button type="button" onClick={onDone}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wide border border-slate-700 text-slate-400 rounded-xl hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
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
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center gap-6 px-5 py-3 border-b border-white/[0.06]">
        {[120, 48, 72, 64, 56, 32].map((w, i) => (
          <div key={i} className="h-2.5 bg-slate-800 rounded animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            <div className="h-4 flex-1 bg-slate-800/80 rounded animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
            <div className="h-4 w-12 bg-slate-800/60 rounded animate-pulse" />
            <div className="h-4 w-20 bg-slate-800/60 rounded animate-pulse" />
            <div className="h-5 w-16 bg-slate-800/60 rounded-full animate-pulse" />
            <div className="h-4 w-14 bg-slate-800/60 rounded animate-pulse" />
            <div className="h-4 w-10 bg-slate-800/40 rounded animate-pulse" />
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
          <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Vehicles</h1>
      </div>
      <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[2px] text-slate-500">
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Year</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Images</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 text-white font-medium">{v.title}</td>
                <td className="px-5 py-3 text-slate-400">{v.year}</td>
                <td className="px-5 py-3">
                  {v.price_on_call ? (
                    <span className="flex items-center gap-1 text-[#C9A84C]/70 text-xs font-bold">
                      <Phone size={11} /> Call
                    </span>
                  ) : (
                    <span className="text-[#C9A84C] font-bold">${parseFloat(v.price).toLocaleString()}</span>
                  )}
                </td>
                <td className="px-5 py-3"><Badge status={v.status} /></td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setEditingVehicle(v)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#C9A84C] transition"
                  >
                    <span className="text-slate-600">{v.images.length}</span>
                    <span className="underline underline-offset-2">Images</span>
                  </button>
                </td>
                <td className="px-5 py-3 flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => setEditingDetailsId(v.id)}
                    title="Edit vehicle details"
                    className="p-1.5 rounded hover:bg-[#C9A84C]/10 text-slate-500 hover:text-[#C9A84C] transition">
                    <Pencil size={14} />
                  </button>
                  <Link href={`/inventory/${v.id}`} target="_blank"
                    className="text-xs text-slate-400 hover:text-white transition px-1">View</Link>
                  <button onClick={() => del(v.id)} disabled={deleting === v.id}
                    className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition">
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
  });
  const [imgEntries, setImgEntries] = useState<ImgEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'creating' | 'uploading' | 'done'>('idle');
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPhase('creating');

    let vehicleId: string;
    try {
      const vehicle = await api.adminCreateVehicle({ ...form, price: form.price });
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
    });
    imgEntriesRef.current.forEach(e => URL.revokeObjectURL(e.preview));
    setImgEntries([]);

    // Switch to vehicles view after short delay so user sees done state
    setTimeout(onCreated, 1200);
  };

  const input = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">{label}</label>
      <input type={type} value={String(form[key as keyof typeof form])} placeholder={placeholder}
        onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C] transition" />
    </div>
  );

  const doneCount = imgEntries.filter(e => e.status === 'done').length;

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Add Vehicle</h1>
      <form onSubmit={submit} className="bg-[#111] border border-white/[0.06] rounded-xl p-6 max-w-2xl space-y-4">
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
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Price ($)</label>
          <div className="flex gap-3 items-center">
            <input type="text" value={form.price} placeholder="89500.00"
              onChange={e => set('price', e.target.value)}
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C] transition" />
            <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition select-none whitespace-nowrap ${
              form.price_on_call
                ? 'border-[#C9A84C]/60 bg-[#C9A84C]/8 text-[#C9A84C]'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
            }`}>
              <input type="checkbox" checked={form.price_on_call}
                onChange={e => set('price_on_call', e.target.checked)} className="hidden" />
              <Phone size={12} />
              <span className="text-xs font-bold uppercase tracking-wide">Call for Price</span>
            </label>
          </div>
          {form.price_on_call && (
            <p className="mt-1.5 text-[11px] text-[#C9A84C]/70">Price stored internally; customers see &quot;Call for Price&quot;.</p>
          )}
        </div>
        {input('VIN (17 chars)', 'vin', 'text', 'WBS8M9C52P5A00001')}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Transmission</label>
            <select value={form.transmission} onChange={e => set('transmission', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C]">
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
              <option value="cvt">CVT</option>
              <option value="dct">Dual-Clutch</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Fuel Type</label>
            <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C]">
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
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C] resize-none" />
        </div>

        {/* ── Image upload section ─────────────────────────────────────── */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Vehicle Images</label>
          <ImageDropZone onFiles={handleImages} />
          <ImageEntryGrid entries={imgEntries} onRemove={removeImg} />
          {uploading && (
            <p className="text-xs text-[#C9A84C] mt-2">
              Uploading {doneCount} / {imgEntries.length} images…
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)}
              className="w-4 h-4 accent-[#C9A84C]" />
            <span className="text-sm text-slate-300">Featured</span>
          </label>
          <div className="flex-1" />
          <div>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C9A84C]">
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
          className="w-full py-3 bg-[#C9A84C] text-black font-black uppercase tracking-wide text-sm rounded-xl hover:bg-[#D4B96A] disabled:opacity-60 transition">
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
      <div className="h-8 w-52 bg-slate-800 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Financing Requests</h1>
      <div className="space-y-3">
        {items.map(req => (
          <div key={req.id} className="bg-[#111] border border-white/[0.06] rounded-xl p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Badge status={req.status} />
                <span className="text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-white font-bold text-sm truncate">{req.phone} · {req.address}</p>
              <p className="text-slate-400 text-xs mt-1">
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
        {items.length === 0 && <p className="text-slate-400 text-sm">No financing requests.</p>}
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
      <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Reviews</h1>
      <div className="space-y-3">
        {items.map(r => (
          <div key={r.id} className="bg-[#111] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge status={r.status} />
                  <span className="text-amber-400 text-xs font-bold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-white font-bold text-sm">{r.title}</p>
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{r.body}</p>
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
                  className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition disabled:opacity-50">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-400 text-sm">No reviews.</p>}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}

// ── Card skeleton (for list views) ────────────────────────────────────────────
function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#111] border border-white/[0.06] rounded-xl p-5" style={{ opacity: 1 - i * 0.12 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 w-16 bg-slate-800 rounded-full animate-pulse" />
            <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse mb-2" />
          <div className="h-3 w-1/2 bg-slate-700 rounded animate-pulse" />
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
      <div className="h-8 w-36 bg-slate-800 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );
  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Trade-Ins</h1>
      <div className="space-y-3">
        {items.map(t => (
          <div key={t.id} className="bg-[#111] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Badge status={t.status} />
              <span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-white font-bold">{t.year} {t.make} {t.model} · {t.mileage.toLocaleString()} mi</p>
            <p className="text-slate-400 text-xs mt-1">
              Condition: {t.condition} · Accident: {t.accident_history ? 'Yes' : 'No'}
              {t.asking_price && ` · Asking: $${parseFloat(t.asking_price).toLocaleString()}`}
            </p>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-400 text-sm">No trade-ins.</p>}
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
      <div className="h-8 w-44 bg-slate-800 rounded-lg animate-pulse mb-6" />
      <CardListSkeleton count={5} />
    </div>
  );
  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Appointments</h1>
      <div className="space-y-3">
        {items.map(a => (
          <div key={a.id} className="bg-[#111] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <Badge status={a.status} />
                <span className="text-xs text-slate-500">{new Date(a.appointment_date).toLocaleString()}</span>
              </div>
              <p className="text-white font-bold capitalize">{a.service_type.replace('_', ' ')}</p>
              <p className="text-slate-400 text-xs">{a.phone}</p>
            </div>
            {a.status === 'scheduled' && (
              <button onClick={() => confirmAppt(a.id)} disabled={updating === a.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition disabled:opacity-50">
                <Check size={12} /> Confirm
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-400 text-sm">No appointments.</p>}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-slate-700 border-t-[#C9A84C] rounded-full animate-spin" />
    </div>
  );
}

const Pagination = memo(function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg disabled:opacity-40 hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
        Prev
      </button>
      <span className="text-xs text-slate-500">{page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg disabled:opacity-40 hover:border-[#C9A84C] hover:text-[#C9A84C] transition">
        Next
      </button>
    </div>
  );
});

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
    case 'reports':      return <div className="text-slate-400">Reports coming soon.</div>;
    case 'settings':     return <div className="text-slate-400">Settings coming soon.</div>;
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
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'setup') return <AdminSetup onCreated={() => setState('login')} />;
  if (state === 'login') return <AdminLogin onLoggedIn={() => setState('panel')} />;

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <AdminSidebar
        activeView={view}
        onViewChange={setView}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-end px-6 py-4 border-b border-white/[0.04]">
          <button onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg hover:border-red-500/50 hover:text-red-400 transition">
            <LogOut size={12} /> Exit
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {renderView(view, setView)}
        </main>
      </div>
    </div>
  );
}
