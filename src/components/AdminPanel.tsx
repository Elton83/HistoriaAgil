import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Database,
  Lock,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  BarChart3,
  Server,
  Key,
} from "lucide-react";
import { UserProfile } from "./AuthModal";
import { UserStory } from "../types";
import {
  fetchAllProfilesFromSupabase,
  updateUserRoleInSupabase,
} from "../services/supabaseService";
import { isSupabaseConfigured } from "../lib/supabase";

interface AdminPanelProps {
  currentUser: UserProfile | null;
  stories: UserStory[];
  onUpdateCurrentUserRole?: (newRole: string) => void;
  onResetSystem?: () => void;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

const AVAILABLE_ROLES = [
  "Administrador / GPM",
  "Product Owner",
  "Scrum Master & Agile Coach",
  "Tech Lead / Arquiteto",
  "Desenvolvedor / QA",
];

const PERMISSIONS_MATRIX = [
  {
    feature: "Criar & Gerar Histórias com IA",
    admin: true,
    po: true,
    sm: true,
    dev: false,
  },
  {
    feature: "Editar Requisitos & Critérios de Aceite",
    admin: true,
    po: true,
    sm: false,
    dev: false,
  },
  {
    feature: "Mudar Status no Quadro Kanban",
    admin: true,
    po: true,
    sm: true,
    dev: true,
  },
  {
    feature: "Auditar Qualidade INVEST & BDD",
    admin: true,
    po: true,
    sm: true,
    dev: true,
  },
  {
    feature: "Gerenciar Perfis & Permissões (RBAC)",
    admin: true,
    po: false,
    sm: false,
    dev: false,
  },
  {
    feature: "Resetar e Limpar Banco PostgreSQL",
    admin: true,
    po: false,
    sm: false,
    dev: false,
  },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  stories,
  onUpdateCurrentUserRole,
  onResetSystem,
  showToast,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "matrix" | "metrics">("users");
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);

  const isDbConnected = isSupabaseConfigured();

  const isAdmin =
    currentUser?.role.toLowerCase().includes("admin") ||
    currentUser?.role.toLowerCase().includes("gpm") ||
    currentUser?.role.toLowerCase().includes("gerente");

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    const res = await fetchAllProfilesFromSupabase();
    setIsLoadingProfiles(false);

    if (res.isSupabase && res.profiles.length > 0) {
      setProfiles(res.profiles);
    } else {
      // Fallback demo profiles if DB empty or local
      setProfiles([
        {
          id: currentUser?.id || "u-1",
          name: currentUser?.name || "Elton Rabelo",
          email: currentUser?.email || "elton.rabelo@agile.com",
          role: currentUser?.role || "Administrador / GPM",
          avatarColor: currentUser?.avatarColor || "from-indigo-500 to-indigo-700",
        },
        {
          id: "u-2",
          name: "Ana Paula Costa",
          email: "ana.costa@agile.com",
          role: "Scrum Master & Agile Coach",
          avatarColor: "from-emerald-500 to-teal-700",
        },
        {
          id: "u-3",
          name: "Carlos Eduardo",
          email: "carlos.dev@agile.com",
          role: "Tech Lead / Arquiteto",
          avatarColor: "from-amber-500 to-orange-700",
        },
      ]);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [currentUser]);

  const handleRoleChange = async (targetEmail: string, newRole: string) => {
    setUpdatingEmail(targetEmail);
    const res = await updateUserRoleInSupabase(targetEmail, newRole);
    setUpdatingEmail(null);

    if (res.error) {
      if (showToast) showToast(`Erro ao atualizar no banco: ${res.error}`, "error");
    } else {
      if (showToast) showToast(`Papel de ${targetEmail} alterado para ${newRole}!`, "success");

      setProfiles((prev) =>
        prev.map((p) => (p.email === targetEmail ? { ...p, role: newRole } : p))
      );

      // If updating logged user's own role
      if (targetEmail === currentUser?.email && onUpdateCurrentUserRole) {
        onUpdateCurrentUserRole(newRole);
      }
    }
  };

