import React, { useState } from "react";
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  CheckCircle2,
  X,
  UserCheck,
  Briefcase,
  KeyRound,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { syncUserProfileWithSupabase } from "../services/supabaseService";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

// Preset demo accounts for fast 1-click login
const DEMO_ACCOUNTS: UserProfile[] = [
  {
    id: "user-po-1",
    name: "Elton Rabelo",
    email: "elton.rabelo@agile.com",
    role: "Product Owner / GPM",
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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Product Owner");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback & Loading states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha o e-mail/usuário e a senha.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("A senha deve conter no mínimo 4 caracteres.");
      return;
    }

    setIsLoading(true);

    // Extract name from email or use email prefix
    const derivedName = email.split("@")[0].replace(".", " ");
    const formattedName =
      derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

    const rawUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: formattedName || "Usuário Ágil",
      email: email,
      role: "Product Owner / Analista",
      avatarColor: "from-indigo-500 to-indigo-700",
    };

    const result = await syncUserProfileWithSupabase(rawUser);
    const loggedUser = result.profile;

    setIsLoading(false);
    setSuccessMessage(
      result.isSupabase
        ? `Login efetuado e perfil sincronizado no Supabase! Bem-vindo, ${loggedUser.name}.`
        : `Login realizado com sucesso! Bem-vindo, ${loggedUser.name}.`
    );

    setTimeout(() => {
      onLogin(loggedUser);
      setSuccessMessage(null);
      onClose();
    }, 600);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("A senha deve ter pelo menos 4 caracteres.");
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
        ? `Conta criada e salva no Supabase PostgreSQL! Conectado como ${newUser.name}.`
        : `Conta criada com sucesso! Conectado como ${newUser.name}.`
    );

    setTimeout(() => {
      onLogin(newUser);
      setSuccessMessage(null);
      onClose();
    }, 600);
  };

  const handleSelectDemoAccount = async (acc: UserProfile) => {
    setEmail(acc.email);
    setPassword("••••••••");
    setIsLoading(true);
    setSuccessMessage(`Sincronizando conta demo (${acc.name}) no Supabase...`);

    const result = await syncUserProfileWithSupabase(acc);
    setIsLoading(false);

    setSuccessMessage(`Acessando como ${result.profile.name}...`);
    setTimeout(() => {
      onLogin(result.profile);
      setSuccessMessage(null);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Autenticação de Usuário
              </h2>
              <p className="text-[11px] text-slate-400">
                Histórias Ágeis • Acesso ao Sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is ALREADY LOGGED IN: Show User Profile Card */}
        {currentUser ? (
          <div className="p-6 space-y-5">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${
                  currentUser.avatarColor || "from-indigo-500 to-indigo-700"
                } flex items-center justify-center text-white font-bold text-lg shadow-md`}
              >
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded-full">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sessão ativa e autenticada</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Seus requisitos e históricos de histórias serão vinculados à esta conta.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN OR REGISTER FORM */
          <div className="p-6 space-y-5">
            {/* Tabs: Entrar vs Cadastrar */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 grid grid-cols-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  activeTab === "login"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  activeTab === "register"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            {/* Error or Success Messages */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Quick Demo Login Option */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Acesso Rápido de Teste (1-Clique):</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectDemoAccount(acc)}
                    className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition cursor-pointer group"
                  >
                    <p className="text-[11px] font-bold text-white truncate group-hover:text-indigo-300">
                      {acc.name.split(" ")[0]}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">
                      {acc.role.split("/")[0]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-mono uppercase">
                ou preencha os dados
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* TAB 1: LOGIN FORM */}
            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Username or Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail ou Usuário
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Senha
                    </label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Para redefinir sua senha, utilize uma das contas de teste ou cadastre um novo e-mail.");
                      }}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>Lembrar minhas credenciais</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <span>Entrar no Sistema</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER FORM */}
            {activeTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Elton Rabelo"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cargo / Função Ágil
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                    >
                      <option value="Product Owner">Product Owner (PO)</option>
                      <option value="Scrum Master">Scrum Master (SM)</option>
                      <option value="Agile Coach">Agile Coach / GPM</option>
                      <option value="Desenvolvedor Lead">Desenvolvedor Lead</option>
                      <option value="QA / Testes">Analista de QA / Testes</option>
                      <option value="Engenheiro de Software">
                        Engenheiro de Software
                      </option>
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@empresa.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Confirmar
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Submit Register */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
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
          </div>
        )}
      </div>
    </div>
  );
};
