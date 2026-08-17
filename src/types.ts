export type StoryStatus = 'draft' | 'refinement' | 'ready' | 'in_progress' | 'done';

export interface AcceptanceCriterion {
  id: string;
  text: string;
  done?: boolean;
}

export interface BusinessRule {
  id: string;
  text: string;
}

export interface BddScenario {
  title: string;
  given: string;
  when: string;
  then: string;
}

export interface InvestCriterion {
  criterion: string;
  status: 'pass' | 'warning' | 'fail';
  feedback: string;
}

export interface InvestAudit {
  score: number;
  investChecklist: InvestCriterion[];
  recommendations: string[];
  estimatedStoryPoints?: number;
}

export interface ValidationTest {
  id: string;
  name: string;
  category: 'estrutura' | 'criterios' | 'bdd' | 'regras' | 'ambiguidade' | 'invest';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
}

export interface ValidationReport {
  totalTests: number;
  passedCount: number;
  warningsCount: number;
  failedCount: number;
  scorePercent: number;
  tests: ValidationTest[];
  evaluatedAt: string;
}

export interface HomologationItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export const DEFAULT_HOMOLOGATION_STEPS: string[] = [
  "Homologar com usuário",
  "Integrar ao Staging",
  "Revisão Q.A (Opcional)",
  "Integrar ao Main",
  "Revisão Q.A (Opcional)",
  "Execução de Script",
  "Cadastrar Avisos no Sistema",
  "Comunicar Interessados",
];

export interface UserStory {
  id: string;
  title: string;
  story: {
    role: string;
    want: string;
    soThat: string;
  };
  context: string;
  acceptanceCriteria: AcceptanceCriterion[];
  businessRules: BusinessRule[];
  bddScenarios: BddScenario[];
  epicNote?: string;
  clarificationQuestions?: string[];
  rawMarkdown: string;
  projectName: string;
  epicName: string;
  requester?: string;
  status: StoryStatus;
  storyPoints?: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  dueDate?: string; // Formato YYYY-MM-DD
  assignee?: string;
  tShirtSize?: 'PP' | 'P' | 'M' | 'G' | 'GG' | string;
  audit?: InvestAudit;
  validationReport?: ValidationReport;
  attachedFileName?: string;
  homologationChecklist?: HomologationItem[];
  usedProvider?: LLMProvider;
  usedModel?: string;
}

export type PokerDeckType = 'fibonacci' | 'tshirt' | 'sequential';

export interface PokerCard {
  value: string | number;
  label: string;
  description?: string;
  pointsNumeric?: number;
  color?: string;
}

export interface SquadMemberEstimate {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  isAI?: boolean;
  vote?: string | number | null;
  hasVoted: boolean;
  comment?: string;
}

export interface PokerAIEstimateResult {
  suggestedPoints: number;
  suggestedTshirt: 'PP' | 'P' | 'M' | 'G' | 'GG';
  confidence: 'Alta' | 'Média' | 'Baixa';
  justification: string;
  breakdown: {
    uiComplexity: { score: number; note: string };
    backendComplexity: { score: number; note: string };
    integrationRisk: { score: number; note: string };
    testEffort: { score: number; note: string };
  };
  keyQuestions?: string[];
  squadVotes?: Array<{
    name: string;
    role: string;
    vote: number | string;
    comment: string;
  }>;
}

export const FIBONACCI_DECK: PokerCard[] = [
  { value: 0, label: "0", description: "Sem esforço / Trivial já implementado", pointsNumeric: 0, color: "from-slate-600 to-slate-700" },
  { value: 1, label: "1", description: "Extremamente simples, 1-2 horas", pointsNumeric: 1, color: "from-emerald-700 to-emerald-800" },
  { value: 2, label: "2", description: "Simples, pouca incerteza", pointsNumeric: 2, color: "from-teal-700 to-teal-800" },
  { value: 3, label: "3", description: "Pequeno, bem compreendido", pointsNumeric: 3, color: "from-cyan-700 to-cyan-800" },
  { value: 5, label: "5", description: "Médio, esforço padrão de Sprint", pointsNumeric: 5, color: "from-blue-700 to-blue-800" },
  { value: 8, label: "8", description: "Complexo, requer atenção técnica", pointsNumeric: 8, color: "from-indigo-700 to-indigo-800" },
  { value: 13, label: "13", description: "Muito complexo, considerar quebrar", pointsNumeric: 13, color: "from-violet-700 to-violet-800" },
  { value: 20, label: "20", description: "Alto risco / Quase um Épico", pointsNumeric: 20, color: "from-amber-700 to-amber-800" },
  { value: 40, label: "40", description: "Gigante / Dividir obrigatoriamente", pointsNumeric: 40, color: "from-orange-700 to-orange-800" },
  { value: 100, label: "100", description: "Épico completo / Inviável em 1 Sprint", pointsNumeric: 100, color: "from-rose-700 to-rose-800" },
  { value: "?", label: "?", description: "Incerteza crítica / Bloqueio", color: "from-purple-800 to-purple-950" },
  { value: "☕", label: "☕", description: "Pausa necessária / Tomar café", color: "from-amber-800 to-amber-950" },
];