  const totalPoints = stories.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
  const readyStories = stories.filter((s) => s.status === "ready").length;
  const inProgressStories = stories.filter((s) => s.status === "in_progress").length;
  const doneStories = stories.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Painel de Governança e RBAC</h2>
                <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Controle de Acesso
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gerencie permissões, usuários, papéis da equipe e acompanhe métricas da base PostgreSQL.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2 text-xs">
            <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[11px] block">Usuário Conectado</span>
              <span className="font-bold text-slate-200">
                {currentUser?.name} •{" "}
                <span className="text-indigo-400">{currentUser?.role}</span>
              </span>
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="mt-4 p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Você está navegando com o papel <strong>{currentUser?.role}</strong>. Para alterar papéis de outros usuários, ative o perfil Administrador.
              </span>
            </div>
            {onUpdateCurrentUserRole && (
              <button
                onClick={() => onUpdateCurrentUserRole("Administrador / GPM")}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition cursor-pointer text-[11px] shrink-0"
              >
                Elevar para Admin
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "users"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Papéis ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "matrix"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Matriz de Permissões (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab("metrics")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "metrics"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas do Banco & Infra</span>
        </button>
      </div>

      {/* Tab 1: Users & Roles List */}
      {activeTab === "users" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Perfis Cadastrados e Controle de Papéis</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Listagem sincronizada diretamente do Supabase PostgreSQL (`public.profiles`).
              </p>
            </div>

            <button
              onClick={loadProfiles}
              disabled={isLoadingProfiles}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProfiles ? "animate-spin text-indigo-400" : ""}`} />
              <span>Atualizar Lista</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Papel Atual (RBAC)</th>
                  <th className="px-4 py-3 text-right">Ação Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {profiles.map((p) => {
                  const isCurrent = p.email === currentUser?.email;
                  return (
                    <tr key={p.email} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-white flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                            p.avatarColor || "from-indigo-500 to-indigo-700"
                          } flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}
                        >
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{p.name}</span>
                          {isCurrent && (
                            <span className="ml-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{p.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center space-x-1.5 bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{p.role}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          disabled={!isAdmin || updatingEmail === p.email}
                          value={p.role}
                          onChange={(e) => handleRoleChange(p.email, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                        >
                          {AVAILABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Permissions Matrix */}
      {activeTab === "matrix" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <span>Matriz de Controle de Acesso Baseado em Papéis (RBAC)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Políticas de governança para permissões operacionais do ecossistema de engenharia ágil.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Funcionalidade / Módulo</th>
                  <th className="px-4 py-3 text-center">Admin / GPM</th>
                  <th className="px-4 py-3 text-center">Product Owner</th>
                  <th className="px-4 py-3 text-center">Scrum Master</th>
                  <th className="px-4 py-3 text-center">Dev / QA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {PERMISSIONS_MATRIX.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white">{item.feature}</td>
                    <td className="px-4 py-3 text-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.po ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.sm ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.dev ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600 inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Database & Infra Metrics */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-slate-400 text-xs font-semibold block">Histórias Totais</span>
              <span className="text-2xl font-black text-white mt-1 block">{stories.length}</span>
              <span className="text-[10px] text-slate-500">Persistidas no PostgreSQL</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-slate-400 text-xs font-semibold block">Histórias Ready (Homologadas)</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{readyStories}</span>
              <span className="text-[10px] text-slate-500">Prontas para a Sprint</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-slate-400 text-xs font-semibold block">Total Story Points</span>
              <span className="text-2xl font-black text-indigo-400 mt-1 block">{totalPoints} pts</span>
              <span className="text-[10px] text-slate-500">Estimativa acumulada</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-slate-400 text-xs font-semibold block">Status Conexão Supabase</span>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`w-3 h-3 rounded-full ${isDbConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                <span className="font-bold text-sm text-white">{isDbConnected ? "Ativo & Conectado" : "Modo Cache Local"}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Ações de Manutenção e Reset</span>
            </h3>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onResetSystem && (
                <button
                  onClick={onResetSystem}
                  className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Limpar & Resetar Todas as Histórias do Banco</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
