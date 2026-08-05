import React from "react";
import { BookOpen, X, Check, ShieldAlert, FileText, Target, ListOrdered } from "lucide-react";

interface MethodologyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyGuideModal: React.FC<MethodologyGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Guia Metodológico do Gerador de Histórias</h3>
              <p className="text-xs text-slate-400">
                Padrões rígidos de Engenharia de Requisitos, BDD e Story Splitting por Incremento
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

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-300 text-xs sm:text-sm">
          {/* Section 1: Papel & Objetivo */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-cyan-400 text-sm">
              <Target className="w-4 h-4" />
              <span>Papel do Analista Sênior IA</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Transformar necessidades de negócio brutas em **UMA ÚNICA História de Usuário**, pronta para o refinamento do time de desenvolvimento. O objetivo é identificar **UM ÚNICO incremento de produto** utilizável, testável e homologável em produção.
            </p>
          </div>

          {/* Section 2: Regras Rígidas */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-rose-400 text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>O que NUNCA fazer (Restrições de Divisão)</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-rose-200/90 text-xs">
              <li className="flex items-start space-x-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>NÃO dividir por CRUD</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>NÃO dividir por Front-end / Back-end</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>NÃO dividir por Banco de Dados ou API</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>NÃO dividir por camadas técnicas</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>NÃO criar tarefas técnicas</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>NÃO inventar regras ou assumir fatos</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Estabilidade & Estrutura */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-sm flex items-center space-x-2">
              <ListOrdered className="w-4 h-4 text-indigo-400" />
              <span>Estrutura de Saída Exigida</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="font-semibold text-indigo-300 text-xs mb-1">1. Título & História</div>
                <p className="text-slate-400 text-xs">
                  • Título curto e objetivo (máx. 12 palavras)<br />
                  • Como [usuário beneficiado]<br />
                  • Quero [entrega clara de negócio]<br />
                  • Para [valor e benefício tangível]
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="font-semibold text-indigo-300 text-xs mb-1">2. Contexto Resumido</div>
                <p className="text-slate-400 text-xs">
                  Um único parágrafo cobrindo: situação atual, problema atual, objetivo da alteração e benefício esperado.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="font-semibold text-indigo-300 text-xs mb-1">3. Critérios de Aceitação (AC)</div>
                <p className="text-slate-400 text-xs">
                  Numerados (AC01, AC02...). Comportamentos observáveis pelo usuário final, diretamente testáveis e homologáveis.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="font-semibold text-indigo-300 text-xs mb-1">4. Regras de Negócio (RN)</div>
                <p className="text-slate-400 text-xs">
                  Numeradas (RN01, RN02...). Regras essenciais que complementam os critérios sem duplicar.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 md:col-span-2">
                <div className="font-semibold text-indigo-300 text-xs mb-1">5. Cenários BDD (Gherkin)</div>
                <p className="text-slate-400 text-xs">
                  Formato: <strong>Dado... [E...] Quando... Então...</strong> Cobrindo fluxo principal, validações e exceções.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
