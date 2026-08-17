import React, { useState } from "react";
import { Sparkles, X, RefreshCw, Wand2, CheckCircle, AlertTriangle, Bot } from "lucide-react";
import { LLMProvider, AVAILABLE_MODELS } from "../types";

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (instruction: string, provider?: LLMProvider, model?: string) => Promise<void>;
  isRefining: boolean;
  defaultProvider?: LLMProvider;
  defaultModel?: string;
}

const QUICK_INSTRUCTIONS = [
  "Tornar os Critérios de Aceitação mais rigorosos e diretamente testáveis.",
  "Adicionar cenários de exceção, falha de rede ou validação no BDD.",
  "Focar estritamente no valor de negócio e simplificar o contexto.",
  "Garantir alinhamento com regras de limites transacionais e expiração.",
  "Adequar linguagem para testes de homologação de negócio.",
];

export const RefineModal: React.FC<RefineModalProps> = ({
  isOpen,
  onClose,
  onRefine,
  isRefining,
  defaultProvider = "gemini",
  defaultModel = "gemini-2.5-flash",
}) => {
  const [instruction, setInstruction] = useState("");
  const [provider, setProvider] = useState<LLMProvider>(defaultProvider);
  const [model, setModel] = useState<string>(defaultModel);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setModel(newProvider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining) return;
    onRefine(instruction, provider, model);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Refinar História com IA</h3>
              <p className="text-xs text-slate-400">
                Ajuste os Critérios, Regras de Negócio ou BDD com instruções personalizadas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRefining}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Engine Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center space-x-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span>Motor de Refinamento</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange("gemini")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                  provider === "gemini"
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Google Gemini</span>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("openai")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                  provider === "openai"
                    ? "bg-emerald-600 text-white shadow"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Bot className="w-3 h-3 text-emerald-300" />
                <span>ChatGPT (OpenAI)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Sugestões Rápidas de Refinamento:
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_INSTRUCTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(item)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition text-left ${
                    instruction === item
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-medium"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Instrução Específica para a IA:
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Adicionar uma regra de negócio que limite tentativas incorretas a 3 vezes e criar o cenário BDD correspondente..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isRefining}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!instruction.trim() || isRefining}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              {isRefining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Refinando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Aplicar Refinamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

