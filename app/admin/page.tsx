"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Car, Plus, Trash2, Pencil, Search, BarChart2,
  TrendingUp, Users, MessageSquare, X, Check, Menu
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import AdminSidebar, { AdminView } from "@/components/AdminSidebar";
import { cars as initialCars, Car as CarType, formatPrice } from "@/lib/data";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NewCarForm {
  title: string; brand: string; model: string; year: string;
  mileage: string; transmission: string; fuelType: string;
  price: string; color: string; location: string; status: string;
  description: string; imageUrl: string; financing: string; features: string[];
}
const EMPTY: NewCarForm = {
  title: "", brand: "", model: "", year: "2024",
  mileage: "", transmission: "Automatic", fuelType: "Gasoline",
  price: "", color: "", location: "", status: "available",
  description: "", imageUrl: "", financing: "", features: [""],
};

const PIE_COLORS = ["#C9A84C", "#2a2a2a"];

// ── Shared input classes ──────────────────────────────────────────────────────
const inputCls = "w-full bg-white/[0.04] border border-white/10 focus:border-[#C9A84C]/50 text-white placeholder-white/20 text-sm font-sans px-4 py-2.5 rounded outline-none transition-colors";
const labelCls = "block text-white/35 text-[10px] font-sans uppercase tracking-[0.18em] mb-1.5";

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#111111] border border-white/[0.07] hover:border-[#C9A84C]/25 p-6 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[#C9A84C]">{icon}</span>
        {sub && <span className="text-white/25 text-xs font-sans">{sub}</span>}
      </div>
      <p className="font-serif text-3xl text-white mb-1">{value}</p>
      <p className="text-white/30 text-[10px] font-sans uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardView({ carList }: { carList: CarType[] }) {
  const available = carList.filter((c) => c.status === "available").length;
  const sold = carList.filter((c) => c.status === "sold").length;
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-white mb-1">Dashboard</h2>
        <p className="text-white/30 text-sm font-sans">Welcome back, Admin</p>
        <div className="thin-divider mt-6" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={<Car size={19} />}           label="Total Vehicles"  value={carList.length} />
        <MetricCard icon={<TrendingUp size={19} />}    label="Available"       value={available} sub="In Stock" />
        <MetricCard icon={<BarChart2 size={19} />}     label="Sold"            value={sold}      sub="Delivered" />
        <MetricCard icon={<MessageSquare size={19} />} label="Messages"        value={24}        sub="Unread" />
      </div>
      <div>
        <h3 className="font-serif text-xl text-white mb-4">Recent Activity</h3>
        <div className="bg-[#111111] border border-white/[0.07] divide-y divide-white/[0.06]">
          {carList.slice(0, 5).map((car) => (
            <div key={car.id} className="flex items-center gap-4 p-4">
              <div className="relative w-14 h-10 overflow-hidden shrink-0">
                <Image src={car.images[0]} alt={car.title} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-sans truncate">{car.title}</p>
                <p className="text-white/30 text-xs font-sans">#{car.stockNumber}</p>
              </div>
              <span className={`text-[10px] px-2.5 py-1 font-sans tracking-wider ${
                car.status === "available" ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "bg-white/5 text-white/30"
              }`}>
                {car.status}
              </span>
              <span className="text-[#C9A84C] font-serif text-sm shrink-0">{formatPrice(car.price)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="flex items-center gap-2 bg-[#C9A84C] text-black text-[11px] tracking-[0.15em] uppercase font-sans font-semibold px-6 py-3 hover:bg-[#D4B96A] transition-colors">
          <Plus size={14} /> Add New Car
        </button>
        <button className="border border-white/10 text-white/50 text-[11px] tracking-[0.15em] uppercase font-sans px-6 py-3 hover:border-white/25 hover:text-white/80 transition-colors">
          Generate Report
        </button>
        <button className="border border-white/10 text-white/50 text-[11px] tracking-[0.15em] uppercase font-sans px-6 py-3 hover:border-white/25 hover:text-white/80 transition-colors flex items-center gap-2">
          <Users size={13} /> Messages
        </button>
      </div>
    </div>
  );
}

// ── Cars table ────────────────────────────────────────────────────────────────
function CarsView({ carList, onDelete }: { carList: CarType[]; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const filtered = carList.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.brand.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl text-white mb-1">Manage Cars</h2>
        <div className="thin-divider mt-6" />
      </div>
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text" placeholder="Search vehicles…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-9`}
        />
      </div>
      <div className="overflow-x-auto border border-white/[0.07]">
        <table className="w-full min-w-[700px]">
          <thead className="bg-[#111111] border-b border-white/[0.07]">
            <tr>
              {["Image","Stock #","Vehicle","Year","Price","Status","Actions"].map((h) => (
                <th key={h} className="text-left text-[10px] tracking-[0.15em] uppercase font-sans text-white/30 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] bg-[#0D0D0D]">
            {filtered.map((car) => (
              <tr key={car.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="relative w-16 h-10 overflow-hidden">
                    <Image src={car.images[0]} alt={car.title} fill className="object-cover" sizes="64px" />
                  </div>
                </td>
                <td className="px-4 py-3 text-[#C9A84C] text-xs font-sans">#{car.stockNumber}</td>
                <td className="px-4 py-3 text-white text-sm font-sans max-w-[200px] truncate">{car.title}</td>
                <td className="px-4 py-3 text-white/45 text-sm font-sans">{car.year}</td>
                <td className="px-4 py-3 text-[#C9A84C] font-serif text-sm">{formatPrice(car.price)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2.5 py-1 font-sans tracking-wider ${
                    car.status === "available" ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "bg-white/5 text-white/30"
                  }`}>{car.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button className="p-2 text-white/35 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors" title="Edit">
                      <Pencil size={13} />
                    </button>
                    {confirm === car.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => { onDelete(car.id); setConfirm(null); }}
                          className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setConfirm(null)}
                          className="p-1.5 bg-white/5 text-white/35 hover:bg-white/10 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirm(car.id)}
                        className="p-2 text-white/35 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/25 font-sans text-sm">No vehicles match your search.</div>
        )}
      </div>
    </div>
  );
}

