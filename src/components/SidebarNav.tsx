import React, { useState } from "react";
import {
  Sparkles,
  Kanban,
  BookOpen,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  BarChart3,
  RefreshCw,
  Database,
  Workflow,
  CheckSquare,
} from "lucide-react";
import { UserProfile } from "./AuthModal";
import { EBLogo } from "./EBLogo";
import { isSupabaseConfigured } from "../lib/supabase";

interface SidebarNavProps {
  activeTab: "generator" | "kanban" | "pipeline" | "reports" | "audit" | "guide" | "admin";
  setActiveTab: (tab: "generator" | "kanban" | "pipeline" | "reports" | "audit" | "guide" | "admin") => void;
  savedStoriesCount: number;
  readyStoriesCount: number;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onResetSystem?: () => void;
  onCreateNewStory?: () => void;
  onSyncDatabase?: () => Promise<void>;
  isSyncingDatabase?: boolean;
  onOpenSupabaseModal?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  savedStoriesCount,
  readyStoriesCount,
  currentUser,
  onLogout,
  onResetSystem,
  onCreateNewStory,
  onSyncDatabase,
  isSyncingDatabase,
  onOpenSupabaseModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isDbConfigured = isSupabaseConfigured();

  const isAdmin =
    currentUser?.role.toLowerCase().includes("admin") ||
    currentUser?.role.toLowerCase().includes("gpm") ||
    currentUser?.role.toLowerCase().includes("gerente");

  const navItems = [
    {
      id: "generator" as const,
      label: "Gerador Ágil",
      icon: Sparkles,
      badge: null,
    },
    {
      id: "kanban" as const,
      label: "Quadro Backlog",
      icon: Kanban,
      badge: savedStoriesCount > 0 ? savedStoriesCount : null,
    },
    {
      id: "pipeline" as const,
      label: "Esteira Homologação",
      icon: Workflow,
      badge: "8 Passos",
      badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800/80",
    },
    {
      id: "reports" as const,
      label: "Relatórios",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "admin" as const,
      label: "Painel ADM",
      icon: ShieldCheck,
      badge: isAdmin ? "RBAC" : null,
      badgeColor: "bg-indigo-950 text-indigo-300 border-indigo-800",
    },
    {
      id: "guide" as const,
      label: "Guia Ágil",
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <EBLogo size={32} />
          <span className="font-bold text-sm text-white">Histórias Ágeis</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Left Sidebar Drawer / Fixed Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
          isCollapsed ? "lg:w-20" : "lg:w-64"
        } ${isMobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Top Branding & Collapse Button */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <EBLogo size={36} />

            {!isCollapsed && (
              <div className="leading-tight truncate">
                <h1 className="font-black text-sm text-white truncate">Histórias Ágeis</h1>
                <p className="text-[10px] text-amber-400 font-semibold truncate">Scrum & BDD Studio</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button: Nova História */}
        {onCreateNewStory && (
          <div className="px-3 pt-3">
            <button
              onClick={() => {
                onCreateNewStory();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className={`w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2 cursor-pointer ${
                isCollapsed ? "px-2" : "px-3"
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Nova História</span>}
            </button>
          </div>
        )}

        {/* Main Navigation Menu */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Navegação
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.badgeColor || "bg-indigo-950 text-indigo-300 border-indigo-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: User Profile & Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {currentUser && (
            <div
              className={`flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-2 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                    currentUser.avatarColor || "from-indigo-500 to-indigo-700"
                  } flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}
                >
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>

                {!isCollapsed && (
                  <div className="leading-tight truncate">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-indigo-400 truncate font-semibold">{currentUser.role}</p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={onLogout}
                  title="Sair da Conta"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* User Profile */}
        </div>
      </aside>
    </>
  );
};
