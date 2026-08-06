import React, { useState } from "react";
import {
  UserStory,
  HomologationItem,
  DEFAULT_HOMOLOGATION_STEPS,
} from "../types";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
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
  FileCode2,
  PlayCircle,
  LucideIcon,
} from "lucide-react";

interface HomologationPipelineViewProps {
  stories: UserStory[];
  onUpdateStory: (updatedStory: UserStory) => void;
  onSelectStoryForGenerator?: (story: UserStory) => void;
}

// Icon mapper for default 8 steps to give each pipeline node a distinct visual icon
const getStepIcon = (label: string, index: number): LucideIcon => {
  const l = label.toLowerCase();
  if (l.includes("homologar") || l.includes("usuário")) return Users;
  if (l.includes("staging")) return GitPullRequest;
  if (l.includes("main")) return Workflow;
  if (l.includes("q.a") || l.includes("revisão")) return ShieldCheck;
  if (l.includes("script") || l.includes("execução")) return Terminal;
  if (l.includes("aviso") || l.includes("cadastrar")) return Bell;
  if (l.includes("comunicar") || l.includes("interessados")) return MessageSquare;
  return CheckSquare;
};

export const HomologationPipelineView: React.FC<HomologationPipelineViewProps> = ({
  stories,
  onUpdateStory,
  onSelectStoryForGenerator,
}) => {
  const [selectedStoryId, setSelectedStoryId] = useState<string>(
    stories[0]?.id || ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newItemText, setNewItemText] = useState("");

  // Ensure selected story exists
  const activeStory =
    stories.find((s) => s.id === selectedStoryId) || stories[0] || null;

  // Helper to get or initialize homologation checklist for a story
  const getStoryChecklist = (story: UserStory): HomologationItem[] => {
    if (story.homologationChecklist && story.homologationChecklist.length > 0) {
      return story.homologationChecklist;
    }
    return DEFAULT_HOMOLOGATION_STEPS.map((label, idx) => ({
      id: `default-${idx}-${Date.now()}`,
      label,
      completed: false,
    }));
  };

  const currentChecklist = activeStory ? getStoryChecklist(activeStory) : [];
  const completedCount = currentChecklist.filter((item) => item.completed).length;
  const totalCount = currentChecklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find first uncompleted stage index (the "Active" stage on the conveyor belt)
  const activeStageIndex = currentChecklist.findIndex((item) => !item.completed);

  // Handlers for checklist item toggling and editing
  const handleToggleItem = (itemId: string) => {
    if (!activeStory) return;
    const existing = getStoryChecklist(activeStory);
    const updatedChecklist = existing.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed: !item.completed,
          completedAt: !item.completed
            ? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            : undefined,
        };
      }
      return item;
    });

    onUpdateStory({
      ...activeStory,
      homologationChecklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim() || !activeStory) return;

    const existing = getStoryChecklist(activeStory);
    const newItem: HomologationItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: newItemText.trim(),
      completed: false,
    };

    onUpdateStory({
      ...activeStory,
      homologationChecklist: [...existing, newItem],
      updatedAt: new Date().toISOString(),
    });

    setNewItemText("");
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeStory) return;
    const existing = getStoryChecklist(activeStory);
    const updated = existing.filter((i) => i.id !== itemId);
    onUpdateStory({
      ...activeStory,
      homologationChecklist: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMarkAll = (completed: boolean) => {
    if (!activeStory) return;
    const existing = getStoryChecklist(activeStory);
    const updated = existing.map((item) => ({
      ...item,
      completed,
      completedAt: completed
        ? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : undefined,
    }));
    onUpdateStory({
      ...activeStory,
      homologationChecklist: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResetChecklist = () => {
    if (!activeStory) return;
    const defaultList: HomologationItem[] = DEFAULT_HOMOLOGATION_STEPS.map((label, idx) => ({
      id: `default-${idx}-${Date.now()}`,
      label,
      completed: false,
    }));
    onUpdateStory({
      ...activeStory,
      homologationChecklist: defaultList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Filtered stories list
  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.epicName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate overall statistics across all stories
  const totalGlobalItems = stories.reduce((acc, s) => acc + getStoryChecklist(s).length, 0);
  const totalGlobalCompleted = stories.reduce(
    (acc, s) => acc + getStoryChecklist(s).filter((i) => i.completed).length,
    0
  );
  const globalProgress = totalGlobalItems > 0 ? Math.round((totalGlobalCompleted / totalGlobalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Pipeline Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Workflow className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Esteira de Homologação Ágil
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Linha do Tempo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Acompanhe o avanço da história de usuário passo a passo ao longo da esteira de produção: homologação com usuário, testes de Q.A, deploy em Staging/Main e publicação de avisos.
            </p>
          </div>

          {/* Global Progress Widget */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 min-w-[240px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Progresso Global do Backlog</span>
              <span className="font-bold text-emerald-400">{globalProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
              <span>{totalGlobalCompleted} de {totalGlobalItems} etapas concluídas</span>
              <span>{stories.length} histórias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Story Selector Left + Pipeline Timeline Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Story Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por história, projeto ou épico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
              <span className="font-semibold flex items-center space-x-1">
                <Filter className="w-3 h-3 text-indigo-400" />
                <span>Status:</span>
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px] px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todas ({stories.length})</option>
                <option value="ready">Prontas (Ready)</option>
                <option value="in_progress">Em Progresso</option>
                <option value="done">Concluídas (Done)</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>
          </div>

          {/* Stories List */}
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredStories.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Nenhuma história encontrada</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ajuste os filtros ou selecione outra história no backlog.
                </p>
              </div>
            ) : (
              filteredStories.map((story) => {
                const isSelected = story.id === activeStory?.id;
                const checklist = getStoryChecklist(story);
                const doneCount = checklist.filter((i) => i.completed).length;
                const total = checklist.length;
                const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

                return (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStoryId(story.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50"
                        : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 truncate max-w-[120px]">
                            {story.projectName || "Sem Projeto"}
                          </span>
                          {story.storyPoints && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {story.storyPoints} SP
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-xs text-white truncate leading-snug group-hover:text-emerald-300 transition-colors">
                          {story.title}
                        </h3>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? "text-emerald-400 translate-x-0.5" : "text-slate-600"
                        }`}
                      />
                    </div>

                    {/* Stage Progress Tracker */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-400">
                        Passo {doneCount} de {total}
                      </span>
                      <span
                        className={`font-bold ${
                          percent === 100
                            ? "text-emerald-400"
                            : percent > 0
                            ? "text-indigo-400"
                            : "text-slate-500"
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percent === 100
                            ? "bg-emerald-500"
                            : percent > 0
                            ? "bg-gradient-to-r from-indigo-500 to-emerald-400"
                            : "bg-slate-800"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Visual Conveyor Pipeline / Timeline Stepper (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeStory ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Story Header Summary */}
              <div className="border-b border-slate-800 pb-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg text-xs font-bold">
                      {activeStory.projectName}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold">
                      Épico: {activeStory.epicName}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase ${
                        activeStory.status === "done"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : activeStory.status === "ready"
                          ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                          : "bg-amber-950 text-amber-300 border-amber-800"
                      }`}
                    >
                      {activeStory.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onSelectStoryForGenerator && (
                      <button
                        onClick={() => onSelectStoryForGenerator(activeStory)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 hover:text-indigo-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Abrir no Estúdio</span>
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white tracking-tight">
                  {activeStory.title}
                </h2>

                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-300 font-mono leading-relaxed">
                  <span className="text-indigo-400 font-bold">Como</span> {activeStory.story.role},{" "}
                  <span className="text-indigo-400 font-bold">Quero</span> {activeStory.story.want},{" "}
                  <span className="text-indigo-400 font-bold">Para que</span> {activeStory.story.soThat}.
                </div>
              </div>



              {/* VERTICAL DETAILED TIMELINE TRAIL (LINHA DO TEMPO DETALHADA) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Linha do Tempo Detalhada & Controle de Etapas</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Marque individualmente cada etapa conforme os testes e deploys são homologados.
                  </p>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                  {currentChecklist.map((item, idx) => {
                    const IconComp = getStepIcon(item.label, idx);
                    const isNextToWorkOn = idx === activeStageIndex;

                    return (
                      <div key={item.id} className="relative group">
                        {/* Timeline Circle Bullet */}
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id)}
                          className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
                            item.completed
                              ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/50"
                              : isNextToWorkOn
                              ? "bg-indigo-600 text-white ring-4 ring-indigo-950 animate-pulse"
                              : "bg-slate-900 border-2 border-slate-700 text-slate-500 hover:border-indigo-400"
                          }`}
                          title="Clique para mudar o status"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </button>

                        {/* Step Card Content */}
                        <div
                          className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            item.completed
                              ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-200"
                              : isNextToWorkOn
                              ? "bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
                              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-lg ${
                                item.completed
                                  ? "bg-emerald-900/40 text-emerald-300"
                                  : isNextToWorkOn
                                  ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-white">
                                  {idx + 1}. {item.label}
                                </span>
                                {item.completed ? (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    Concluído
                                  </span>
                                ) : isNextToWorkOn ? (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                                    Próximo Passo
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-950 text-slate-500 border border-slate-800">
                                    Aguardando
                                  </span>
                                )}
                              </div>
                              {item.completedAt && (
                                <p className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                                  Concluído às {item.completedAt}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleToggleItem(item.id)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                                item.completed
                                  ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                              }`}
                            >
                              {item.completed ? (
                                <span>Reabrir Passo</span>
                              ) : (
                                <span>Concluir Passo</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Remover passo da esteira"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Step to Timeline */}
                <form onSubmit={handleAddItem} className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 focus-within:border-indigo-500 transition">
                    <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center shrink-0 ml-1">
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Adicionar um novo passo à linha do tempo da esteira..."
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                    {newItemText.trim() && (
                      <button
                        type="submit"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        Adicionar Passo
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Reference Criteria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Critérios de Aceite para Validação</span>
                  </h4>
                  {activeStory.acceptanceCriteria.length === 0 ? (
                    <p className="text-[11px] text-slate-500">Nenhum critério definido.</p>
                  ) : (
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      {activeStory.acceptanceCriteria.map((ac, idx) => (
                        <li key={ac.id || idx} className="flex items-start space-x-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{ac.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                    <FileCode2 className="w-4 h-4 text-amber-400" />
                    <span>Regras de Negócio Associadas</span>
                  </h4>
                  {activeStory.businessRules.length === 0 ? (
                    <p className="text-[11px] text-slate-500">Nenhuma regra definida.</p>
                  ) : (
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      {activeStory.businessRules.map((br, idx) => (
                        <li key={br.id || idx} className="flex items-start space-x-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{br.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Workflow className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhuma História Selecionada</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Selecione uma história na lista à esquerda para visualizar sua linha do tempo de homologação.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