// ── Add car form ──────────────────────────────────────────────────────────────
function AddCarView({ onAdd }: { onAdd: (car: CarType) => void }) {
  const [form, setForm] = useState<NewCarForm>(EMPTY);
  const [ok, setOk] = useState(false);
  const set = (k: keyof NewCarForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setFeat = (i: number, v: string) => {
    const features = [...form.features]; features[i] = v;
    setForm((f) => ({ ...f, features }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Date.now().toString(),
      stockNumber: `LX-${Math.floor(Math.random() * 900) + 100}`,
      title: form.title || `${form.year} ${form.brand} ${form.model}`,
      brand: form.brand, model: form.model, year: +form.year || 2024,
      mileage: +form.mileage || 0,
      transmission: form.transmission as "Automatic" | "Manual",
      fuelType: form.fuelType as CarType["fuelType"],
      price: +form.price || 0, color: form.color, location: form.location,
      status: form.status as "available" | "sold",
      description: form.description,
      features: form.features.filter(Boolean),
      financing: form.financing,
      images: form.imageUrl
        ? [form.imageUrl]
        : ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"],
    });
    setForm(EMPTY); setOk(true);
    setTimeout(() => setOk(false), 3000);
  };

  return (
    <div>
      <h2 className="font-serif text-3xl text-white mb-1">Add New Vehicle</h2>
      <div className="thin-divider mt-6 mb-8" />
      {ok && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-sans px-5 py-3.5 mb-8"
        >
          <Check size={15} /> Vehicle added to inventory successfully!
        </motion.div>
      )}
      <form onSubmit={submit} className="space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { label: "Full Title", key: "title", placeholder: "2024 Mercedes-Benz S-Class" },
            { label: "Model",      key: "model", placeholder: "S-Class" },
            { label: "Mileage",    key: "mileage", placeholder: "5000", type: "number" },
            { label: "Price (USD)",key: "price",   placeholder: "150000", type: "number" },
            { label: "Color",      key: "color",   placeholder: "Obsidian Black" },
            { label: "Location",   key: "location",placeholder: "Downtown Showroom · New York" },
            { label: "Image URL",  key: "imageUrl",placeholder: "https://..." },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} type={type || "text"} placeholder={placeholder}
                value={form[key as keyof NewCarForm] as string}
                onChange={(e) => set(key as keyof NewCarForm, e.target.value)} />
            </div>
          ))}

          {/* Selects */}
          {[
            { label: "Brand", key: "brand", opts: ["","Mercedes-Benz","BMW","Rolls-Royce","Porsche","Bentley","Lamborghini","Aston Martin","Ferrari"] },
            { label: "Year",  key: "year",  opts: Array.from({length:8},(_,i)=>(2025-i).toString()) },
            { label: "Transmission", key: "transmission", opts: ["Automatic","Manual"] },
            { label: "Fuel Type",    key: "fuelType",     opts: ["Gasoline","Diesel","Hybrid","Electric"] },
            { label: "Status",       key: "status",       opts: ["available","sold"] },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <select className={`${inputCls} cursor-pointer`}
                value={form[key as keyof NewCarForm] as string}
                onChange={(e) => set(key as keyof NewCarForm, e.target.value)}>
                {opts.map((o) => <option key={o} value={o} className="bg-[#111111]">{o || "Select Brand"}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} resize-none h-24`} placeholder="2–3 sentences…"
            value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Financing Info</label>
          <input className={inputCls} placeholder="As low as $1,890/mo…" value={form.financing}
            onChange={(e) => set("financing", e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Features</label>
          <div className="space-y-2">
            {form.features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder={`Feature ${i + 1}`} value={f}
                  onChange={(e) => setFeat(i, e.target.value)} />
                {form.features.length > 1 && (
                  <button type="button"
                    onClick={() => setForm((prev) => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }))}
                    className="p-2.5 bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button"
            onClick={() => setForm((f) => ({ ...f, features: [...f.features, ""] }))}
            className="mt-3 flex items-center gap-1.5 text-[#C9A84C] text-[11px] tracking-wider uppercase font-sans hover:text-[#D4B96A] transition-colors">
            <Plus size={12} /> Add Feature
          </button>
        </div>

        <button type="submit"
          className="flex items-center gap-2 bg-[#C9A84C] text-black text-[11px] tracking-[0.15em] uppercase font-sans font-semibold px-10 py-3.5 hover:bg-[#D4B96A] transition-colors">
          <Plus size={14} /> Add Vehicle to Inventory
        </button>
      </form>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function ReportsView({ carList }: { carList: CarType[] }) {
  const totalValue = carList.reduce((s, c) => s + c.price, 0);
  const available  = carList.filter((c) => c.status === "available").length;
  const sold       = carList.filter((c) => c.status === "sold").length;

  const brandData = Object.entries(
    carList.reduce((acc: Record<string, number>, c) => { acc[c.brand] = (acc[c.brand] || 0) + 1; return acc; }, {})
  ).map(([brand, count]) => ({ brand: brand.split("-")[0], count }));

  const pieData = [{ name: "Available", value: available }, { name: "Sold", value: sold }];

  const ttip = { contentStyle: { background: "#111111", border: "1px solid rgba(201,168,76,.25)", color: "#fff", borderRadius: 0 }, cursor: { fill: "rgba(201,168,76,.06)" } };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-white mb-1">Reports</h2>
        <div className="thin-divider mt-6" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/[0.07] p-6">
          <p className="text-white/30 text-[10px] font-sans uppercase tracking-[0.15em] mb-3">Total Inventory Value</p>
          <p className="font-serif text-4xl text-[#C9A84C]">{formatPrice(totalValue)}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.07] p-6">
          <p className="text-white/30 text-[10px] font-sans uppercase tracking-[0.15em] mb-3">Available</p>
          <p className="font-serif text-4xl text-white">{available} <span className="text-base text-white/35">vehicles</span></p>
        </div>
        <div className="bg-[#111111] border border-white/[0.07] p-6">
          <p className="text-white/30 text-[10px] font-sans uppercase tracking-[0.15em] mb-3">Sold</p>
          <p className="font-serif text-4xl text-white">{sold} <span className="text-base text-white/35">vehicles</span></p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111111] border border-white/[0.07] p-6">
          <h3 className="font-serif text-lg text-white mb-6">Cars by Brand</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="brand" tick={{ fill: "rgba(255,255,255,.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,.3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...ttip} />
              <Bar dataKey="count" fill="#C9A84C" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#111111] border border-white/[0.07] p-6">
          <h3 className="font-serif text-lg text-white mb-6">Available vs Sold</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>{v}</span>} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(201,168,76,.25)", color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <button
        onClick={() => console.log("Generate PDF", { totalValue, available, sold })}
        className="border border-[#C9A84C]/40 text-[#C9A84C] text-[11px] tracking-[0.15em] uppercase font-sans px-8 py-3 hover:bg-[#C9A84C] hover:text-black transition-all duration-300"
      >
        Generate PDF Report
      </button>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsView() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "Luxury Motors", phone: "+1 (212) 555-0199",
    email: "hello@luxurymotors.com",
    address: "425 Park Avenue, New York, NY 10022",
    instagram: "@luxurymotors", facebook: "https://facebook.com/luxurymotors",
  });
  return (
    <div>
      <h2 className="font-serif text-3xl text-white mb-1">Settings</h2>
      <div className="thin-divider mt-6 mb-8" />
      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-sans px-5 py-3.5 mb-8">
          <Check size={15} /> Settings saved successfully!
        </motion.div>
      )}
      <div className="max-w-xl space-y-4">
        {(Object.entries(form) as [keyof typeof form, string][]).map(([k, v]) => (
          <div key={k}>
            <label className={labelCls}>{k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1")}</label>
            <input className={inputCls} value={v} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
          </div>
        ))}
        <button onClick={() => setSaved(true)}
          className="flex items-center gap-2 bg-[#C9A84C] text-black text-[11px] tracking-[0.15em] uppercase font-sans font-semibold px-8 py-3.5 hover:bg-[#D4B96A] transition-colors mt-2">
          <Check size={13} /> Save Settings
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [view, setView] = useState<AdminView>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [carList, setCarList] = useState<CarType[]>(initialCars);

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView carList={carList} />;
      case "cars":      return <CarsView carList={carList} onDelete={(id) => setCarList((p) => p.filter((c) => c.id !== id))} />;
      case "add-car":   return <AddCarView onAdd={(car) => setCarList((p) => [car, ...p])} />;
      case "reports":   return <ReportsView carList={carList} />;
      case "settings":  return <SettingsView />;
    }
  };

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <AdminSidebar
          activeView={view}
          onViewChange={(v) => { setView(v); setMobileOpen(false); }}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/[0.07] px-6 py-4 flex items-center justify-between">
          <button className="lg:hidden text-white/50 hover:text-white transition-colors" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="font-serif text-lg text-white capitalize">{view.replace("-", " ")}</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C9A84C] flex items-center justify-center">
              <span className="text-black text-xs font-bold font-serif">A</span>
            </div>
            <span className="hidden sm:block text-white/35 text-sm font-sans">Admin</span>
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-6 lg:p-10"
        >
          {renderView()}
        </motion.div>
      </div>
    </div>
  );
}
