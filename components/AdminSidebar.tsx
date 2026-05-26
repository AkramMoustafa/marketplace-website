"use client";

import { LayoutDashboard, Car, PlusCircle, BarChart2, Settings, ChevronLeft, ChevronRight, DollarSign, Star, ArrowLeftRight, Calendar, MessageSquare, Bot } from "lucide-react";

export type AdminView = "dashboard" | "cars" | "add-car" | "financing" | "tradeins" | "appointments" | "reviews" | "contact" | "reports" | "settings" | "ai-agent";

interface AdminSidebarProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { view: AdminView; label: string; icon: React.ReactNode }[] = [
  { view: "dashboard",    label: "Dashboard",    icon: <LayoutDashboard size={17} /> },
  { view: "cars",         label: "Vehicles",     icon: <Car size={17} /> },
  { view: "add-car",      label: "Add Vehicle",  icon: <PlusCircle size={17} /> },
  { view: "financing",    label: "Financing",    icon: <DollarSign size={17} /> },
  { view: "tradeins",     label: "Trade-Ins",    icon: <ArrowLeftRight size={17} /> },
  { view: "appointments", label: "Appointments", icon: <Calendar size={17} /> },
  { view: "reviews",      label: "Reviews",      icon: <Star size={17} /> },
  { view: "contact",      label: "Inquiries",    icon: <MessageSquare size={17} /> },
  { view: "reports",      label: "Reports",      icon: <BarChart2 size={17} /> },
  { view: "settings",     label: "Settings",     icon: <Settings size={17} /> },
  { view: "ai-agent",     label: "AI Agent",     icon: <Bot size={17} /> },
];

export default function AdminSidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: AdminSidebarProps) {
  return (
    <aside
      className={`relative flex flex-col bg-[#0D0D0D] border-r border-[#C9A84C]/10 transition-all duration-300 min-h-screen ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-[#C9A84C]/10 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-6 h-6 border border-[#C9A84C] rotate-45 flex items-center justify-center shrink-0">
          <span className="text-[#C9A84C] font-serif text-[8px] font-bold -rotate-45">NM</span>
        </div>
        {!collapsed && (
          <span className="font-serif text-white text-sm tracking-widest uppercase">
            Nova<span className="text-[#C9A84C]">Motors</span>
          </span>
        )}
      </div>

      <nav className="flex-1 py-5 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-sans tracking-wide transition-all duration-200 border-l-2 ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04] border-transparent"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#C9A84C] rounded-full flex items-center justify-center text-black hover:bg-[#D4B96A] transition-colors z-10 shadow-lg"
        aria-label={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
