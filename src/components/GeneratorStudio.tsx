import React, { useState, useRef } from "react";
import { UserStory, LLMProvider, AVAILABLE_MODELS, getStoryDeadlineStatus } from "../types";
import { parseUploadedFile, parseRecordedVideoBlob, ParsedFileInfo } from "../utils/fileReader";
import { validateUserStory } from "../utils/storyValidator";
import { generateStoryPDF } from "../utils/pdfExporter";
import { ValidationTestsCard } from "./ValidationTestsCard";
import { VideoRecorderModal } from "./VideoRecorderModal";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Wand2,
  BookmarkPlus,
  FileCode,
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Upload,
  FileText,
  X,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileUp,
  Search,
  CheckCircle,
  FileDown,
  UserCheck,
  Video,
  FolderArchive,
  Camera,
  Bot,
  Cpu,
  Zap,
  Calendar,
  Clock,
  Flame,
} from "lucide-react";

interface GeneratorStudioProps {
  currentStory: UserStory | null;
  onStoryChange: (updatedStory: UserStory | null) => void;
  onGenerateStory: (
    contextText: string,
    projectName: string,
    epicName: string,
    requester: string,
    extraInstructions: string,
    images?: Array<{ mimeType: string; base64Data: string; fileName?: string }>,
    provider?: LLMProvider,
    model?: string,
    dueDate?: string
  ) => Promise<void>;
  isGenerating: boolean;
  onSaveToBacklog: (story: UserStory) => void;
  onOpenRefineModal: () => void;
  onOpenAuditModal: () => void;
  onResetSystem?: () => void;
  selectedProvider?: LLMProvider;
  selectedModel?: string;
  onSelectModel?: (provider: LLMProvider, model: string) => void;
}

