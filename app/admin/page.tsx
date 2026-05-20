'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar, { type AdminView } from '@/components/AdminSidebar';
import { useAuth } from '@/lib/auth-context';
import * as api from '@/lib/api';
import type {
  DashboardStats, VehicleListItem, FinancingRequest, Review, TradeIn, ServiceAppointment,
  FinancingStatus, ReviewStatus, TransmissionType, FuelType, VehicleStatus,
} from '@/lib/types';
import { Trash2, LogOut, Check, X, Eye, EyeOff } from 'lucide-react';

const GATE_PASSWORD = 'admin2025';
const GATE_KEY = 'ag_unlocked';

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === GATE_PASSWORD) {
      sessionStorage.setItem(GATE_KEY, '1');
      onUnlock();
    } else {
      setShake(true);
      setPw('');
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <form onSubmit={attempt}
        className={`w-full max-w-xs space-y-4 ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        <p className="text-[10px] uppercase tracking-[3px] text-slate-600 text-center">Access Required</p>
        <div className="relative">
          <input
            autoFocus
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 pr-10 bg-[#111] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#C9A84C]/50 transition"
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button type="submit"
          className="w-full py-3 bg-[#C9A84C] text-black font-black uppercase tracking-wide text-xs rounded-xl hover:bg-[#D4B96A] transition">
          Enter
        </button>
      </form>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-[#111] border border-[#C9A84C]/10 rounded-xl p-5">
      <p className="text-xs uppercase tracking-[2px] text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#C9A84C]">{sub}</p>}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
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
}

// ── Dashboard view ─────────────────────────────────────────────────────────────
function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats) return <p className="text-slate-400">Failed to load stats.</p>;

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

// ── Vehicles view ──────────────────────────────────────────────────────────────
function VehiclesView() {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListVehicles(page, 15);
      setVehicles(data.items);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

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

  if (loading) return <Spinner />;

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
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 text-white font-medium">{v.title}</td>
                <td className="px-5 py-3 text-slate-400">{v.year}</td>
                <td className="px-5 py-3 text-[#C9A84C] font-bold">${parseFloat(v.price).toLocaleString()}</td>
                <td className="px-5 py-3"><Badge status={v.status} /></td>
                <td className="px-5 py-3 flex items-center gap-2 justify-end">
                  <Link href={`/inventory/${v.id}`} target="_blank"
                    className="text-xs text-slate-400 hover:text-white transition">View</Link>
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
function AddVehicleView() {
  const [form, setForm] = useState({
    title: '', make: '', model: '', year: new Date().getFullYear(),
    mileage: 0, price: '', transmission: 'automatic' as TransmissionType,
    fuel_type: 'gasoline' as FuelType, vin: '', description: '',
    color: '', body_type: '', featured: false, status: 'available' as VehicleStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const v = await api.adminCreateVehicle({ ...form, price: form.price });
      setSuccess(`Created: ${v.title} (ID: ${v.id})`);
      setForm(f => ({ ...f, title: '', vin: '', description: '', color: '', price: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  const input = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">{label}</label>
      <input type={type} value={String(form[key as keyof typeof form])} placeholder={placeholder}
        onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A84C] transition" />
    </div>
  );

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
        {input('Price ($)', 'price', 'text', '89500.00')}
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
        {success && <p className="text-emerald-400 text-sm">{success}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#C9A84C] text-black font-black uppercase tracking-wide text-sm rounded-xl hover:bg-[#D4B96A] disabled:opacity-60 transition">
          {loading ? 'Creating…' : 'Create Vehicle'}
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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListFinancing(undefined, page);
      setItems(data.items); setPages(data.pages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, status: FinancingStatus) => {
    setUpdating(id);
    try {
      const updated = await api.adminUpdateFinancing(id, { status });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  };

  if (loading) return <Spinner />;

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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListReviews(undefined, page);
      setItems(data.items); setPages(data.pages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, status: ReviewStatus) => {
    setUpdating(id);
    try {
      const updated = await api.adminUpdateReview(id, { status });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    setUpdating(id);
    try {
      await api.adminDeleteReview(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  };

  if (loading) return <Spinner />;

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

// ── Trade-ins view (simple list) ───────────────────────────────────────────────
function TradeInsView() {
  const [items, setItems] = useState<TradeIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminListTradeIns().then(d => setItems(d.items)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
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

  useEffect(() => {
    api.adminListAppointments().then(d => setItems(d.items)).finally(() => setLoading(false));
  }, []);

  const confirm = async (id: string) => {
    setUpdating(id);
    try {
      const updated = await api.adminUpdateAppointment(id, { status: 'confirmed' });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUpdating(null); }
  };

  if (loading) return <Spinner />;
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
              <button onClick={() => confirm(a.id)} disabled={updating === a.id}
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

function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
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
}

// ── Main admin page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<AdminView>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(GATE_KEY) === '1') setGateOpen(true);
  }, []);

  const handleExit = () => {
    sessionStorage.removeItem(GATE_KEY);
    if (user) logout();
    router.push('/');
  };

  if (!gateOpen) return <AdminGate onUnlock={() => setGateOpen(true)} />;

  const ViewComponent = {
    dashboard: DashboardView,
    cars: VehiclesView,
    'add-car': AddVehicleView,
    financing: FinancingView,
    tradeins: TradeInsView,
    appointments: AppointmentsView,
    reviews: ReviewsView,
    reports: () => <div className="text-slate-400">Reports coming soon.</div>,
    settings: () => <div className="text-slate-400">Settings coming soon.</div>,
  }[view];

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <AdminSidebar
        activeView={view}
        onViewChange={setView}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div />
          <div className="flex items-center gap-4">
            {user && <span className="text-xs text-slate-500">{user.name} · {user.email}</span>}
            <button onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg hover:border-red-500/50 hover:text-red-400 transition">
              <LogOut size={12} /> Exit
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <ViewComponent />
        </main>
      </div>
    </div>
  );
}
