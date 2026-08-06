import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Kanban,
  FileText,
  Sparkles,
  Layers,
  Award,
  TrendingUp,
  Target,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { UserStory, StoryStatus } from "../types";

interface ReportsViewProps {
  stories: UserStory[];
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ stories, showToast }) => {
  const [selectedProject, setSelectedProject] = useState<string>("ALL");

  // Filter stories if project filter selected
  const projects = Array.from(new Set(stories.map((s) => s.projectName).filter(Boolean)));
  const filteredStories =
    selectedProject === "ALL"
      ? stories
      : stories.filter((s) => s.projectName === selectedProject);

  // Metrics calculation
  const totalStories = filteredStories.length;
  const totalPoints = filteredStories.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

  const statusCounts: Record<StoryStatus, number> = {
    draft: filteredStories.filter((s) => s.status === "draft").length,
    refinement: filteredStories.filter((s) => s.status === "refinement").length,
    ready: filteredStories.filter((s) => s.status === "ready").length,
    in_progress: filteredStories.filter((s) => s.status === "in_progress").length,
    done: filteredStories.filter((s) => s.status === "done").length,
  };

  const statusPoints: Record<StoryStatus, number> = {
    draft: filteredStories.filter((s) => s.status === "draft").reduce((a, b) => a + (b.storyPoints || 0), 0),
    refinement: filteredStories.filter((s) => s.status === "refinement").reduce((a, b) => a + (b.storyPoints || 0), 0),
    ready: filteredStories.filter((s) => s.status === "ready").reduce((a, b) => a + (b.storyPoints || 0), 0),
    in_progress: filteredStories.filter((s) => s.status === "in_progress").reduce((a, b) => a + (b.storyPoints || 0), 0),
    done: filteredStories.filter((s) => s.status === "done").reduce((a, b) => a + (b.storyPoints || 0), 0),
  };

  // Quality metrics
  const storiesWithBdd = filteredStories.filter((s) => s.bddScenarios && s.bddScenarios.length > 0).length;
  const storiesWithRn = filteredStories.filter((s) => s.businessRules && s.businessRules.length > 0).length;
  const storiesWithAc = filteredStories.filter((s) => s.acceptanceCriteria && s.acceptanceCriteria.length > 0).length;
  const totalAcCount = filteredStories.reduce((acc, s) => acc + (s.acceptanceCriteria?.length || 0), 0);
  const avgAcPerStory = totalStories > 0 ? (totalAcCount / totalStories).toFixed(1) : "0";

  const readyOrDoneRatio =
    totalStories > 0
      ? Math.round(((statusCounts.ready + statusCounts.done) / totalStories) * 100)
      : 0;

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredStories.length === 0) {
      if (showToast) showToast("Nenhuma história disponível para exportação.", "error");
      return;
    }

    const headers = [
      "ID",
      "Título",
      "Papel",
      "Ação (Want)",
      "Objetivo (SoThat)",
      "Status",
      "Projeto",
      "Épico",
      "Story Points",
      "Critérios de Aceite Qtd",
      "Regras de Negócio Qtd",
      "Cenários BDD Qtd",
      "Data Criação",
    ];

    const rows = filteredStories.map((s) => [
      `"${s.id}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.story.role.replace(/"/g, '""')}"`,
      `"${s.story.want.replace(/"/g, '""')}"`,
      `"${s.story.soThat.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${s.projectName || ""}"`,
      `"${s.epicName || ""}"`,
      s.storyPoints || 0,
      s.acceptanceCriteria.length,
      s.businessRules.length,
      s.bddScenarios.length,
      `"${new Date(s.createdAt).toLocaleDateString("pt-BR")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_historias_ageis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) showToast("Relatório CSV exportado com sucesso!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Relatórios & Analytics do Backlog</h2>
                <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Métricas Ágeis
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visão consolidada de estimativas, maturidade dos requisitos, cobertura de BDD e distribuição.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter by Project */}
            {projects.length > 0 && (
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Todos os Projetos ({stories.length})</option>
                  {projects.map((proj) => (
                    <option key={proj} value={proj}>
                      {proj}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Total de Histórias</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{totalStories}</span>
            <span className="text-xs text-indigo-400 font-bold">{readyOrDoneRatio}% Prontas/Concluídas</span>
          </div>
          <div className="mt-3 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-500"
              style={{ width: `${readyOrDoneRatio}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Volume Story Points</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{totalPoints} pts</span>
            <span className="text-xs text-slate-400 font-semibold">Fibonacci</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Estimativas estimadas e validadas</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Maturidade de Requisitos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">
              {totalStories > 0 ? Math.round((storiesWithAc / totalStories) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">{avgAcPerStory} ACs / história</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Com critérios de aceite detalhados</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold">Cobertura BDD (Gherkin)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-purple-400">
              {totalStories > 0 ? Math.round((storiesWithBdd / totalStories) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">{storiesWithBdd} de {totalStories}</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Prontas para testes de aceitação BDD</p>
        </div>
      </div>

      {/* Main Analytics Layout: Funnel + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown (Funnel) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Kanban className="w-4 h-4 text-indigo-400" />
              <span>Distribuição por Estágio no Kanban</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{totalStories} histórias</span>
          </div>

          <div className="space-y-4">
            {/* Draft */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span>Rascunho (Draft)</span>
                </span>
                <span className="text-slate-400">
                  {statusCounts.draft} histórias ({statusPoints.draft} pts)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-xl overflow-hidden border border-slate-800">
                <div
                  className="bg-slate-500 h-full transition-all duration-500"
                  style={{ width: `${totalStories > 0 ? (statusCounts.draft / totalStories) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Refinement */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Em Refinamento</span>
                </span>
                <span className="text-amber-400">
                  {statusCounts.refinement} histórias ({statusPoints.refinement} pts)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-xl overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${totalStories > 0 ? (statusCounts.refinement / totalStories) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Ready */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Homologada / Ready</span>
                </span>
                <span className="text-indigo-400">
                  {statusCounts.ready} histórias ({statusPoints.ready} pts)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-xl overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${totalStories > 0 ? (statusCounts.ready / totalStories) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>Em Desenvolvimento</span>
                </span>
                <span className="text-sky-400">
                  {statusCounts.in_progress} histórias ({statusPoints.in_progress} pts)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-xl overflow-hidden border border-slate-800">
                <div
                  className="bg-sky-400 h-full transition-all duration-500"
                  style={{ width: `${totalStories > 0 ? (statusCounts.in_progress / totalStories) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Done */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Concluída (Done)</span>
                </span>
                <span className="text-emerald-400">
                  {statusCounts.done} histórias ({statusPoints.done} pts)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-xl overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${totalStories > 0 ? (statusCounts.done / totalStories) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Engineering Quality Checklist */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Indicadores de Qualidade Ágil (INVEST)</span>
            </h3>
            <span className="text-xs text-indigo-400 font-bold">Standard Scrum</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Critérios de Aceite (AC)</p>
                  <p className="text-[11px] text-slate-400">Histórias com regras de aceitação explícitas</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-400">
                {storiesWithAc} / {totalStories}
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Regras de Negócio (RN)</p>
                  <p className="text-[11px] text-slate-400">Regras de validação e restrições técnicas definidas</p>
                </div>
              </div>
              <span className="text-sm font-black text-indigo-400">
                {storiesWithRn} / {totalStories}
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">Cenários BDD (Given-When-Then)</p>
                  <p className="text-[11px] text-slate-400">Histórias preparadas para automação de testes</p>
                </div>
              </div>
              <span className="text-sm font-black text-purple-400">
                {storiesWithBdd} / {totalStories}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Table Listing */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              <span>Resumo Detalhado das Histórias no Relatório</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tabela compilada para conferência de métricas e exportação.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Título / História</th>
                <th className="px-4 py-3">Projeto & Épico</th>
                <th className="px-4 py-3 text-center">Story Points</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">AC / RN / BDD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredStories.map((story) => (
                <tr key={story.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-semibold text-white max-w-xs">
                    <p className="truncate">{story.title}</p>
                    <p className="text-[10px] text-slate-400 font-normal truncate">
                      Como {story.story.role}, quero {story.story.want}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="font-bold text-indigo-300 block">{story.projectName}</span>
                    <span className="text-[10px] text-slate-400 block">{story.epicName}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-amber-400">
                    {story.storyPoints || "-"} pts
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        story.status === "ready"
                          ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                          : story.status === "done"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : story.status === "in_progress"
                          ? "bg-sky-950 text-sky-300 border-sky-800"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      {story.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5 text-[10px]">
                      <span className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {story.acceptanceCriteria.length} AC
                      </span>
                      <span className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {story.businessRules.length} RN
                      </span>
                      <span className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {story.bddScenarios.length} BDD
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