export const GeneratorStudio: React.FC<GeneratorStudioProps> = ({
  currentStory,
  onStoryChange,
  onGenerateStory,
  isGenerating,
  onSaveToBacklog,
  onOpenRefineModal,
  onOpenAuditModal,
  onResetSystem,
  selectedProvider = "gemini",
  selectedModel = "gemini-2.5-flash",
  onSelectModel,
}) => {
  // Local or controlled model selection
  const [providerState, setProviderState] = useState<LLMProvider>(selectedProvider);
  const [modelState, setModelState] = useState<string>(selectedModel);

  const activeProvider = onSelectModel ? selectedProvider : providerState;
  const activeModel = onSelectModel ? selectedModel : modelState;

  const handleProviderChange = (p: LLMProvider) => {
    const defaultModelForProvider = p === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini";
    if (onSelectModel) {
      onSelectModel(p, defaultModelForProvider);
    } else {
      setProviderState(p);
      setModelState(defaultModelForProvider);
    }
  };

  const handleModelChange = (m: string) => {
    if (onSelectModel) {
      onSelectModel(activeProvider, m);
    } else {
      setModelState(m);
    }
  };

  // Form states for generating
  const [contextText, setContextText] = useState("");
  const [projectName, setProjectName] = useState("");
  const [epicName, setEpicName] = useState("");
  const [requester, setRequester] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");

  // Attached file state
  const [attachedFile, setAttachedFile] = useState<ParsedFileInfo | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Video recording modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // View Mode: interactive | markdown | jira
  const [viewMode, setViewMode] = useState<"interactive" | "markdown" | "jira">("interactive");

  // Feedback states
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [validationToast, setValidationToast] = useState<{
    show: boolean;
    score: number;
    passed: number;
    total: number;
  } | null>(null);

  // Handle file selection (spreadsheets, docs, images, videos, audio, zip)
  const handleFileChange = async (file: File) => {
    setIsReadingFile(true);
    try {
      const parsed = await parseUploadedFile(file);
      setAttachedFile(parsed);

      if (parsed.textContent && parsed.textContent.trim().length > 0) {
        setContextText((prev) => {
          const header = `\n--- [CONTEÚDO EXTRAÍDO DO ARQUIVO: ${parsed.fileName}] ---\n`;
          return prev ? `${prev}\n${header}${parsed.textContent}` : `${header}${parsed.textContent}`;
        });
      }
    } catch (err: any) {
      console.error("Erro ao ler arquivo:", err);
      alert(err.message || "Erro ao processar o arquivo anexado.");
    } finally {
      setIsReadingFile(false);
    }
  };

  // Drag and drop handlers
  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Handle saving recorded video from modal
  const handleSaveRecordedVideo = async (videoBlob: Blob, durationSeconds: number) => {
    setIsReadingFile(true);
    try {
      const parsed = await parseRecordedVideoBlob(videoBlob, `gravacao_video_${durationSeconds}s.webm`);
      setAttachedFile(parsed);
      setContextText((prev) => {
        const header = `\n--- [GRAVAÇÃO DE VÍDEO ANEXADA: ${parsed.fileName} (${durationSeconds}s)] ---\n`;
        return prev ? `${prev}\n${header}${parsed.textContent}` : `${header}${parsed.textContent}`;
      });
    } catch (err: any) {
      console.error("Erro ao salvar vídeo gravado:", err);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleClearForm = () => {
    setContextText("");
    setProjectName("");
    setEpicName("");
    setRequester("");
    setDueDate("");
    setExtraInstructions("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContextText((prev) => (prev ? `${prev}\n${text}` : text));
      }
    } catch {
      // Fallback
    }
  };

  // Submit Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextText.trim() || isGenerating) return;

    let imagesPayload: Array<{ mimeType: string; base64Data: string; fileName?: string }> | undefined = undefined;
    if (attachedFile && attachedFile.isImage && attachedFile.base64Data && attachedFile.mimeType) {
      let mime = attachedFile.mimeType;
      if (mime === "image/jpg" || mime === "image/pjpeg") mime = "image/jpeg";
      const cleanBase64 = attachedFile.base64Data.replace(/^data:[^;]+;base64,/, "").trim();

      imagesPayload = [
        {
          mimeType: mime,
          base64Data: cleanBase64,
          fileName: attachedFile.fileName,
        },
      ];
    }

    await onGenerateStory(
      contextText,
      projectName,
      epicName,
      requester,
      extraInstructions,
      imagesPayload,
      activeProvider,
      activeModel
    );
  };

  // Re-run story validation tests on demand and trigger toast feedback
  const handleReRunStoryValidation = () => {
    if (!currentStory) return;
    const report = validateUserStory(currentStory);
    const updated = {
      ...currentStory,
      validationReport: report,
    };
    onStoryChange(updated);

    setValidationToast({
      show: true,
      score: report.scorePercent,
      passed: report.passedCount,
      total: report.totalTests,
    });

    setTimeout(() => {
      setValidationToast(null);
    }, 5000);
  };

  // Export story as a professional PDF document
  const handleExportPDF = () => {
    if (!currentStory) return;
    const report = validateUserStory(currentStory);
    const updated = {
      ...currentStory,
      validationReport: report,
    };
    onStoryChange(updated);
    generateStoryPDF(updated);
  };

  // Pre-generation scope validation metrics
  const scopeCharCount = contextText.trim().length;
  const scopeWordCount = contextText.trim() ? contextText.trim().split(/\s+/).length : 0;
  const isScopeLengthValid = scopeCharCount >= 15;

  // Copy helpers
  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Format Jira Syntax
  const generateJiraFormat = (story: UserStory): string => {
    let jira = `h1. ${story.title}\n\n`;
    if (story.dueDate) {
      jira += `*Prazo de Entrega:* ${story.dueDate}\n\n`;
    }
    jira += `*História de Usuário:*\n`;
    jira += `* *Como* ${story.story.role}\n`;
    jira += `* *Quero* ${story.story.want}\n`;
    jira += `* *Para* ${story.story.soThat}\n\n`;

    jira += `h2. Contexto de Negócio\n${story.context}\n\n`;

    jira += `h2. Critérios de Aceitação\n`;
    story.acceptanceCriteria?.forEach((ac) => {
      jira += `# *${ac.id}:* ${ac.text}\n`;
    });
    jira += `\n`;

    jira += `h2. Regras de Negócio\n`;
    story.businessRules?.forEach((rn) => {
      jira += `# *${rn.id}:* ${rn.text}\n`;
    });
    jira += `\n`;

    jira += `h2. Cenários BDD (Gherkin)\n`;
    story.bddScenarios?.forEach((sc, i) => {
      jira += `h3. Cenário ${i + 1}: ${sc.title}\n`;
      jira += `{code:gherkin}\n`;
      jira += `${sc.given}\n`;
      jira += `${sc.when}\n`;
      jira += `${sc.then}\n`;
      jira += `{code}\n\n`;
    });

    if (story.epicNote) {
      jira += `{color:red}*Aviso:* ${story.epicNote}{color}\n`;
    }

    return jira;
  };

  // Interactive Story Handlers
  const updateStoryAndValidate = (updatedStory: UserStory) => {
    const newReport = validateUserStory(updatedStory);
    onStoryChange({
      ...updatedStory,
      validationReport: newReport,
    });
  };

  const handleUpdateStoryField = (field: "role" | "want" | "soThat", val: string) => {
    if (!currentStory) return;
    updateStoryAndValidate({
      ...currentStory,
      story: {
        ...currentStory.story,
        [field]: val,
      },
    });
  };

  const handleUpdateAC = (index: number, newText: string) => {
    if (!currentStory) return;
    const newACs = [...currentStory.acceptanceCriteria];
    newACs[index].text = newText;
    updateStoryAndValidate({ ...currentStory, acceptanceCriteria: newACs });
  };

  const handleToggleACDone = (index: number) => {
    if (!currentStory) return;
    const newACs = [...currentStory.acceptanceCriteria];
    newACs[index].done = !newACs[index].done;
    updateStoryAndValidate({ ...currentStory, acceptanceCriteria: newACs });
  };

  const handleAddAC = () => {
    if (!currentStory) return;
    const nextNum = currentStory.acceptanceCriteria.length + 1;
    const nextId = `AC${String(nextNum).padStart(2, "0")}`;
    updateStoryAndValidate({
      ...currentStory,
      acceptanceCriteria: [
        ...currentStory.acceptanceCriteria,
        { id: nextId, text: "Novo critério de aceitação observável e testável..." },
      ],
    });
  };

  const handleDeleteAC = (index: number) => {
    if (!currentStory) return;
    const newACs = currentStory.acceptanceCriteria.filter((_, i) => i !== index);
    updateStoryAndValidate({ ...currentStory, acceptanceCriteria: newACs });
  };

  const handleUpdateRN = (index: number, newText: string) => {
    if (!currentStory) return;
    const newRNs = [...currentStory.businessRules];
    newRNs[index].text = newText;
    updateStoryAndValidate({ ...currentStory, businessRules: newRNs });
  };

  const handleAddRN = () => {
    if (!currentStory) return;
    const nextNum = currentStory.businessRules.length + 1;
    const nextId = `RN${String(nextNum).padStart(2, "0")}`;
    updateStoryAndValidate({
      ...currentStory,
      businessRules: [
        ...currentStory.businessRules,
        { id: nextId, text: "Nova regra de negócio complementar..." },
      ],
    });
  };

  const handleDeleteRN = (index: number) => {
    if (!currentStory) return;
    const newRNs = currentStory.businessRules.filter((_, i) => i !== index);
    updateStoryAndValidate({ ...currentStory, businessRules: newRNs });
  };

  const handleAddBDD = () => {
    if (!currentStory) return;
    updateStoryAndValidate({
      ...currentStory,
      bddScenarios: [
        ...currentStory.bddScenarios,
        {
          title: "Novo Cenário BDD",
          given: "Dado que o usuário está na tela inicial",
          when: "Quando executa a ação principal",
          then: "Então o sistema deve processar o resultado esperado",
        },
      ],
    });
  };

  const handleDeleteBDD = (index: number) => {
    if (!currentStory) return;
    const newBDDs = currentStory.bddScenarios.filter((_, i) => i !== index);
    updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
  };

  const handleSaveBacklog = () => {
    if (!currentStory) return;
    onSaveToBacklog(currentStory);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const currentDeadline = currentStory ? getStoryDeadlineStatus(currentStory.dueDate) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Scope Text Box & File Upload (5 cols) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/40 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-100">Escopo & Contexto do Requisito</h2>
                <p className="text-[11px] text-slate-400 font-medium">Insira as informações do seu requisito real</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearForm}
              className="text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-sm active:scale-95"
              title="Limpar formulário e reiniciar estúdio"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* AI Engine & LLM Model Selector */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-200 flex items-center space-x-1.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Motor de IA Vinculado (LLM)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-md">
                  {activeProvider === "gemini" ? "Google GenAI" : "OpenAI ChatGPT"}
                </span>
              </div>

              {/* Provider Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleProviderChange("gemini")}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                    activeProvider === "gemini"
                      ? "bg-slate-800 text-indigo-300 shadow-sm border border-indigo-500/40 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Google Gemini</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange("openai")}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                    activeProvider === "openai"
                      ? "bg-slate-800 text-emerald-300 shadow-sm border border-emerald-500/40 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ChatGPT (OpenAI)</span>
                </button>
              </div>

              {/* Model Options for Active Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                {AVAILABLE_MODELS.filter((m) => m.provider === activeProvider).map((modelOpt) => {
                  const isSelected = activeModel === modelOpt.id;
                  return (
                    <button
                      key={modelOpt.id}
                      type="button"
                      onClick={() => handleModelChange(modelOpt.id)}
                      className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? activeProvider === "gemini"
                            ? "bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-sm ring-1 ring-indigo-500/50"
                            : "bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm ring-1 ring-emerald-500/50"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                          <span>{modelOpt.name}</span>
                        </span>
                        {modelOpt.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? activeProvider === "gemini"
                                ? "bg-indigo-900 text-indigo-300 border border-indigo-700"
                                : "bg-emerald-900 text-emerald-300 border border-emerald-700"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {modelOpt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                        {modelOpt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metadata Fields: Nome do Projeto & Épico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ex: Banking Mobile"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Épico / Módulo</label>
                <input
                  type="text"
                  value={epicName}
                  onChange={(e) => setEpicName(e.target.value)}
                  placeholder="Ex: Autenticação & Pix"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
              </div>
            </div>

            {/* Scope Text Box Header & Actions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Escopo Bruto do Requisito</span>
                </label>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[10px] text-indigo-300 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-700/60"
                >
                  <span>Colar</span>
                </button>
              </div>

              {/* Text Area */}
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                rows={7}
                placeholder="Cole aqui o escopo do requisito, ata de reunião, regras de negócio ou especificações brutas..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed resize-y transition shadow-inner"
              />

              {/* Text Stats */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
                <span>
                  {scopeWordCount} palavras • {scopeCharCount} caracteres
                </span>
                {isScopeLengthValid ? (
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Tamanho ideal</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    Mínimo: 15 caracteres
                  </span>
                )}
              </div>
            </div>

            {/* File Upload / Drag & Drop Area */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                Anexar Arquivo ou Especificação:
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv,.xlsx,.xls,.ods,.zip,.rar,.mp4,.webm,.mov,.avi,.mkv,.doc,.docx,.pdf,image/*,video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Main Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropFile}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border border-dashed rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center space-x-2 ${
                  isDragOver
                    ? "border-indigo-400 bg-indigo-950/60"
                    : "border-slate-700 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-950"
                }`}
              >
                {isReadingFile ? (
                  <div className="flex items-center space-x-2 text-indigo-400 text-xs py-0.5 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processando arquivo...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                      <Upload className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      <span className="font-bold text-indigo-400">Clique para anexar</span> ou arraste (Excel, CSV, DOC, PDF, Imagem)
                    </span>
                  </div>
                )}
              </div>

              {/* Attached File Pill */}
              {attachedFile && (
                <div className="bg-indigo-950/60 border border-indigo-700/60 rounded-xl p-2.5 space-y-2 text-xs text-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      {attachedFile.isSpreadsheet ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : attachedFile.isZip ? (
                        <FolderArchive className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : attachedFile.isVideo ? (
                        <Video className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}

                      <div className="truncate">
                        <p className="font-bold text-slate-100 truncate">{attachedFile.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {attachedFile.fileSizeFormatted} • {attachedFile.fileType}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-1 hover:bg-indigo-900 text-slate-400 hover:text-rose-400 rounded-lg transition shrink-0 cursor-pointer"
                      title="Remover anexo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Video Player Preview if Video is Attached */}
                  {attachedFile.isVideo && attachedFile.videoUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video max-h-36 mx-auto">
                      <video
                        src={attachedFile.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Extra Focus Instructions */}
            <div>
              <input
                type="text"
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="Foco Adicional (Opcional): ex. Dar atenção às normas Bacen ou LGPD"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={!contextText.trim() || isGenerating}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Gerando História & Testes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Gerar História & Executar Validações</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: User Story Output & Interactive Editor & Validation Tests (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        {currentStory ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/40 space-y-5 backdrop-blur-md">
            {/* Top Bar Controls */}
            <div className="space-y-3.5 border-b border-slate-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase whitespace-nowrap shrink-0">
                    Incremento Gerado
                  </span>
                  {currentStory.projectName && (
                    <span className="text-xs text-slate-200 font-bold whitespace-nowrap truncate max-w-[200px]">
                      {currentStory.projectName}
                    </span>
                  )}
                  {currentStory.dueDate && currentDeadline && (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 whitespace-nowrap ${currentDeadline.badgeClass}`}>
                      {currentDeadline.status === "overdue" ? (
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                      ) : currentDeadline.status === "due_today" ? (
                        <Flame className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-orange-400" />
                      )}
                      <span>Prazo: {currentStory.dueDate} ({currentDeadline.label})</span>
                    </span>
                  )}
                  {currentStory.attachedFileName && (
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium px-2.5 py-0.5 rounded-full truncate max-w-[180px] whitespace-nowrap">
                      📎 {currentStory.attachedFileName}
                    </span>
                  )}
                  {currentStory.usedProvider && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 whitespace-nowrap ${
                        currentStory.usedProvider === "openai"
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                          : "bg-indigo-950/80 text-indigo-300 border-indigo-700/60"
                      }`}
                    >
                      <Bot className="w-3 h-3" />
                      <span>
                        {currentStory.usedProvider === "openai" ? "OpenAI" : "Gemini"} •{" "}
                        {currentStory.usedModel || "Default"}
                      </span>
                    </span>
                  )}
                </div>

                {/* Mode Switchers */}
                <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-xl flex items-center shrink-0">
                  <button
                    onClick={() => setViewMode("interactive")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                      viewMode === "interactive"
                        ? "bg-slate-800 text-indigo-300 font-bold shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Interativo
                  </button>
                  <button
                    onClick={() => setViewMode("markdown")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                      viewMode === "markdown"
                        ? "bg-slate-800 text-indigo-300 font-bold shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setViewMode("jira")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                      viewMode === "jira"
                        ? "bg-slate-800 text-indigo-300 font-bold shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    JIRA Syntax
                  </button>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleReRunStoryValidation}
                  title="Executar testes de validação automática"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center space-x-1.5 text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer whitespace-nowrap shrink-0 active:scale-98"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="whitespace-nowrap">Validar História</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  title="Gerar e baixar o PDF do produto final com laudo técnico"
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl transition-all flex items-center space-x-1.5 text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer whitespace-nowrap shrink-0 active:scale-98"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Baixar PDF Final</span>
                </button>

                <button
                  onClick={onOpenRefineModal}
                  title="Refinar com IA"
                  className="px-3 py-2 bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="whitespace-nowrap">Refinar</span>
                </button>

                <button
                  onClick={onOpenAuditModal}
                  title="Auditoria INVEST"
                  className="px-3 py-2 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="whitespace-nowrap">INVEST</span>
                </button>

                <button
                  onClick={handleSaveBacklog}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 active:scale-98 ${
                    savedFeedback
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700"
                  }`}
                >
                  {savedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span className="whitespace-nowrap">Salvo no Quadro!</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span className="whitespace-nowrap">Salvar no Quadro</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Validation Banner Toast Notification */}
            {validationToast && (
              <div className="bg-emerald-950/80 border border-emerald-700 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in duration-300 shadow-md">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-100">Validação de Qualidade Concluída!</span>
                    <p className="text-[11px] text-emerald-300 font-medium">
                      Resultado: <strong className="text-emerald-100">{validationToast.score}% de Aprovação</strong> ({validationToast.passed} de {validationToast.total} testes passaram)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 shadow-sm cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </button>
              </div>
            )}

            {/* Validation Tests Card Component */}
            <ValidationTestsCard
              report={currentStory.validationReport}
              onReRunTests={handleReRunStoryValidation}
              onExportPDF={handleExportPDF}
            />

            {/* VIEW MODE: INTERACTIVE */}
            {viewMode === "interactive" && (
              <div className="space-y-6">
                {/* Title and Metadata Grid */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1.5">
                      Título do Incremento
                    </label>
                    <input
                      type="text"
                      value={currentStory.title}
                      onChange={(e) =>
                        updateStoryAndValidate({ ...currentStory, title: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition"
                    />
                  </div>

                  {/* Metadata Row: Story Points + Prazo de Entrega (Due Date) + Solicitante */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1 flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Story Points (Fibonacci)</span>
                      </label>
                      <select
                        value={currentStory.storyPoints || ""}
                        onChange={(e) =>
                          updateStoryAndValidate({
                            ...currentStory,
                            storyPoints: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer shadow-inner"
                      >
                        <option value="">Não estimado</option>
                        <option value="1">1 pt (Muito simples)</option>
                        <option value="2">2 pts (Simples)</option>
                        <option value="3">3 pts (Médio)</option>
                        <option value="5">5 pts (Complexo)</option>
                        <option value="8">8 pts (Muito complexo)</option>
                        <option value="13">13 pts (Épico/Grande)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>Prazo de Entrega (Lembrete)</span>
                      </label>
                      <input
                        type="date"
                        value={currentStory.dueDate || ""}
                        onChange={(e) =>
                          updateStoryAndValidate({
                            ...currentStory,
                            dueDate: e.target.value || undefined,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 shadow-inner cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1 flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-indigo-400" />
                        <span>Solicitante / PO</span>
                      </label>
                      <input
                        type="text"
                        value={currentStory.requester || ""}
                        onChange={(e) =>
                          updateStoryAndValidate({
                            ...currentStory,
                            requester: e.target.value || undefined,
                          })
                        }
                        placeholder="Ex: Product Owner / Negócio"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* User Story Card (Como, Quero, Para) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Estrutura Ágil (User Story)</span>
                    </span>
                    <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-700/60">
                      Padrão Scrum
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-indigo-300 bg-indigo-950 px-2 py-1 rounded-md border border-indigo-800 w-16 text-center shrink-0">
                        Como
                      </span>
                      <input
                        type="text"
                        value={currentStory.story.role}
                        onChange={(e) => handleUpdateStoryField("role", e.target.value)}
                        placeholder="papel do usuário..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition"
                      />
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-indigo-300 bg-indigo-950 px-2 py-1 rounded-md border border-indigo-800 w-16 text-center shrink-0">
                        Quero
                      </span>
                      <input
                        type="text"
                        value={currentStory.story.want}
                        onChange={(e) => handleUpdateStoryField("want", e.target.value)}
                        placeholder="funcionalidade / entrega..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition"
                      />
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-indigo-300 bg-indigo-950 px-2 py-1 rounded-md border border-indigo-800 w-16 text-center shrink-0">
                        Para
                      </span>
                      <input
                        type="text"
                        value={currentStory.story.soThat}
                        onChange={(e) => handleUpdateStoryField("soThat", e.target.value)}
                        placeholder="valor / objetivo de negócio..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Context Paragraph */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1.5">
                    Contexto & Detalhamento do Requisito
                  </label>
                  <textarea
                    value={currentStory.context}
                    onChange={(e) =>
                      updateStoryAndValidate({ ...currentStory, context: e.target.value })
                    }
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition font-sans"
                  />
                </div>

                {/* Acceptance Criteria (AC) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Critérios de Aceitação ({currentStory.acceptanceCriteria?.length || 0})</span>
                    </label>
                    <button
                      onClick={handleAddAC}
                      className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar AC</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentStory.acceptanceCriteria?.map((ac, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-start space-x-2.5 group shadow-inner transition"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleACDone(idx)}
                          className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition shrink-0 cursor-pointer ${
                            ac.done
                              ? "bg-emerald-500 border-emerald-500 text-slate-950"
                              : "border-slate-600 bg-slate-900 hover:border-emerald-400"
                          }`}
                        >
                          {ac.done && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span className="text-xs font-extrabold text-emerald-400 shrink-0 mt-0.5 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          {ac.id}
                        </span>
                        <textarea
                          value={ac.text}
                          onChange={(e) => handleUpdateAC(idx, e.target.value)}
                          rows={2}
                          className={`flex-1 bg-slate-900 text-xs focus:outline-none p-2 rounded-lg border border-slate-800 focus:border-indigo-500 transition ${
                            ac.done ? "line-through text-slate-500 bg-slate-950" : "text-slate-200 font-medium"
                          }`}
                        />
                        <button
                          onClick={() => handleDeleteAC(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Rules (RN) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Regras de Negócio ({currentStory.businessRules?.length || 0})</span>
                    </label>
                    <button
                      onClick={handleAddRN}
                      className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar RN</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentStory.businessRules?.map((rn, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-start space-x-2.5 group shadow-inner transition"
                      >
                        <span className="text-xs font-extrabold text-cyan-400 shrink-0 mt-0.5 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                          {rn.id}
                        </span>
                        <textarea
                          value={rn.text}
                          onChange={(e) => handleUpdateRN(idx, e.target.value)}
                          rows={2}
                          className="flex-1 bg-slate-900 text-xs text-slate-200 font-medium focus:outline-none p-2 rounded-lg border border-slate-800 focus:border-indigo-500 transition"
                        />
                        <button
                          onClick={() => handleDeleteRN(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BDD Scenarios */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span>Cenários BDD / Gherkin ({currentStory.bddScenarios?.length || 0})</span>
                    </label>
                    <button
                      onClick={handleAddBDD}
                      className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar BDD</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentStory.bddScenarios?.map((bdd, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative group shadow-inner transition hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <input
                            type="text"
                            value={bdd.title}
                            onChange={(e) => {
                              const newBDDs = [...currentStory.bddScenarios];
                              newBDDs[idx].title = e.target.value;
                              updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                            }}
                            className="bg-slate-900 font-bold text-xs text-indigo-300 border border-slate-800 focus:outline-none focus:border-indigo-500 px-2.5 py-1 rounded-lg shadow-inner"
                          />
                          <button
                            onClick={() => handleDeleteBDD(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="font-mono text-[11px] space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 w-16 text-center shrink-0">
                              Dado
                            </span>
                            <textarea
                              value={bdd.given}
                              onChange={(e) => {
                                const newBDDs = [...currentStory.bddScenarios];
                                newBDDs[idx].given = e.target.value;
                                updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                              }}
                              rows={1}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner font-sans text-xs"
                            />
                          </div>

                          <div className="flex items-start space-x-2">
                            <span className="text-amber-300 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800 w-16 text-center shrink-0">
                              Quando
                            </span>
                            <textarea
                              value={bdd.when}
                              onChange={(e) => {
                                const newBDDs = [...currentStory.bddScenarios];
                                newBDDs[idx].when = e.target.value;
                                updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                              }}
                              rows={1}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner font-sans text-xs"
                            />
                          </div>

                          <div className="flex items-start space-x-2">
                            <span className="text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 w-16 text-center shrink-0">
                              Então
                            </span>
                            <textarea
                              value={bdd.then}
                              onChange={(e) => {
                                const newBDDs = [...currentStory.bddScenarios];
                                newBDDs[idx].then = e.target.value;
                                updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                              }}
                              rows={1}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner font-sans text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Epic Note Callout */}
                {currentStory.epicNote && (
                  <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 flex items-start space-x-3 text-amber-200 shadow-md">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-100 text-xs">
                        Observação de Múltiplos Incrementos (Épico)
                      </div>
                      <p className="text-xs text-amber-300 mt-0.5 font-medium">{currentStory.epicNote}</p>
                    </div>
                  </div>
                )}

                {/* Clarification Questions */}
                {currentStory.clarificationQuestions && currentStory.clarificationQuestions.length > 0 && (
                  <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-2xl p-4 space-y-2 shadow-md">
                    <div className="flex items-center space-x-2 text-indigo-200 font-bold text-xs">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      <span>Dúvidas para Esclarecimento com o PO / Negócio:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-indigo-300 list-disc list-inside font-medium">
                      {currentStory.clarificationQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE: MARKDOWN */}
            {viewMode === "markdown" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    Markdown estruturado estritamente conforme regras ágeis
                  </span>
                  <button
                    onClick={() => handleCopy(currentStory.rawMarkdown, "Markdown")}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    {copiedFormat === "Markdown" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Markdown</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={currentStory.rawMarkdown}
                  onChange={(e) =>
                    updateStoryAndValidate({ ...currentStory, rawMarkdown: e.target.value })
                  }
                  rows={20}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
              </div>
            )}

            {/* VIEW MODE: JIRA SYNTAX */}
            {viewMode === "jira" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    Sintaxe adaptada para colagem direta no Atlassian JIRA / Confluence
                  </span>
                  <button
                    onClick={() => handleCopy(generateJiraFormat(currentStory), "JIRA")}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    {copiedFormat === "JIRA" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Formato JIRA</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  readOnly
                  value={generateJiraFormat(currentStory)}
                  rows={20}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none shadow-inner"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl shadow-black/40 backdrop-blur-md">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 shadow-sm">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Nenhuma História Gerada Ainda</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Digite ou cole o escopo na caixa de texto ao lado ou anexe um arquivo para a IA estruturar o incremento e rodar os testes de validação.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Video Recorder Modal */}
      <VideoRecorderModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSaveVideo={handleSaveRecordedVideo}
      />
    </div>
  );
};
