# Documentação Técnica e Funcional do Sistema
## Gerador de Histórias de Usuário e Estúdio de Engenharia de Requisitos Ágeis (Agile Requirements Studio)

---

### 1. Visão Geral do Produto (Executive Summary)

O **Agile Requirements Studio** é uma plataforma corporativa Full-Stack voltada para Engenharia de Requisitos Ágeis, Refinamento de Backlog e Governança de Ciclo de Vida de Software (Scrum / Kanban / Homologação). 

A plataforma transforma ideias, rascunhos, transcrições de reuniões, anexos multimídia (áudio, vídeo, imagens, documentos PDF/DOCX) em **Histórias de Usuário estruturadas**, contendo:
- Narrativa padrão ConOps (*Como [Papel], Quero [Ação], Para que [Benefício]*).
- Critérios de Aceitação (*ACs*) numerados e testáveis.
- Regras de Negócio (*RNs*) detalhadas com validações de exceção.
- Cenários de Teste BDD (*Gherkin: Dado, Quando, Então*).
- Análise de Qualidade INVEST com pontuação automática (0 a 100).
- Planejamento e dimensionamento de esforço via **Planning Poker** colaborativo (Fibonacci, T-Shirt, Sequencial) integrado a IA Coach.
- Esteira de Homologação em 8 etapas (Gatekeeper de Release e Quality Assurance).
- Gestão de prazos (*Due Dates*) com classificação de urgência e alertas de atraso.
- Governança de Acesso com controle baseado em perfis (RBAC - Role-Based Access Control) e persistência em nuvem (PostgreSQL / Supabase).

---

### 2. Arquitetura do Sistema

O sistema segue uma arquitetura moderna Full-Stack em camadas:

```
+-------------------------------------------------------------------+
|                        CAMADA CLIENTE (SPA)                       |
|  React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons       |
|  - Gerador Ágil & Studio de Requisitos (Editor Reativo)           |
|  - Quadro Kanban com Filtros de Urgência & Prazos                 |
|  - Mesa Interativa de Planning Poker (Squad Simulation + AI)      |
|  - Esteira de Homologação (8-Step Quality Gate)                   |
|  - Relatórios & Analytics de Story Points e Maturidade            |
|  - Painel de Governança e Administração RBAC                      |
+---------------------------------+---------------------------------+
                                  | HTTP / JSON REST
                                  v
+-------------------------------------------------------------------+
|                     CAMADA BACKEND (Express / Node.js)            |
|  - Proxy Seguro de APIs de IA (Gemini 3.7 / OpenAI GPT-4o)       |
|  - Motores de Heurística e Fallback de Contingência Offline       |
|  - Auditoria de Qualidade INVEST e Validação de Requisitos        |
|  - Endpoint de Estimativa e Simulação de Poker Squad              |
+---------------------------------+---------------------------------+
                                  | Driver PostgreSQL / REST
                                  v
+-------------------------------------------------------------------+
|                 CAMADA DE PERSISTÊNCIA & NUVEM                    |
|  - Supabase PostgreSQL (Tabelas 'user_stories', 'profiles')       |
|  - LocalStorage Caching & Sincronização Bidirecional Offline/Online|
+-------------------------------------------------------------------+
```

---

### 3. Modelagem de Dados e Schemas TypeScript (`src/types.ts`)

#### 3.1. Entidade Principal: `UserStory`
```typescript
export interface UserStory {
  id: string;
  projectName: string;
  epicName: string;
  title: string;
  context?: string;
  dueDate?: string; // Formato YYYY-MM-DD
  story: {
    role: string;   // Como [papel]
    want: string;   // Quero [ação/funcionalidade]
    soThat: string; // Para que [benefício de negócio]
  };
  acceptanceCriteria: AcceptanceCriterion[];
  businessRules: BusinessRule[];
  bddScenarios: BddScenario[];
  tags: string[];
  status: StoryStatus; // "draft" | "refinement" | "ready" | "in_progress" | "done"
  createdAt: string;   // ISO-8601
  updatedAt: string;   // ISO-8601
  storyPoints?: number; // Ex: 1, 2, 3, 5, 8, 13, 20
  tShirtSize?: "PP" | "P" | "M" | "G" | "GG";
  priority?: "low" | "medium" | "high" | "critical";
  investAudit?: InvestAudit;
  homologationChecklist?: HomologationItem[];
}
```

