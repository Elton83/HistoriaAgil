import React, { useState } from "react";
import { ValidationReport, ValidationTest } from "../types";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileDown
} from "lucide-react";

interface ValidationTestsCardProps {
  report?: ValidationReport;
  onReRunTests: () => void;
  onExportPDF?: () => void;
}

export const ValidationTestsCard: React.FC<ValidationTestsCardProps> = ({
  report,
  onReRunTests,
  onExportPDF,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  if (!report) {
    return (
      <div className="bg-slate-900 border border-slate-800 shadow-md rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Nenhum teste de validação executado para esta história.</span>
        </div>
        <button
          onClick={onReRunTests}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Executar Testes de Validação</span>
        </button>
      </div>
    );
  }

  const { totalTests, passedCount, warningsCount, failedCount, scorePercent, tests } = report;

  const filteredTests = activeCategoryFilter === "all"
    ? tests
    : tests.filter(t => t.status === activeCategoryFilter);

  // Badge color based on scorePercent
  let badgeBg = "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
  if (scorePercent < 60) {
    badgeBg = "bg-rose-950/80 text-rose-300 border-rose-700/60";
  } else if (scorePercent < 85) {
    badgeBg = "bg-amber-950/80 text-amber-300 border-amber-700/60";
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 shadow-lg rounded-2xl p-4 space-y-3 backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/30 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider whitespace-nowrap">
                Bateria de Testes de Validação
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${badgeBg}`}>
                {scorePercent}% Aprovado
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">
              {passedCount} passou • {warningsCount} alertas • {failedCount} falhas de {totalTests} testes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              title="Gerar e baixar o PDF do produto final com laudo de validação"
              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Baixar PDF</span>
            </button>
          )}

          <button
            onClick={onReRunTests}
            title="Re-executar testes com dados atuais"
            className="px-2.5 py-1.5 text-slate-300 hover:text-indigo-300 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition flex items-center space-x-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="whitespace-nowrap">Re-validar</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex border border-slate-800">
        <div
          style={{ width: `${(passedCount / totalTests) * 100}%` }}
          className="bg-emerald-500 h-full transition-all duration-500"
          title={`${passedCount} testes aprovados`}
        />
        <div
          style={{ width: `${(warningsCount / totalTests) * 100}%` }}
          className="bg-amber-500 h-full transition-all duration-500"
          title={`${warningsCount} alertas`}
        />
        <div
          style={{ width: `${(failedCount / totalTests) * 100}%` }}
          className="bg-rose-500 h-full transition-all duration-500"
          title={`${failedCount} falhas`}
        />
      </div>

      {/* Expanded Details List */}
      {isExpanded && (
        <div className="space-y-2.5 pt-1">
          {/* Quick Filter Tabs */}
          <div className="flex items-center space-x-1 text-[11px] font-medium">
            <button
              onClick={() => setActiveCategoryFilter("all")}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                activeCategoryFilter === "all"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Todos ({totalTests})
            </button>
            <button
              onClick={() => setActiveCategoryFilter("pass")}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                activeCategoryFilter === "pass"
                  ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-700"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              Passou ({passedCount})
            </button>
            {warningsCount > 0 && (
              <button
                onClick={() => setActiveCategoryFilter("warning")}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  activeCategoryFilter === "warning"
                    ? "bg-amber-950 text-amber-300 font-bold border border-amber-700"
                    : "text-slate-400 hover:text-amber-400"
                }`}
              >
                Alertas ({warningsCount})
              </button>
            )}
            {failedCount > 0 && (
              <button
                onClick={() => setActiveCategoryFilter("fail")}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  activeCategoryFilter === "fail"
                    ? "bg-rose-950 text-rose-300 font-bold border border-rose-700"
                    : "text-slate-400 hover:text-rose-400"
                }`}
              >
                Falhas ({failedCount})
              </button>
            )}
          </div>

          {/* Test Cards List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="bg-slate-950 border border-slate-800/90 rounded-xl p-2.5 space-y-1 text-xs shadow-inner"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {test.status === "pass" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {test.status === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    {test.status === "fail" && (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-slate-100">{test.name}</span>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${
                      test.status === "pass"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                        : test.status === "warning"
                        ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                        : "bg-rose-950/80 text-rose-300 border-rose-700/60"
                    }`}
                  >
                    {test.status === "pass" ? "Passou" : test.status === "warning" ? "Alerta" : "Falhou"}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 pl-6 leading-normal font-medium">
                  {test.message}
                </p>

                {test.details && (
                  <p className="text-[10px] text-slate-400 pl-6 font-mono bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 mt-1">
                    {test.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
