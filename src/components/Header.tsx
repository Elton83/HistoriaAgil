import React from "react";
import { Sparkles, Kanban, BookOpen, User, RotateCcw, Database } from "lucide-react";
import { UserProfile } from "./AuthModal";
import { isSupabaseConfigured } from "../lib/supabase";

interface HeaderProps {
  activeTab: "generator" | "kanban" | "audit" | "guide";
  setActiveTab: (tab: "generator" | "kanban" | "audit" | "guide") => void;
  savedStoriesCount: number;
  readyStoriesCount: number;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onResetSystem?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedStoriesCount,
  readyStoriesCount,
  currentUser,
  onOpenAuthModal,
  onResetSystem,
}) => {
  const isDbConnected = isSupabaseConfigured();

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg tracking-tight text-white">
                  Histórias <span className="text-indigo-400">Ágeis</span>
                </h1>
                <span className="bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Scrum & BDD
                </span>
                {/* Supabase Status Pill */}
                <span
                  title={
                    isDbConnected
                      ? "Conectado ao Supabase PostgreSQL"
                      : "Modo Local (Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o banco)"
                  }
                  className={`hidden md:flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-help ${
                    isDbConnected
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/80"
                      : "bg-amber-950/80 text-amber-300 border-amber-800/80"
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>{isDbConnected ? "Supabase PostgreSQL" : "Cache Local"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Gerador de Histórias, AC, RN e Cenários BDD por Incremento
              </p>
            </div>
          </div>

          {/* Navigation Tabs & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab("generator")}
                className={`flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "generator"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Gerador Ágil</span>
                <span className="sm:hidden">Gerador</span>
              </button>

              <button
                onClick={() => setActiveTab("kanban")}
                className={`flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                  activeTab === "kanban"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Quadro / Backlog</span>
                <span className="sm:hidden">Quadro</span>
                {savedStoriesCount > 0 && (
                  <span className="ml-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-indigo-800">
                    {savedStoriesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("guide")}
                className={`hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "guide"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Guia</span>
              </button>
            </nav>

            {/* User Profile / Login Button & Reset Data */}
            <div className="border-l border-slate-800 pl-2 sm:pl-3 flex items-center space-x-2">
              {onResetSystem && (
                <button
                  onClick={onResetSystem}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 bg-slate-950/60 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/60 transition cursor-pointer"
                  title="Resetar todos os dados de exemplo para criar requisitos reais"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400/80" />
                  <span className="hidden lg:inline text-[11px]">Resetar p/ Dados Reais</span>
                </button>
              )}

              {currentUser ? (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl px-2.5 py-1.5 transition cursor-pointer group"
                  title="Ver perfil e gerenciar conta"
                >
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                      currentUser.avatarColor || "from-indigo-500 to-indigo-700"
                    } flex items-center justify-center text-white font-bold text-xs shadow-sm`}
                  >
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-white group-hover:text-indigo-300 truncate max-w-[120px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[120px]">
                      {currentUser.role}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center space-x-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 hover:border-indigo-700 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