#### 3.2. Sub-estruturas de Requisitos
```typescript
export interface AcceptanceCriterion {
  id: string;
  text: string;
}

export interface BusinessRule {
  id: string;
  text: string;
}

export interface BddScenario {
  id: string;
  title: string;
  given: string;
  when: string;
  then: string;
}

export interface HomologationItem {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  responsibleRole: string; // Ex: "Product Owner", "Tech Lead", "QA", "DevOps"
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}
```

#### 3.3. Planning Poker e Estimativa
```typescript
export type PokerDeckType = "fibonacci" | "tshirt" | "sequential";

export interface PokerCard {
  value: number | string;
  label: string;
  description: string;
  colorClass?: string;
}

export interface SquadMemberEstimate {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  hasVoted: boolean;
  vote: string | number | null;
  comment?: string;
}

export interface PokerAIEstimateResult {
  suggestedPoints: number;
  suggestedTshirt: "PP" | "P" | "M" | "G" | "GG";
  confidence: "Alta" | "Média" | "Baixa";
  justification: string;
  breakdown: {
    uiComplexity: { score: number; note: string };
    backendComplexity: { score: number; note: string };
    integrationRisk: { score: number; note: string };
    testEffort: { score: number; note: string };
  };
  keyQuestions: string[];
  squadVotes?: Array<{ name: string; role: string; vote: number; comment: string }>;
}
```

#### 3.4. Controle de Prazos e Alertas
```typescript
export type DeadlineCategory = "overdue" | "due_today" | "due_soon" | "on_track" | "no_date";

export interface DeadlineStatus {
  status: DeadlineCategory;
  daysRemaining: number;
  label: string;
  badgeClass: string;
  borderClass: string;
  textClass: string;
}
```

---

### 4. Especificação dos Endpoints Backend (`server.ts`)

O servidor Express escuta na porta `3000` (host `0.0.0.0`) e gerencia a comunicação segura com provedores LLM:

| Método | Rota | Descrição | Payload de Entrada | Retorno Principal |
|---|---|---|---|---|
| `GET` | `/api/health` | Verificação de integridade do servidor | N/A | `{ status: "ok", timestamp: "..." }` |
| `GET` | `/api/providers-status` | Status de ativação das chaves Gemini/OpenAI | N/A | `{ geminiAvailable: boolean, openaiAvailable: boolean, ... }` |
| `POST` | `/api/generate-story` | Geração completa de história a partir de contexto | `{ projectName, epicName, context, provider, model, images, dueDate }` | Objeto `UserStory` completo em JSON |
| `POST` | `/api/refine-story` | Refinamento cirúrgico de AC, RN ou BDD existente | `{ currentStory, instruction, focusArea, provider, model }` | Objeto `UserStory` atualizado |
| `POST` | `/api/audit-invest` | Auditoria de maturidade INVEST | `{ story, provider, model }` | `{ totalScore, scoreIndependent, scoreNegotiable, ... recommendations }` |
| `POST` | `/api/poker-ai-estimate` | Análise de esforço técnico e simulação de votos | `{ story, provider, model }` | Objeto `PokerAIEstimateResult` com breakdown e pontos |

#### Mecanismos de Alta Disponibilidade e Fallback:
1. **Gemini 3.7 / 2.5 First**: O backend tenta inicialmente a chamada à API oficial do Google Gemini (`@google/genai`).
2. **OpenAI Failover**: Caso a chave OpenAI esteja configurada e ocorra falha ou timeout, o sistema direciona automaticamente para modelos GPT (`gpt-4o`, `gpt-4o-mini`).
3. **Deterministic Heuristic Engine**: Caso nenhuma chave esteja configurada ou haja instabilidade de rede externa, o sistema aciona um motor heurístico baseado em Processamento de Linguagem Natural local, garantindo que o usuário nunca fique bloqueado.

