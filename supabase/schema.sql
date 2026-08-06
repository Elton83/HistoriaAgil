-- ====================================================================
-- SCRIPT DE MIGRACAO SQL COMPLETO PARA SUPABASE / POSTGRESQL
-- PROJETO: HISTORIAS AGEIS - GERADOR E BACKLOG DE HISTORIAS DE USUARIO
-- ====================================================================

-- 1. Habilitar extensao para geracao de UUIDs v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuarios (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Product Owner',
    avatar_color TEXT DEFAULT 'from-indigo-500 to-indigo-700',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca performatica por e-mail de usuario
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Tabela de Historias de Usuario (user_stories)
CREATE TABLE IF NOT EXISTS public.user_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    project_name TEXT NOT NULL,
    epic_name TEXT NOT NULL,
    requester TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    story_points INTEGER DEFAULT 3,
    tags TEXT[] DEFAULT '{}',
    audit JSONB,
    validation_report JSONB,
    attached_file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_status CHECK (status IN ('draft', 'refinement', 'ready', 'in_progress', 'done'))
);

-- Indices para otimizacao de consultas e filtros
CREATE INDEX IF NOT EXISTS idx_user_stories_user_id ON public.user_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_status ON public.user_stories(status);
CREATE INDEX IF NOT EXISTS idx_user_stories_created_at ON public.user_stories(created_at DESC);

-- 4. Funcao e Triggers para Atualizacao Automatica de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_user_stories_updated_at ON public.user_stories;
CREATE TRIGGER trg_user_stories_updated_at
BEFORE UPDATE ON public.user_stories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Configuracao de Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;

-- Politicas permissivas para leitura e escrita publica / anonima ou autenticada (ideal para aplicacao SPA com Supabase Anon Key)
DROP POLICY IF EXISTS "Permitir leitura publica de perfis" ON public.profiles;
CREATE POLICY "Permitir leitura publica de perfis" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao e atualizacao publica de perfis" ON public.profiles;
CREATE POLICY "Permitir insercao e atualizacao publica de perfis" 
ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de historias de usuario" ON public.user_stories;
CREATE POLICY "Permitir leitura de historias de usuario" 
ON public.user_stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de historias de usuario" ON public.user_stories;
CREATE POLICY "Permitir insercao de historias de usuario" 
ON public.user_stories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir edicao de historias de usuario" ON public.user_stories;
CREATE POLICY "Permitir edicao de historias de usuario" 
ON public.user_stories FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusao de historias de usuario" ON public.user_stories;
CREATE POLICY "Permitir exclusao de historias de usuario" 
ON public.user_stories FOR DELETE USING (true);

-- 6. Dados Iniciais de Exemplo (Opcional)
INSERT INTO public.profiles (id, email, name, role, avatar_color)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'elton.rabelo@agile.com', 'Elton Rabelo', 'Product Owner / GPM', 'from-indigo-500 to-indigo-700'),
    ('00000000-0000-0000-0000-000000000002', 'ana.costa@agile.com', 'Ana Paula Costa', 'Scrum Master & Agile Coach', 'from-emerald-500 to-teal-700')
ON CONFLICT (email) DO NOTHING;
