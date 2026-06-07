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
      className={`relative flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 min-h-screen ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
          <span className="text-white font-jakarta font-bold text-[9px] tracking-wider">NM</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-jakarta font-black text-gray-900 text-[13px] tracking-[3px] uppercase">Nova</span>
            <span className="font-jakarta font-semibold text-gray-400 text-[8px] tracking-[2.5px] uppercase mt-[2px]">Motors</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-jakarta font-medium tracking-wide transition-all duration-150 rounded-lg border-l-2 ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-blue-50 text-blue-600 border-blue-600"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors z-10 shadow-sm"
        aria-label={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