---

### 5. Módulos e Funcionalidades do Frontend

#### 5.1. Gerador Ágil (`src/components/GeneratorStudio.tsx`)
- **Entrada de Requisitos**: Campo de contexto com presets de mercado (E-commerce, Fintech, CRM, Healthtech, Logística).
- **Processamento Multimodal**: Upload de arquivos (PDF, DOCX, TXT, imagens com OCR/Visão Computacional) e gravação de vídeo/áudio com transcrição integrada.
- **Seletor de Modelos de IA**: Permite alternar entre Google Gemini (Gemini 3.7 Flash, 2.5 Flash, 2.5 Pro) e OpenAI (GPT-4o, GPT-4o-mini).
- **Editor Estruturado**: Edição dinâmica com adição, remoção e reordenação de Critérios de Aceitação, Regras de Negócio e Cenários BDD em tempo real.
- **Gestão de Prazos (*Due Date*)**: Calendário com cálculo de dias restantes e avisos visuais de urgência.
- **Exportação Executiva**: Download da História em **PDF formatado** (com cabeçalhos, tabelas de critérios e assinatura), JSON ou texto Markdown.

#### 5.2. Quadro Backlog Kanban (`src/components/BacklogKanban.tsx`)
- **Colunas do Fluxo**:
  1. *Rascunho (Draft)*
  2. *Em Refinamento (Refinement)*
  3. *Pronto pra Sprint (Ready)*
  4. *Em Desenvolvimento (In Progress)*
  5. *Concluído (Done)*
- **Filtros Avançados**: Busca textual, filtro por Projeto, Épico, Tags e **Filtro de Prazos** (*Atrasadas*, *Vencem Hoje*, *Vencem em Breve*).
- **Arrastar e Soltar / Movimentação Rápida**: Atualização instantânea de status com sincronização no banco.

#### 5.3. Planning Poker & Classificação Ágil (`src/components/PlanningPokerView.tsx`)
- **Múltiplos Baralhos**:
  - *Fibonacci Oficial*: 0, 1, 2, 3, 5, 8, 13, 20, 40, 100, ? (Dúvida) e ☕ (Pausa/Café).
  - *T-Shirt Sizing*: PP, P, M, G, GG.
  - *Sequencial*: 1 a 10.
- **Simulação Realista do Squad**: Votação distribuída entre Tech Lead, Dev Backend, Dev Frontend, QA Specialist e Product Owner.
- **Assistente de Estimativa IA**: Decomposição em 4 eixos de complexidade (UI, Backend, Integrações, QA) e recomendação de perguntas-chave para a reunião de planning.
- **Detecção de Consenso**: Cálculo de divergência, média dos votos e aplicação direta dos Story Points na história.

#### 5.4. Esteira de Homologação em 8 Passos (`src/components/HomologationPipelineView.tsx`)
Garante o cumprimento das etapas obrigatórias de liberação para produção:
1. **Passo 01**: Homologar com o usuário final (Validação de Aceite).
2. **Passo 02**: Integrar com a *branch* Staging.
3. **Passo 03**: Revisão de Q.A em Ambiente Staging.
4. **Passo 04**: Integrar com a *branch* Main (Produção).
5. **Passo 05**: Revisão de Q.A em Ambiente de Produção.
6. **Passo 06**: Executar scripts de banco de dados e migrações.
7. **Passo 07**: Cadastrar avisos de novidades e release notes no sistema.
8. **Passo 08**: Comunicar partes interessadas (Stakeholders e Usuários).

#### 5.5. Relatórios & Analytics (`src/components/ReportsView.tsx`)
- Gráficos de distribuição de Story Points e capacidade total do Backlog.
- Matriz de maturidade e conformidade INVEST.
- Indicadores de eficiência e cumprimento de prazos.
- Exportação completa da base de histórias em formato **CSV / Planilha**.

