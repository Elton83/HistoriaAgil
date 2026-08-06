import React, { useState } from "react";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  UserCheck,
  Briefcase,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { UserProfile } from "./AuthModal";
import { syncUserProfileWithSupabase } from "../services/supabaseService";
import { EBLogo } from "./EBLogo";

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const DEMO_ACCOUNTS: UserProfile[] = [
  {
    id: "user-po-1",
    name: "Elton Rabelo",
    email: "elton.rabelo@agile.com",
    role: "Administrador / GPM",
    avatarColor: "from-indigo-500 to-indigo-700",
  },
  {
    id: "user-sm-2",
    name: "Ana Paula Costa",
    email: "ana.costa@agile.com",
    role: "Scrum Master & Agile Coach",
    avatarColor: "from-emerald-500 to-teal-700",
  },
  {
    id: "user-dev-3",
    name: "Carlos Eduardo",
    email: "carlos.dev@agile.com",
    role: "Tech Lead / Arquiteto",
    avatarColor: "from-amber-500 to-orange-700",
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("Product Owner");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha o e-mail e a senha para entrar.");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Informe um endereço de e-mail válido.");
      return;
    }

    setIsLoading(true);

    const derivedName = email.split("@")[0].replace(".", " ");
    const formattedName =
      derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

    const rawUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: formattedName || "Usuário Ágil",
      email: email,
      role: "Product Owner",
      avatarColor: "from-indigo-500 to-indigo-700",
    };

    const result = await syncUserProfileWithSupabase(rawUser);
    const loggedUser = result.profile;

    setIsLoading(false);
    setSuccessMessage(
      result.isSupabase
        ? `Autenticado com sucesso! Perfil sincronizado no Supabase PostgreSQL.`
        : `Autenticado com sucesso! Entrando no sistema...`
    );

    setTimeout(() => {
      onLogin(loggedUser);
    }, 600);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas informadas não coincidem.");
      return;
    }

    setIsLoading(true);

    const rawUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name,
      email: email,
      role: role,
      avatarColor: "from-indigo-500 to-purple-600",
    };

    const result = await syncUserProfileWithSupabase(rawUser);
    const newUser = result.profile;

    setIsLoading(false);
    setSuccessMessage(
      result.isSupabase
        ? `Conta criada e salva no Supabase PostgreSQL com sucesso!`
        : `Conta criada com sucesso!`
    );

    setTimeout(() => {
      onLogin(newUser);
    }, 600);
  };

  const handleSelectDemoAccount = async (acc: UserProfile) => {
    setEmail(acc.email);
    setPassword("••••••••");
    setIsLoading(true);
    setSuccessMessage(`Conectando como ${acc.name}...`);

    const result = await syncUserProfileWithSupabase(acc);
    setIsLoading(false);

    setSuccessMessage(`Bem-vindo, ${result.profile.name}!`);
    setTimeout(() => {
      onLogin(result.profile);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <EBLogo size={60} />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Histórias <span className="text-amber-400">Ágeis</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Engenharia de Requisitos, Histórias com AC, RN e BDD
          </p>
        </div>

        {/* Tab switcher: Login / Cadastro */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "login"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === "register"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center space-x-2 text-xs text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl flex items-center space-x-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form area */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elton.rabelo@agile.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-10 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Acessar o Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elton Rabelo"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elton.rabelo@agile.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Papel na Equipe (RBAC)</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="Administrador / GPM">Administrador / GPM</option>
                  <option value="Product Owner">Product Owner</option>
                  <option value="Scrum Master & Agile Coach">Scrum Master & Agile Coach</option>
                  <option value="Tech Lead / Arquiteto">Tech Lead / Arquiteto</option>
                  <option value="Desenvolvedor / QA">Desenvolvedor / QA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmar</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando Conta no Banco...</span>
                </>
              ) : (
                <span>Criar Conta e Acessar</span>
              )}
            </button>
          </form>
        )}

        {/* Demo Accounts Quick Access */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
            Acesso Rápido para Testes
          </p>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSelectDemoAccount(acc)}
                className="flex items-center justify-between bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${acc.avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                  >
                    {acc.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{acc.role}</p>
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
