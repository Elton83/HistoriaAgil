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
  audit?: InvestAudit;
  validationReport?: ValidationReport;
  attachedFileName?: string;
  homologationChecklist?: HomologationItem[];
  usedProvider?: LLMProvider;
  usedModel?: string;
}

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
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    providerLabel: "Google AI",
    description: "Altíssima velocidade, excelente em contexto ágil e análise de imagens anexadas",
    badge: "Recomendado",
    isVisionCapable: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
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