#### 5.6. Painel de Governança e RBAC (`src/components/AdminPanel.tsx`)
- **Perfis de Usuário Suportados**:
  - `Administrador / GPM`: Acesso irrestrito a configurações, sincronização e auditoria.
  - `Product Owner (PO)`: Criação, edição e aprovação de requisitos.
  - `Tech Lead / Arquiteto`: Estimativas técnicas e aprovação de pipelines.
  - `Desenvolvedor (Dev)`: Movimentação no Kanban e execução de tarefas.
  - `QA Engineer`: Validação de cenários BDD e esteira de testes.
- Logs de auditoria com rastreamento de ações no sistema.

---

### 6. Persistência em Banco de Dados (Supabase PostgreSQL)

O sistema suporta integração nativa com o **Supabase**:

#### Tabela `user_stories`:
```sql
CREATE TABLE IF NOT EXISTS user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  epic_name TEXT NOT NULL,
  title TEXT NOT NULL,
  context TEXT,
  due_date TEXT,
  story_role TEXT NOT NULL,
  story_want TEXT NOT NULL,
  story_so_that TEXT NOT NULL,
  acceptance_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  business_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  bdd_scenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  story_points INTEGER,
  t_shirt_size TEXT,
  priority TEXT DEFAULT 'medium',
  invest_audit JSONB,
  homologation_checklist JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 7. Validação de Regras Ágeis e Qualidade (`src/utils/storyValidator.ts`)

O motor de validação audita automaticamente cada história contra 12 regras de qualidade:
1. **Regra de Título Claro**: Título com verbo de ação e tamanho mínimo.
2. **Tríade ConOps**: Papel, Ação e Benefício de negócio válidos e preenchidos.
3. **Critérios de Aceitação Mínimos**: Pelo menos 2 critérios de aceitação testáveis.
4. **Regras de Negócio**: Presença de regras delimitando fluxos alternativos e validações.
5. **Cenários BDD (Gherkin)**: Sintaxe estruturada em *Dado (Given)*, *Quando (When)*, *Então (Then)*.
6. **Classificação de Esforço**: Verificação de Story Points ou tamanho T-Shirt atribuído.
7. **Prazos Válidos**: Verificação de consistência da data de entrega (*Due Date*).

---

### 8. Prompt Engineering e Contratos de IA

Os prompts enviados para os modelos de IA exigem estritamente retorno em formato **JSON Schema padronizado**, com temperatura baixa (`0.2`) para máxima determinismo e precisão metodológica:

```json
{
  "title": "String com verbo no infinitivo",
  "projectName": "Nome do Projeto",
  "epicName": "Nome do Épico",
  "story": {
    "role": "Papel do usuário",
    "want": "Ação desejada",
    "soThat": "Benefício de negócio"
  },
  "acceptanceCriteria": [
    { "id": "ac-1", "text": "Critério verificável" }
  ],
  "businessRules": [
    { "id": "rn-1", "text": "Regra mandatória" }
  ],
  "bddScenarios": [
    {
      "id": "bdd-1",
      "title": "Cenário de Sucesso",
      "given": "Estado inicial",
      "when": "Ação executada",
      "then": "Resultado esperado"
    }
  ]
}
```

---

### 9. Resumo para Validação em Outras IAs

Para validar a integridade técnica desta solução em qualquer LLM externo (como ChatGPT, Claude, DeepSeek, etc.), utilize o seguinte resumo conceitual:

> **Resumo Arquitetural para Avaliação:**
> "Trata-se de uma aplicação corporativa Full-Stack (React 18 + Node.js Express + Supabase PostgreSQL) para gestão de requisitos ágeis e governança de software. O sistema contempla: Gerador Multimodal com OCR e IA (Gemini 3.7 / GPT-4o), Validador INVEST automatizado, Quadro Kanban com controle de prazos e urgência, Esteira de Homologação em 8 etapas com RBAC, Módulo colaborativo de Planning Poker com múltiplos baralhos (Fibonacci, T-Shirt, Sequencial) e estimativa por IA em 4 eixos, além de exportação em PDF executivo e sincronização bidirecional em nuvem."
