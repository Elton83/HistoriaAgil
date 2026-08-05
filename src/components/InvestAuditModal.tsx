import React from "react";
import { ShieldCheck, X, CheckCircle2, AlertTriangle, XCircle, Award, Sparkles, Lightbulb } from "lucide-react";
import { InvestAudit } from "../types";

interface InvestAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: InvestAudit | null;
  isLoading: boolean;
}

export const InvestAuditModal: React.FC<InvestAuditModalProps> = ({
  isOpen,
  onClose,
  audit,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Auditoria INVEST & Story Points</h3>
              <p className="text-xs text-slate-400">
                Avaliação automatizada de qualidade de Requisitos Ágeis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                Analisando história contra os critérios INVEST...
              </p>
            </div>
          ) : audit ? (
            <>
              {/* Score & Points Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Pontuação de Qualidade INVEST
                    </span>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                      {audit.score} <span className="text-sm text-slate-500">/ 100</span>
                    </div>
                  </div>
                  <Award className="w-10 h-10 text-emerald-500/20" />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Estimativa Sugerida
                    </span>
                    <div className="text-3xl font-extrabold text-cyan-400 mt-1">
                      {audit.estimatedStoryPoints || 3}{" "}
                      <span className="text-xs text-slate-400 font-normal">Story Points</span>
                    </div>
                  </div>
                  <Sparkles className="w-8 h-8 text-cyan-500/20" />
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Checklist INVEST
                </h4>
                <div className="space-y-2">
                  {audit.investChecklist?.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start space-x-3"
                    >
                      {item.status === "pass" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : item.status === "warning" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {item.criterion}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.feedback}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {audit.recommendations && audit.recommendations.length > 0 && (
                <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs mb-2">
                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                    <span>Recomendações do Analista Sênior IA</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-indigo-200/90">
                    {audit.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-sm text-slate-400 py-6">
              Nenhuma análise disponível. Tente novamente.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
