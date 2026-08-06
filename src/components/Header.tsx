import React from "react";
import {
  Sparkles,
  Kanban,
  BookOpen,
  User,
  RotateCcw,
  Database,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { UserProfile } from "./AuthModal";
import { isSupabaseConfigured } from "../lib/supabase";

interface HeaderProps {
  activeTab: "generator" | "kanban" | "audit" | "guide" | "admin";
  setActiveTab: (tab: "generator" | "kanban" | "audit" | "guide" | "admin") => void;
  savedStoriesCount: number;
  readyStoriesCount: number;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onResetSystem?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedStoriesCount,
  currentUser,
  onLogout,
  onResetSystem,
  onOpenSupabaseModal,
}) => {
  const isDbConnected = isSupabaseConfigured();

  const isAdmin =
    currentUser?.role.toLowerCase().includes("admin") ||
    currentUser?.role.toLowerCase().includes("gpm") ||
    currentUser?.role.toLowerCase().includes("gerente");

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & DB Status */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base tracking-tight text-white whitespace-nowrap">
                Histórias <span className="text-indigo-400">Ágeis</span>
              </h1>
            </div>
          </div>

          {/* Center: Main Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "generator"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Gerador Ágil</span>
              <span className="sm:hidden">Gerador</span>
            </button>

            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer whitespace-nowrap ${
                activeTab === "kanban"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Backlog</span>
              <span className="sm:hidden">Backlog</span>
              {savedStoriesCount > 0 && (
                <span className="ml-1 bg-indigo-950 text-indigo-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-indigo-800">
                  {savedStoriesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "admin"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Painel ADM</span>
              {isAdmin && (
                <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-[9px] font-bold px-1 rounded">
                  RBAC
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("guide")}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "guide"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
              <span>Guia</span>
            </button>
          </nav>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {onResetSystem && (
              <button
                onClick={onResetSystem}
                className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-rose-300 bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 transition cursor-pointer"
                title="Resetar todos os dados"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>Resetar Dados</span>
              </button>
            )}

            {currentUser && (
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${
                    currentUser.avatarColor || "from-indigo-500 to-indigo-700"
                  } flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm`}
                >
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>

                <div className="hidden lg:block text-left leading-tight max-w-[110px]">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[9px] text-indigo-400 truncate font-semibold">{currentUser.role}</p>
                </div>

                <button
                  onClick={onLogout}
                  title="Sair da Conta"
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
