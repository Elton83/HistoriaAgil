import React, { useState } from "react";
import {
  UserStory,
  HomologationItem,
  DEFAULT_HOMOLOGATION_STEPS,
} from "../types";
import { generateStoryPDF } from "../utils/pdfExporter";
import {
  Workflow,
  Search,
  Filter,
  Layers,
  Sparkles,
  RotateCcw,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Users,
  GitPullRequest,
  CheckSquare,
  Terminal,
  Bell,
  MessageSquare,
  FileDown,
  FileEdit,
  Trash2,
  ListChecks,
  CheckCircle2,
  Circle,
  Plus,
  X,
  FileText,
  Download,
} from "lucide-react";

interface HomologationPipelineViewProps {
  stories: UserStory[];
  onUpdateStory: (updatedStory: UserStory) => void;
  onSelectStoryForGenerator?: (story: UserStory) => void;
  onDeleteStory?: (storyId: string) => void;
}

// 8 Homologation Columns matching the 8 steps
const PIPELINE_COLUMNS = [
  { id: 0, title: "1. Homologar Usuário", shortTitle: "Usuário", color: "border-amber-500/50", badgeBg: "bg-amber-500/20 text-amber-300", icon: Users },
  { id: 1, title: "2. Integrar Staging", shortTitle: "Staging", color: "border-indigo-500/50", badgeBg: "bg-indigo-500/20 text-indigo-300", icon: GitPullRequest },
  { id: 2, title: "3. Revisão Q.A (Staging)", shortTitle: "Q.A Staging", color: "border-purple-500/50", badgeBg: "bg-purple-500/20 text-purple-300", icon: ShieldCheck },
  { id: 3, title: "4. Integrar ao Main", shortTitle: "Main", color: "border-cyan-500/50", badgeBg: "bg-cyan-500/20 text-cyan-300", icon: Workflow },
  { id: 4, title: "5. Revisão Q.A (Main)", shortTitle: "Q.A Main", color: "border-blue-500/50", badgeBg: "bg-blue-500/20 text-blue-300", icon: ShieldCheck },
  { id: 5, title: "6. Executar Script", shortTitle: "Script", color: "border-orange-500/50", badgeBg: "bg-orange-500/20 text-orange-300", icon: Terminal },
  { id: 6, title: "7. Cadastrar Avisos", shortTitle: "Avisos", color: "border-pink-500/50", badgeBg: "bg-pink-500/20 text-pink-300", icon: Bell },
  { id: 7, title: "8. Comunicado / Concluído", shortTitle: "Publicado", color: "border-emerald-500/50", badgeBg: "bg-emerald-500/20 text-emerald-300", icon: MessageSquare },
];

