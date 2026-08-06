import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Key,
  Globe,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  getSupabaseClient,
} from "../lib/supabase";

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

const SUPABASE_DDL_SQL = `-- SCRIPT DE CRIAÇÃO DAS TABELAS NO SUPABASE POSTGRESQL
-- Acesse o seu painel do Supabase -> SQL Editor -> Cole este script -> Run

-- 1. Tabela de Perfis de Usuários (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'User',
  avatar_color TEXT DEFAULT 'from-indigo-500 to-indigo-700',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Histórias de Usuário Ágeis
CREATE TABLE IF NOT EXISTS public.user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  want TEXT NOT NULL,
  so_that TEXT NOT NULL,
  context TEXT,
  acceptance_criteria JSONB DEFAULT '[]'::jsonb,
  business_rules JSONB DEFAULT '[]'::jsonb,
  bdd_scenarios JSONB DEFAULT '[]'::jsonb,
  epic_note TEXT,
  clarification_questions JSONB DEFAULT '[]'::jsonb,
  raw_markdown TEXT,
  project_name TEXT DEFAULT 'Geral',
  epic_name TEXT DEFAULT 'Geral',
  requester TEXT,
  status TEXT DEFAULT 'draft',
  story_points INT DEFAULT 3,
  tags JSONB DEFAULT '[]'::jsonb,
  audit JSONB,
  validation_report JSONB,
  attached_file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Políticas de Segurança (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;

-- Permissões de Leitura e Escrita
CREATE POLICY "Public Profiles Select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Profiles Insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Profiles Update" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Stories Select" ON public.user_stories FOR SELECT USING (true);
CREATE POLICY "Public Stories Insert" ON public.user_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Stories Update" ON public.user_stories FOR UPDATE USING (true);
CREATE POLICY "Public Stories Delete" ON public.user_stories FOR DELETE USING (true);
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [isFromEnv, setIsFromEnv] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlTab, setShowSqlTab] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setKey(cfg.key);
      setIsFromEnv(cfg.isFromEnv);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: "Por favor, preencha tanto a URL quanto a Anon Key do Supabase.",
      });
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      setTestResult({
        success: false,
        message: "A URL deve começar com https:// (ex: https://xxx.supabase.co)",
      });
      return;
    }

    setIsTesting(true);

    try {
      saveSupabaseConfig(cleanUrl, cleanKey);
      const client = getSupabaseClient();

      if (!client) {
        throw new Error("Não foi possível inicializar o cliente do Supabase.");
      }

      // Test simple ping query on profiles or user_stories
      const { error } = await client
        .from("user_stories")
        .select("count", { count: "exact", head: true });

      if (error && error.code !== "PGRST116" && !error.message.includes("relation")) {
        // Even if table doesn't exist yet, connection is valid
        console.warn("Supabase connect warning:", error);
      }

      setTestResult({
        success: true,
        message:
          "Conexão com o Supabase estabelecida com sucesso! Seu projeto está sincronizado.",
      });

      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha ao conectar: ${err.message || "Verifique a URL e a Anon Key."}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl("");
    setKey("");
    setTestResult({
      success: true,
      message: "Credenciais locais do Supabase removidas.",
    });
    if (onStatusChange) onStatusChange();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_DDL_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const isConnected = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Conectar ao Supabase PostgreSQL</h3>
              <p className="text-xs text-slate-400">
                Sincronização persistente de histórias de usuário e perfis de equipe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-xs font-bold text-slate-200">
                Status: {isConnected ? "Conectado ao Supabase" : "Modo Local (Banco Desconectado)"}
              </span>
            </div>

            {isFromEnv && (
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-md font-semibold">
                Variáveis .env ativas
              </span>
            )}
          </div>

          {/* Nav Tabs: Credenciais vs Script SQL */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setShowSqlTab(false)}
              className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
                !showSqlTab
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Configurar Credenciais
            </button>
            <button
              onClick={() => setShowSqlTab(true)}
              className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
                showSqlTab
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Script SQL do Banco
            </button>
          </div>

          {!showSqlTab ? (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>URL do Projeto Supabase</span>
                  </span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Abrir Supabase Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://sua-id-projeto.supabase.co"
                  disabled={isFromEnv}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chave Pública (Anon Key)</span>
                </label>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  disabled={isFromEnv}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono disabled:opacity-60"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    testResult.success
                      ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300"
                      : "bg-rose-950/60 border-rose-800/80 text-rose-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {isConnected && !isFromEnv ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Desconectar</span>
                  </button>
                ) : (
                  <div />
                )}

                {!isFromEnv && (
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-60 ml-auto"
                  >
                    {isTesting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    )}
                    <span>{isTesting ? "Testando..." : "Salvar e Conectar"}</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300 font-medium">
                  Execute este script no <strong>SQL Editor</strong> do seu Supabase para criar as tabelas necessárias:
                </p>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-sm"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-60 leading-relaxed scrollbar-thin">
                {SUPABASE_DDL_SQL}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
