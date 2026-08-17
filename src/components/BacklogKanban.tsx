import React, { useState } from "react";
import { UserStory, StoryStatus, getStoryDeadlineStatus } from "../types";
import { generateStoryPDF } from "../utils/pdfExporter";
import {
  FileEdit,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Layers,
  FileDown,
  Bot,
  AlertTriangle,
  Bell,
  CheckCircle2,
  CalendarDays,
  Flame,
  ChevronDown
} from "lucide-react";

interface BacklogKanbanProps {
  stories: UserStory[];
  onSelectStory: (story: UserStory) => void;
  onUpdateStatus: (storyId: string, newStatus: StoryStatus) => void;
  onUpdateStory?: (story: UserStory) => void;
  onDeleteStory: (storyId: string) => void;
  onCreateNewStory: () => void;
}

const COLUMNS: Array<{ id: StoryStatus; title: string; color: string; badgeBg: string; headerBorder: string }> = [
  {
    id: "draft",
    title: "Rascunho",
    color: "border-slate-800 bg-slate-900/50",
    badgeBg: "bg-slate-800 text-slate-300 border border-slate-700",
    headerBorder: "border-slate-700/60"
  },
  {
    id: "refinement",
    title: "Em Refinamento",
    color: "border-amber-900/40 bg-slate-900/50",
    badgeBg: "bg-amber-950/70 text-amber-300 border border-amber-700/60",
    headerBorder: "border-amber-700/40"
  },
  {
    id: "ready",
    title: "Pronto pra Sprint",
    color: "border-indigo-900/40 bg-slate-900/50",
    badgeBg: "bg-indigo-950/70 text-indigo-300 border border-indigo-700/60",
    headerBorder: "border-indigo-700/40"
  },
  {
    id: "in_progress",
    title: "Em Desenvolvimento",
    color: "border-cyan-900/40 bg-slate-900/50",
    badgeBg: "bg-cyan-950/70 text-cyan-300 border border-cyan-700/60",
    headerBorder: "border-cyan-700/40"
  },
  {
    id: "done",
    title: "Concluído",
    color: "border-emerald-900/40 bg-slate-900/50",
    badgeBg: "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60",
    headerBorder: "border-emerald-700/40"
  },
];

