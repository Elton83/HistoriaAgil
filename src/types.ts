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
  audit?: InvestAudit;
  validationReport?: ValidationReport;
  attachedFileName?: string;
  homologationChecklist?: HomologationItem[];
}

export interface ContextPreset {
  id: string;
  title: string;
  category: string;
  projectName: string;
  epicName: string;
  contextText: string;
}