export const HomologationPipelineView: React.FC<HomologationPipelineViewProps> = ({
  stories,
  onUpdateStory,
  onSelectStoryForGenerator,
  onDeleteStory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeModalStory, setActiveModalStory] = useState<UserStory | null>(null);
  const [newItemText, setNewItemText] = useState("");

  // Helper to get or initialize homologation checklist for a story
  const getStoryChecklist = (story: UserStory): HomologationItem[] => {
    if (story.homologationChecklist && story.homologationChecklist.length > 0) {
      return story.homologationChecklist;
    }
    return DEFAULT_HOMOLOGATION_STEPS.map((label, idx) => ({
      id: `default-${idx}-${story.id}`,
      label,
      completed: false,
    }));
  };

  // Helper to determine which column index a story belongs to
  // It lands on the index of the FIRST uncompleted step (0 to 7)
  // If all 8 steps are completed, it lands on step 7 (Concluído)
  const getStoryColumnIndex = (story: UserStory): number => {
    const list = getStoryChecklist(story);
    const firstUncompleted = list.findIndex((item) => !item.completed);
    if (firstUncompleted === -1) {
      return 7; // All completed
    }
    // Cap index at 7 if list has more custom items
    return Math.min(firstUncompleted, 7);
  };

  // Extract unique projects for filtering
  const allProjects = Array.from(new Set(stories.map((s) => s.projectName || "Sem Projeto")));

  // Filtered stories
  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.story.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = selectedProject
      ? (s.projectName || "Sem Projeto") === selectedProject
      : true;

    return matchesSearch && matchesProject;
  });

  // Calculate overall progress across all stories
  const totalGlobalItems = stories.reduce((acc, s) => acc + getStoryChecklist(s).length, 0);
  const totalGlobalCompleted = stories.reduce(
    (acc, s) => acc + getStoryChecklist(s).filter((i) => i.completed).length,
    0
  );
  const globalProgress = totalGlobalItems > 0 ? Math.round((totalGlobalCompleted / totalGlobalItems) * 100) : 0;

  // Handler to set a story to a specific stage index (completes all previous steps up to targetIndex)
  const handleMoveToStage = (story: UserStory, targetIndex: number) => {
    const existing = getStoryChecklist(story);
    const updated = existing.map((item, idx) => {
      const shouldBeCompleted = idx < targetIndex;
      return {
        ...item,
        completed: shouldBeCompleted,
        completedAt: shouldBeCompleted
          ? item.completedAt || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : undefined,
      };
    });

    const updatedStory: UserStory = {
      ...story,
      homologationChecklist: updated,
      updatedAt: new Date().toISOString(),
    };

    onUpdateStory(updatedStory);
    if (activeModalStory && activeModalStory.id === story.id) {
      setActiveModalStory(updatedStory);
    }
  };

  // Handler to advance a story to the next step
  const handleAdvanceStep = (story: UserStory) => {
    const currentIdx = getStoryColumnIndex(story);
    const existing = getStoryChecklist(story);
    
    // If it's already on step 7 and not completed, completing step 7 finishes all
    const updated = existing.map((item, idx) => {
      if (idx <= currentIdx) {
        return {
          ...item,
          completed: true,
          completedAt: item.completedAt || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
      }
      return item;
    });

    const updatedStory: UserStory = {
      ...story,
      homologationChecklist: updated,
      updatedAt: new Date().toISOString(),
    };

    onUpdateStory(updatedStory);
    if (activeModalStory && activeModalStory.id === story.id) {
      setActiveModalStory(updatedStory);
    }
  };

  // Toggle single item in checklist modal
  const handleToggleChecklistItem = (story: UserStory, itemId: string) => {
    const existing = getStoryChecklist(story);
    const updated = existing.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.completed;
        return {
          ...item,
          completed: nextState,
          completedAt: nextState
            ? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            : undefined,
        };
      }
      return item;
    });

    const updatedStory: UserStory = {
      ...story,
      homologationChecklist: updated,
      updatedAt: new Date().toISOString(),
    };

    onUpdateStory(updatedStory);
    if (activeModalStory && activeModalStory.id === story.id) {
      setActiveModalStory(updatedStory);
    }
  };

  // Add custom step in checklist modal
  const handleAddChecklistItem = (story: UserStory, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;

    const existing = getStoryChecklist(story);
    const newItem: HomologationItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: newItemText.trim(),
      completed: false,
    };

    const updatedStory: UserStory = {
      ...story,
      homologationChecklist: [...existing, newItem],
      updatedAt: new Date().toISOString(),
    };

    onUpdateStory(updatedStory);
    if (activeModalStory && activeModalStory.id === story.id) {
      setActiveModalStory(updatedStory);
    }

    setNewItemText("");
  };

  // Delete item in checklist modal
  const handleDeleteChecklistItem = (story: UserStory, itemId: string) => {
    const existing = getStoryChecklist(story);
    const updated = existing.filter((i) => i.id !== itemId);

    const updatedStory: UserStory = {
      ...story,
      homologationChecklist: updated,
      updatedAt: new Date().toISOString(),
    };

    onUpdateStory(updatedStory);
    if (activeModalStory && activeModalStory.id === story.id) {
      setActiveModalStory(updatedStory);
    }
  };

  const handleMarkAllInModal = (story: UserStory, completed: boolean) => {
    const existing = getStoryChecklist(story);
    const updated = existing.map((item) => ({
      ...item,
      completed,
      completedAt: completed
        ? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : undefined,
    }));

    const updatedStory: UserStory = {
      ...story,
      homologationChecklist: updated,
      updatedAt: new Date().toISOString(),
    };

    onUpdateStory(updatedStory);
    if (activeModalStory && activeModalStory.id === story.id) {
      setActiveModalStory(updatedStory);
    }
  };

  const handleResetChecklistInModal = (story: UserStory) => {
    const defaultList: HomologationItem[] = DEFAULT_HOMOLOGATION_STEPS.map((label, idx) => ({
      id: `default-${idx}-${Date.now()}`,
      label,
      completed: false,
    }));

    const updatedStory: UserStory = {
      ...story,
      homologationChecklist: defaultList,
      updatedAt: new Date().toISOString(),
    };

    onUpdateStory(updatedStory);
    if (activeModalStory && activeModalStory.id === story.id) {
      setActiveModalStory(updatedStory);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `esteira_homologacao_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls (Matching Backlog Kanban design) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Workflow className="w-5 h-5 text-emerald-400" />
            <span>Quadro Esteira de Homologação & Release</span>
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe e movimente o fluxo de homologação das suas histórias ({stories.length} no pipeline)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Progress Pill */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">Progresso Geral:</span>
            <span className="text-emerald-400 font-bold">{globalProgress}%</span>
            <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar história ou papel..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Project Filter Tags */}
      {allProjects.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Projeto:</span>
          </span>
          <button
            onClick={() => setSelectedProject(null)}
            className={`px-2.5 py-1 rounded-lg border transition shrink-0 cursor-pointer ${
              selectedProject === null
                ? "bg-emerald-600 text-white border-emerald-500 font-semibold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Todos os Projetos ({stories.length})
          </button>
          {allProjects.map((project) => (
            <button
              key={project}
              onClick={() => setSelectedProject(project)}
              className={`px-2.5 py-1 rounded-lg border transition shrink-0 cursor-pointer ${
                selectedProject === project
                  ? "bg-emerald-600 text-white border-emerald-500 font-semibold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {project}
            </button>
          ))}
        </div>
      )}

      {/* Homologation Pipeline Board Columns (Matching Backlog Kanban layout) */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 min-w-[1400px]">
          {PIPELINE_COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const colStories = filteredStories.filter(
              (s) => getStoryColumnIndex(s) === col.id
            );

            return (
              <div
                key={col.id}
                className={`bg-slate-900/60 border ${col.color} rounded-2xl p-3 flex flex-col min-h-[520px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <ColumnIcon className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full truncate ${col.badgeBg}`}>
                      {col.shortTitle}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0 ml-1">
                    {colStories.length}
                  </span>
                </div>

                {/* Story Cards in this Column */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colStories.length === 0 ? (
                    <div className="h-36 border-2 border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center p-3 text-center space-y-1">
                      <ColumnIcon className="w-5 h-5 text-slate-700" />
                      <span className="text-[11px] text-slate-500 italic">Nenhuma história nesta etapa</span>
                    </div>
                  ) : (
                    colStories.map((story) => {
                      const checklist = getStoryChecklist(story);
                      const doneCount = checklist.filter((i) => i.completed).length;
                      const totalCount = checklist.length;
                      const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                      const isFullyDone = doneCount === totalCount;

                      return (
                        <div
                          key={story.id}
                          className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 shadow-md hover:shadow-emerald-500/10 transition group flex flex-col justify-between space-y-3"
                        >
                          <div>
                            {/* Project Name & Story Points */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                              <span className="truncate max-w-[90px] font-medium text-slate-400">
                                {story.projectName || "Geral"}
                              </span>
                              <div className="flex items-center space-x-1">
                                {story.validationReport && (
                                  <span
                                    title={`${story.validationReport.scorePercent}% nos testes de validação`}
                                    className={`px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center space-x-0.5 ${
                                      story.validationReport.scorePercent >= 85
                                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                        : "bg-amber-950 text-amber-300 border border-amber-800/60"
                                    }`}
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>{story.validationReport.scorePercent}%</span>
                                  </span>
                                )}
                                {story.storyPoints && (
                                  <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.2 rounded font-bold">
                                    {story.storyPoints} SP
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Story Title */}
                            <h4
                              onClick={() => setActiveModalStory(story)}
                              className="font-semibold text-xs text-white hover:text-emerald-300 cursor-pointer line-clamp-2 transition"
                            >
                              {story.title}
                            </h4>

                            {/* Role Preview */}
                            <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                              Como <span className="text-slate-300">{story.story.role}</span>...
                            </p>

                            {/* Progress Bar inside Card */}
                            <div className="mt-2.5 pt-2 border-t border-slate-900 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-medium">Passos</span>
                                <span className={`font-bold ${isFullyDone ? "text-emerald-400" : "text-indigo-400"}`}>
                                  {doneCount}/{totalCount} ({percent}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isFullyDone ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-emerald-400"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                            {/* Advance Step Button */}
                            {!isFullyDone ? (
                              <button
                                onClick={() => handleAdvanceStep(story)}
                                className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                                title="Avançar para o próximo passo na esteira"
                              >
                                <span>Avançar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-emerald-400 font-bold flex items-center space-x-1 text-[10px]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Homologado</span>
                              </span>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => setActiveModalStory(story)}
                                title="Ver Checklist Completo"
                                className="p-1 text-indigo-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition cursor-pointer"
                              >
                                <ListChecks className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => generateStoryPDF(story)}
                                title="Baixar PDF"
                                className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition cursor-pointer"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                              {onSelectStoryForGenerator && (
                                <button
                                  onClick={() => onSelectStoryForGenerator(story)}
                                  title="Editar no Estúdio"
                                  className="p-1 hover:text-indigo-300 rounded hover:bg-slate-800 transition cursor-pointer"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteStory && (
                                <button
                                  onClick={() => onDeleteStory(story.id)}
                                  title="Excluir"
                                  className="p-1 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Move Stage Selector Dropdown (Like Backlog Kanban) */}
                          <div>
                            <select
                              value={getStoryColumnIndex(story)}
                              onChange={(e) => handleMoveToStage(story, parseInt(e.target.value, 10))}
                              className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value={0}>Mover p/ 1. Homologar Usuário</option>
                              <option value={1}>Mover p/ 2. Integrar Staging</option>
                              <option value={2}>Mover p/ 3. Revisão Q.A (Staging)</option>
                              <option value={3}>Mover p/ 4. Integrar ao Main</option>
                              <option value={4}>Mover p/ 5. Revisão Q.A (Main)</option>
                              <option value={5}>Mover p/ 6. Executar Script</option>
                              <option value={6}>Mover p/ 7. Cadastrar Avisos</option>
                              <option value={7}>Mover p/ 8. Comunicado / Concluído</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED CHECKLIST MODAL (Triggered when clicking card or ListChecks icon) */}
      {activeModalStory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-[10px] font-bold">
                    {activeModalStory.projectName || "Geral"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                    Épico: {activeModalStory.epicName}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeModalStory.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalStory(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Story Text Preview */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono leading-relaxed">
              <span className="text-indigo-400 font-bold">Como</span> {activeModalStory.story.role},{" "}
              <span className="text-indigo-400 font-bold">Quero</span> {activeModalStory.story.want},{" "}
              <span className="text-indigo-400 font-bold">Para que</span> {activeModalStory.story.soThat}.
            </div>

            {/* Checklist Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Checklist da Esteira de Homologação</span>
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMarkAllInModal(activeModalStory, true)}
                    className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    Concluir Todos
                  </button>
                  <button
                    onClick={() => handleResetChecklistInModal(activeModalStory)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resetar</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {getStoryChecklist(activeModalStory).map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      item.completed
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                        : "bg-slate-950 border-slate-800 text-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(activeModalStory, item.id)}
                      className="flex items-center space-x-3 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="shrink-0">
                        {item.completed ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center">
                            <Circle className="w-3 h-3 text-transparent" />
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${item.completed ? "line-through text-slate-400" : "text-slate-200"}`}>
                        {idx + 1}. {item.label}
                      </span>
                    </button>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      {item.completedAt && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.completedAt}</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(activeModalStory, item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Item */}
              <form onSubmit={(e) => handleAddChecklistItem(activeModalStory, e)} className="pt-2">
                <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-emerald-500 transition">
                  <div className="w-5 h-5 rounded-full border border-dashed border-slate-600 flex items-center justify-center shrink-0 ml-1">
                    <Plus className="w-3 h-3 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Adicionar um item à lista..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                  {newItemText.trim() && (
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Criteria & Rules Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <h5 className="text-[11px] font-bold text-slate-200 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Critérios de Aceite ({activeModalStory.acceptanceCriteria?.length || 0})</span>
                </h5>
                <ul className="space-y-1 text-[10px] text-slate-400 max-h-24 overflow-y-auto">
                  {activeModalStory.acceptanceCriteria?.map((ac, idx) => (
                    <li key={ac.id || idx}>• {ac.text}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <h5 className="text-[11px] font-bold text-slate-200 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regras de Negócio ({activeModalStory.businessRules?.length || 0})</span>
                </h5>
                <ul className="space-y-1 text-[10px] text-slate-400 max-h-24 overflow-y-auto">
                  {activeModalStory.businessRules?.map((br, idx) => (
                    <li key={br.id || idx}>• {br.text}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => generateStoryPDF(activeModalStory)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Baixar PDF</span>
              </button>

              <button
                onClick={() => setActiveModalStory(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
