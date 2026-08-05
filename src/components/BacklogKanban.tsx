import React, { useState } from "react";
import { UserStory, StoryStatus } from "../types";
import { generateStoryPDF } from "../utils/pdfExporter";
import {
  FileEdit,
  Trash2,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Layers,
  FileDown
} from "lucide-react";

interface BacklogKanbanProps {
  stories: UserStory[];
  onSelectStory: (story: UserStory) => void;
  onUpdateStatus: (storyId: string, newStatus: StoryStatus) => void;
  onDeleteStory: (storyId: string) => void;
  onCreateNewStory: () => void;
}

const COLUMNS: Array<{ id: StoryStatus; title: string; color: string; badgeBg: string }> = [
  { id: "draft", title: "Rascunho", color: "border-slate-700", badgeBg: "bg-slate-800 text-slate-300" },
  { id: "refinement", title: "Em Refinamento", color: "border-amber-500/50", badgeBg: "bg-amber-500/20 text-amber-300" },
  { id: "ready", title: "Pronto pra Sprint", color: "border-indigo-500/50", badgeBg: "bg-indigo-500/20 text-indigo-300" },
  { id: "in_progress", title: "Em Desenvolvimento", color: "border-cyan-500/50", badgeBg: "bg-cyan-500/20 text-cyan-300" },
  { id: "done", title: "Concluído", color: "border-emerald-500/50", badgeBg: "bg-emerald-500/20 text-emerald-300" },
];

export const BacklogKanban: React.FC<BacklogKanbanProps> = ({
  stories,
  onSelectStory,
  onUpdateStatus,
  onDeleteStory,
  onCreateNewStory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(new Set(stories.flatMap((s) => s.tags || [])));

  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.story.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = selectedTag ? s.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `histórias_backlog_agil_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Kanban Header Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Quadro Ágil de Histórias de Usuário</span>
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie e homologue o fluxo de requisitos da sua equipe ({stories.length} histórias no backlog)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título ou papel..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Export button */}
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar JSON</span>
          </button>

          {/* New Story Button */}
          <button
            onClick={onCreateNewStory}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova História</span>
          </button>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Tags:</span>
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg border transition shrink-0 ${
              selectedTag === null
                ? "bg-indigo-600 text-white border-indigo-500 font-semibold"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Todas ({stories.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg border transition shrink-0 ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white border-indigo-500 font-semibold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const colStories = filteredStories.filter((s) => s.status === col.id);

          return (
            <div
              key={col.id}
              className={`bg-slate-900/60 border ${col.color} rounded-2xl p-3 flex flex-col min-h-[500px]`}
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                    {col.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">{colStories.length}</span>
              </div>

              {/* Story Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colStories.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center p-4 text-center">
                    <span className="text-xs text-slate-500 italic">Nenhuma história neste estágio</span>
                  </div>
                ) : (
                  colStories.map((story) => (
                    <div
                      key={story.id}
                      className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 shadow-md hover:shadow-indigo-500/10 transition group flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {/* Project / Epic Badge & Validation Score */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                          <span className="truncate max-w-[100px] font-medium text-slate-400">
                            {story.projectName || "Geral"}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            {story.validationReport && (
                              <span
                                title={`${story.validationReport.scorePercent}% nos testes de validação`}
                                className={`px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center space-x-0.5 ${
                                  story.validationReport.scorePercent >= 85
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                    : story.validationReport.scorePercent >= 60
                                    ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                    : "bg-rose-950 text-rose-300 border border-rose-800/60"
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

                        {/* Title */}
                        <h4
                          onClick={() => onSelectStory(story)}
                          className="font-semibold text-xs text-white hover:text-indigo-300 cursor-pointer line-clamp-2 transition"
                        >
                          {story.title}
                        </h4>

                        {/* Role preview */}
                        <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                          Como <span className="text-slate-300">{story.story.role}</span>...
                        </p>
                      </div>

                      {/* Footer Metrics */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center space-x-2">
                          <span title="Critérios de Aceite">
                            AC: {story.acceptanceCriteria?.length || 0}
                          </span>
                          <span>•</span>
                          <span title="Cenários BDD">
                            BDD: {story.bddScenarios?.length || 0}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
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
                            className="p-1 hover:text-indigo-300 rounded hover:bg-slate-800 transition cursor-pointer"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteStory(story.id)}
                            title="Excluir"
                            className="p-1 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
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
                          className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="draft">Mover p/ Rascunho</option>
                          <option value="refinement">Mover p/ Refinamento</option>
                          <option value="ready">Mover p/ Pronto (Ready)</option>
                          <option value="in_progress">Mover p/ Em Dev</option>
                          <option value="done">Mover p/ Concluído</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