export const TSHIRT_DECK: PokerCard[] = [
  { value: "PP", label: "PP", description: "Extra Pequeno (~1 pt)", pointsNumeric: 1, color: "from-emerald-700 to-emerald-800" },
  { value: "P", label: "P", description: "Pequeno (~2-3 pts)", pointsNumeric: 3, color: "from-cyan-700 to-cyan-800" },
  { value: "M", label: "M", description: "Médio (~5 pts)", pointsNumeric: 5, color: "from-blue-700 to-blue-800" },
  { value: "G", label: "G", description: "Grande (~8-13 pts)", pointsNumeric: 8, color: "from-indigo-700 to-indigo-800" },
  { value: "GG", label: "GG", description: "Extra Grande (~20+ pts)", pointsNumeric: 20, color: "from-rose-700 to-rose-800" },
  { value: "?", label: "?", description: "Incerteza / Dúvidas", color: "from-purple-800 to-purple-950" },
];

export const SEQUENTIAL_DECK: PokerCard[] = [
  { value: 1, label: "1", description: "Muito Baixo", pointsNumeric: 1, color: "from-emerald-700 to-emerald-800" },
  { value: 2, label: "2", description: "Baixo", pointsNumeric: 2, color: "from-teal-700 to-teal-800" },
  { value: 3, label: "3", description: "Baixo-Médio", pointsNumeric: 3, color: "from-cyan-700 to-cyan-800" },
  { value: 4, label: "4", description: "Médio", pointsNumeric: 4, color: "from-blue-700 to-blue-800" },
  { value: 5, label: "5", description: "Médio Padrão", pointsNumeric: 5, color: "from-indigo-700 to-indigo-800" },
  { value: 6, label: "6", description: "Médio-Alto", pointsNumeric: 6, color: "from-violet-700 to-violet-800" },
  { value: 7, label: "7", description: "Alto", pointsNumeric: 7, color: "from-purple-700 to-purple-800" },
  { value: 8, label: "8", description: "Muito Alto", pointsNumeric: 8, color: "from-amber-700 to-amber-800" },
  { value: 9, label: "9", description: "Crítico", pointsNumeric: 9, color: "from-orange-700 to-orange-800" },
  { value: 10, label: "10", description: "Máxima Complexidade", pointsNumeric: 10, color: "from-rose-700 to-rose-800" },
];

export type DeadlineStatus = 'overdue' | 'due_today' | 'due_soon' | 'on_track' | 'no_date';

export function getStoryDeadlineStatus(dueDate?: string): {
  status: DeadlineStatus;
  label: string;
  daysRemaining?: number;
  badgeClass: string;
} {
  if (!dueDate) {
    return {
      status: 'no_date',
      label: 'Sem prazo',
      badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDate.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      status: 'overdue',
      label: daysOverdue === 1 ? 'Atrasada (1 dia)' : `Atrasada (${daysOverdue} dias)`,
      daysRemaining: diffDays,
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-600/80 animate-pulse shadow-sm shadow-rose-950',
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Vence Hoje!',
      daysRemaining: 0,
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500 font-bold animate-pulse shadow-sm shadow-amber-950',
    };
  } else if (diffDays <= 3) {
    return {
      status: 'due_soon',
      label: diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dias`,
      daysRemaining: diffDays,
      badgeClass: 'bg-orange-950/70 text-orange-300 border-orange-600/70',
    };
  } else {
    return {
      status: 'on_track',
      label: `Prazo: ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`,
      daysRemaining: diffDays,
      badgeClass: 'bg-slate-800/90 text-indigo-300 border-slate-700/80',
    };
  }
}

export type LLMProvider = 'gemini' | 'openai';

export interface LLMModelOption {
  id: string;
  name: string;
  provider: LLMProvider;
  providerLabel: string;
  description: string;
  badge?: string;
  isVisionCapable: boolean;
}

export const AVAILABLE_MODELS: LLMModelOption[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "gemini",
    providerLabel: "Google AI",
    description: "Altíssima velocidade, excelente em contexto ágil e análise de imagens anexadas",
    badge: "Recomendado",
    isVisionCapable: true,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "gemini",
    providerLabel: "Google AI",
    description: "Raciocínio avançado e decomposição de regras de negócio altamente complexas",
    badge: "Raciocínio Pro",
    isVisionCapable: true,
  },
  {
    id: "gpt-4o-mini",
    name: "ChatGPT - GPT-4o Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    description: "Rápido, conciso e com excelente escrita para critérios e cenários Gherkin",
    badge: "OpenAI Ágil",
    isVisionCapable: true,
  },
  {
    id: "gpt-4o",
    name: "ChatGPT - GPT-4o",
    provider: "openai",
    providerLabel: "OpenAI",
    description: "Modelo topo de linha da OpenAI, precisão máxima para regras corporativas e BDD",
    badge: "OpenAI Flagship",
    isVisionCapable: true,
  },
];

export interface ProvidersStatus {
  gemini: {
    available: boolean;
    models: string[];
  };
  openai: {
    available: boolean;
    models: string[];
  };
}

export interface ContextPreset {
  id: string;
  title: string;
  category: string;
  projectName: string;
  epicName: string;
  contextText: string;
}