export const BacklogKanban: React.FC<BacklogKanbanProps> = ({
  stories,
  onSelectStory,
  onUpdateStatus,
  onUpdateStory,
  onDeleteStory,
  onCreateNewStory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "overdue" | "due_soon" | "has_date">("all");
  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(new Set(stories.flatMap((s) => s.tags || [])));

  // Deadline statistics
  const overdueStories = stories.filter(
    (s) => s.status !== "done" && s.dueDate && getStoryDeadlineStatus(s.dueDate).status === "overdue"
  );
  const dueTodayStories = stories.filter(
    (s) => s.status !== "done" && s.dueDate && getStoryDeadlineStatus(s.dueDate).status === "due_today"
  );
  const dueSoonStories = stories.filter(
    (s) => s.status !== "done" && s.dueDate && getStoryDeadlineStatus(s.dueDate).status === "due_soon"
  );

  const totalUrgentCount = overdueStories.length + dueTodayStories.length + dueSoonStories.length;

  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.story.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = selectedTag ? s.tags?.includes(selectedTag) : true;

    let matchesDeadline = true;
    if (deadlineFilter === "overdue") {
      matchesDeadline = s.status !== "done" && !!s.dueDate && getStoryDeadlineStatus(s.dueDate).status === "overdue";
    } else if (deadlineFilter === "due_soon") {
      matchesDeadline =
        s.status !== "done" &&
        !!s.dueDate &&
        (getStoryDeadlineStatus(s.dueDate).status === "due_today" ||
          getStoryDeadlineStatus(s.dueDate).status === "due_soon" ||
          getStoryDeadlineStatus(s.dueDate).status === "overdue");
    } else if (deadlineFilter === "has_date") {
      matchesDeadline = !!s.dueDate;
    }

    return matchesSearch && matchesTag && matchesDeadline;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `historias_backlog_agil_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleQuickDueDateChange = (story: UserStory, newDate: string) => {
    if (onUpdateStory) {
      onUpdateStory({
        ...story,
        dueDate: newDate || undefined,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingDueDateId(null);
  };

  return (
    <div className="space-y-6">
      {/* Kanban Header Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-slate-100 via-indigo-100 to-slate-200 bg-clip-text text-transparent">
              Quadro Ágil de Histórias de Usuário
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestão visual de fluxo, refinamento, testes e <strong className="text-indigo-300">alertas de prazos</strong> ({stories.length} histórias cadastradas)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, papel ou projeto..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
            />
          </div>

          {/* Export button */}
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700/80 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Exportar JSON</span>
          </button>

          {/* New Story Button */}
          <button
            onClick={onCreateNewStory}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95 border border-indigo-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nova História</span>
          </button>
        </div>
      </div>

      {/* Deadline Reminder Alert Banner */}
      {totalUrgentCount > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-xl shadow-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl shrink-0 shadow-lg shadow-amber-500/10">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                  Central de Lembretes de Prazos & Entregas
                </span>
                <span className="bg-amber-950/80 text-amber-300 border border-amber-600/80 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {totalUrgentCount} {totalUrgentCount === 1 ? "alerta pendente" : "alertas pendentes"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {overdueStories.length > 0 && (
                  <span className="text-rose-400 font-semibold mr-2">
                    🔴 {overdueStories.length} {overdueStories.length === 1 ? "história atrasada" : "histórias atrasadas"}
                  </span>
                )}
                {dueTodayStories.length > 0 && (
                  <span className="text-amber-300 font-semibold mr-2">
                    ⚡ {dueTodayStories.length} {dueTodayStories.length === 1 ? "vence hoje" : "vencem hoje"}
                  </span>
                )}
                {dueSoonStories.length > 0 && (
                  <span className="text-orange-300 font-semibold">
                    ⏰ {dueSoonStories.length} {dueSoonStories.length === 1 ? "vence nos próximos 3 dias" : "vencem nos próximos 3 dias"}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => setDeadlineFilter(deadlineFilter === "due_soon" ? "all" : "due_soon")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                deadlineFilter === "due_soon"
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-750"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{deadlineFilter === "due_soon" ? "Ver Todas" : "Filtrar Apenas Urgentes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar: Tags & Deadline Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Deadline Preset Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <span className="text-slate-400 font-medium flex items-center space-x-1 shrink-0 mr-1">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
            <span>Prazos:</span>
          </span>
          <button
            onClick={() => setDeadlineFilter("all")}
            className={`px-2.5 py-1 rounded-lg border transition shrink-0 cursor-pointer font-semibold ${
              deadlineFilter === "all"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            Todos ({stories.length})
          </button>
          <button
            onClick={() => setDeadlineFilter("due_soon")}
            className={`px-2.5 py-1 rounded-lg border transition shrink-0 cursor-pointer font-semibold flex items-center space-x-1 ${
              deadlineFilter === "due_soon"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                : "bg-slate-900 border-slate-800 text-amber-300 hover:border-amber-500/40"
            }`}
          >
            <span>⚠️ Próximos / Críticos</span>
            {totalUrgentCount > 0 && (
              <span className="bg-amber-950 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold border border-amber-600/60">
                {totalUrgentCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setDeadlineFilter("overdue")}
            className={`px-2.5 py-1 rounded-lg border transition shrink-0 cursor-pointer font-semibold flex items-center space-x-1 ${
              deadlineFilter === "overdue"
                ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                : "bg-slate-900 border-slate-800 text-rose-300 hover:border-rose-500/40"
            }`}
          >
            <span>🔴 Atrasadas</span>
            {overdueStories.length > 0 && (
              <span className="bg-rose-950 text-rose-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold border border-rose-600/60">
                {overdueStories.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setDeadlineFilter("has_date")}
            className={`px-2.5 py-1 rounded-lg border transition shrink-0 cursor-pointer font-semibold ${
              deadlineFilter === "has_date"
                ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            📅 Com Prazo Definido
          </button>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <span className="text-slate-400 font-medium flex items-center space-x-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tags:</span>
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-md border transition shrink-0 cursor-pointer text-[11px] font-semibold ${
                selectedTag === null
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Todas
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-0.5 rounded-md border transition shrink-0 cursor-pointer text-[11px] font-semibold ${
                  selectedTag === tag
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const colStories = filteredStories.filter((s) => s.status === col.id);

          return (
            <div
              key={col.id}
              className={`border ${col.color} rounded-2xl p-3 flex flex-col min-h-[520px] shadow-lg shadow-black/30 backdrop-blur-sm`}
            >
              {/* Column Title */}
              <div className={`flex items-center justify-between pb-3 mb-3 border-b ${col.headerBorder}`}>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${col.badgeBg}`}>
                    {col.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                  {colStories.length}
                </span>
              </div>

              {/* Story Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colStories.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center p-4 text-center">
                    <span className="text-xs text-slate-500 italic">Nenhuma história neste estágio</span>
                  </div>
                ) : (
                  colStories.map((story) => {
                    const deadlineInfo = getStoryDeadlineStatus(story.dueDate);
                    const isOverdueOrSoon =
                      story.status !== "done" &&
                      (deadlineInfo.status === "overdue" ||
                        deadlineInfo.status === "due_today" ||
                        deadlineInfo.status === "due_soon");

                    return (
                      <div
                        key={story.id}
                        className={`bg-slate-900 border rounded-xl p-3.5 shadow-md hover:shadow-indigo-500/10 transition-all group flex flex-col justify-between space-y-3 ${
                          isOverdueOrSoon
                            ? deadlineInfo.status === "overdue"
                              ? "border-rose-700/80 hover:border-rose-500 bg-gradient-to-b from-rose-950/20 to-slate-900"
                              : "border-amber-600/80 hover:border-amber-400 bg-gradient-to-b from-amber-950/20 to-slate-900"
                            : "border-slate-800/90 hover:border-indigo-500/80"
                        }`}
                      >
                        <div>
                          {/* Top Row: Project Badge & Validation Score & Story Points */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                            <span className="truncate max-w-[95px] font-bold text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                              {story.projectName || "Geral"}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              {story.validationReport && (
                                <span
                                  title={`${story.validationReport.scorePercent}% nos testes de validação`}
                                  className={`px-1.5 py-0.5 rounded font-bold text-[9px] flex items-center space-x-0.5 border ${
                                    story.validationReport.scorePercent >= 85
                                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                                      : story.validationReport.scorePercent >= 60
                                      ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                                      : "bg-rose-950/80 text-rose-300 border-rose-700/60"
                                  }`}
                                >
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>{story.validationReport.scorePercent}%</span>
                                </span>
                              )}
                              {story.storyPoints && (
                                <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-1.5 py-0.5 rounded font-bold">
                                  {story.storyPoints} SP
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Deadline Badge / Quick Date Picker */}
                          <div className="mb-2">
                            {editingDueDateId === story.id ? (
                              <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-lg border border-indigo-500 animate-in fade-in">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
                                <input
                                  type="date"
                                  defaultValue={story.dueDate || ""}
                                  onChange={(e) => handleQuickDueDateChange(story, e.target.value)}
                                  className="w-full bg-transparent text-[11px] text-slate-100 focus:outline-none cursor-pointer"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingDueDateId(null)}
                                  className="text-[10px] text-slate-400 hover:text-slate-200 px-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => setEditingDueDateId(story.id)}
                                  title="Clique para alterar o prazo de entrega"
                                  className={`text-[10px] font-bold px-2 py-0.8 rounded-md border flex items-center space-x-1 transition cursor-pointer hover:scale-102 ${deadlineInfo.badgeClass}`}
                                >
                                  {deadlineInfo.status === "overdue" ? (
                                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  ) : deadlineInfo.status === "due_today" ? (
                                    <Flame className="w-3 h-3 text-amber-400" />
                                  ) : deadlineInfo.status === "due_soon" ? (
                                    <Clock className="w-3 h-3 text-orange-400" />
                                  ) : (
                                    <Calendar className="w-3 h-3 text-indigo-400" />
                                  )}
                                  <span>{deadlineInfo.label}</span>
                                </button>

                                {story.dueDate && story.status === "done" && (
                                  <span className="text-[9px] text-emerald-400 font-semibold flex items-center space-x-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Entregue</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <h4
                            onClick={() => onSelectStory(story)}
                            className="font-bold text-xs text-slate-100 hover:text-indigo-400 cursor-pointer line-clamp-2 transition leading-snug"
                          >
                            {story.title}
                          </h4>

                          {/* Role preview */}
                          <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                            Como <span className="text-slate-200 font-medium">{story.story.role}</span>...
                          </p>

                          {/* LLM provider tag if available */}
                          {story.usedProvider && (
                            <div className="mt-2 flex items-center">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                                  story.usedProvider === "openai"
                                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                                    : "bg-indigo-950/80 text-indigo-300 border-indigo-700/60"
                                }`}
                              >
                                <Bot className="w-2.5 h-2.5" />
                                <span>{story.usedProvider === "openai" ? "ChatGPT" : "Gemini"}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Footer Metrics & Actions */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center space-x-2">
                            <span title="Critérios de Aceite" className="text-slate-400">
                              AC: <strong className="text-slate-200">{story.acceptanceCriteria?.length || 0}</strong>
                            </span>
                            <span>•</span>
                            <span title="Cenários BDD" className="text-slate-400">
                              BDD: <strong className="text-slate-200">{story.bddScenarios?.length || 0}</strong>
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => generateStoryPDF(story)}
                              title="Baixar PDF da História (Produto Final)"
                              className="p-1 text-emerald-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition cursor-pointer"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSelectStory(story)}
                              title="Editar no Estúdio"
                              className="p-1 text-indigo-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition cursor-pointer"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteStory(story.id)}
                              title="Excluir"
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Move status dropdown */}
                        <div className="pt-1">
                          <select
                            value={story.status}
                            onChange={(e) => onUpdateStatus(story.id, e.target.value as StoryStatus)}
                            className="w-full bg-slate-950 border border-slate-800 text-[10px] text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer transition font-medium"
                          >
                            <option value="draft">Mover p/ Rascunho</option>
                            <option value="refinement">Mover p/ Refinamento</option>
                            <option value="ready">Mover p/ Pronto (Ready)</option>
                            <option value="in_progress">Mover p/ Em Dev</option>
                            <option value="done">Mover p/ Concluído</option>
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
  );
};
