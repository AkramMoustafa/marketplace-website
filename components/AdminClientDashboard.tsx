"use client";

import { useState } from "react";
import AdminSidebar, { AdminView } from "@/components/AdminSidebar";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

interface AdminClientDashboardProps {
  initialStats: {
    totalVehicles: string;
    activeLeads: string;
    revenue: string;
    siteVisitors: string;
  };
}

export default function AdminClientDashboard({ initialStats }: AdminClientDashboardProps) {
  const [activeView, setActiveView] = useState<AdminView | "extra-features">("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans">
      <AdminSidebar
        activeView={activeView as AdminView}
        onViewChange={(view) => setActiveView(view)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-md border-b border-[#C9A84C]/10 px-8 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-serif text-[#C9A84C] tracking-wide capitalize">
            {activeView.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#8C7335] p-0.5">
                <div className="w-full h-full rounded-full bg-[#0D0D0D] flex items-center justify-center text-sm font-bold text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-black transition-colors">
                  AD
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium">Admin User</div>
                <div className="text-xs text-white/40">Superadmin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeView === "dashboard" && <DashboardView stats={initialStats} />}
          {activeView === "cars" && <PlaceholderView title="Inventory Management" />}
          {activeView === "add-car" && <PlaceholderView title="Add New Vehicle" />}
          {activeView === "reports" && <PlaceholderView title="Analytics & Reports" />}
          {activeView === "settings" && <PlaceholderView title="System Settings" />}
          {activeView === "extra-features" && <PlaceholderView title="extra features" />}
        </div>
      </main>
    </div>
  );
}

function DashboardView({ stats }: { stats: AdminClientDashboardProps["initialStats"] }) {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          change="+12"
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          title="Active Leads"
          value={stats.activeLeads}
          change="+5"
          icon={<Users size={20} />}
        />
        <StatCard
          title="Revenue (MTD)"
          value={stats.revenue}
          change="+15%"
          icon={<DollarSign size={20} />}
        />
        <StatCard
          title="Site Visitors"
          value={stats.siteVisitors}
          change="+2.4%"
          icon={<Activity size={20} />}
        />
        {/* all real updates will be done using websocket */}
      </div>

      {/* Recent Activity / Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0D0D0D] border border-[#C9A84C]/10 rounded-xl p-6">
          <h3 className="text-lg font-serif text-white mb-4">Revenue Overview</h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
            <span className="text-white/30 text-sm">Interactive Chart Component</span>
          </div>
        </div>
        <div className="bg-[#0D0D0D] border border-[#C9A84C]/10 rounded-xl p-6">
          <h3 className="text-lg font-serif text-white mb-4">Recent Inquiries</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-[#C9A84C]/20">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#C9A84C]">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium">New inquiry for Rolls Royce</div>
                  <div className="text-xs text-white/40">2 hours ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// TODO: implemenet real data using websocket
function StatCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: React.ReactNode }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-[#0D0D0D] border border-[#C9A84C]/10 p-6 rounded-xl relative overflow-hidden group hover:border-[#C9A84C]/30 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C9A84C]/10 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-white/60 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-white/5 rounded-lg text-[#C9A84C]">
          {icon}
        </div>
      </div>

      <div className="flex items-end gap-3 relative z-10">
        <div className="text-4xl font-serif text-white tracking-tight">{value}</div>
        <div className={`text-sm mb-1 px-2 py-0.5 rounded-full bg-white/5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change}
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center border border-dashed border-white/10 rounded-2xl bg-[#0D0D0D]/50">
      <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] mb-4">
        <Activity size={32} />
      </div>
      <h2 className="text-2xl font-serif text-white mb-2">{title}</h2>
      <p className="text-white/40 max-w-md">
        This module is currently under development. Check back soon for updates to the admin functionality.
      </p>
    </div>
  );
}
