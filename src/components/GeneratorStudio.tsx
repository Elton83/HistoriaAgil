import React, { useState, useRef } from "react";
import { UserStory, ContextPreset } from "../types";
import { SAMPLE_PRESETS } from "../data/presets";
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
    images?: Array<{ mimeType: string; base64Data: string; fileName?: string }>
  ) => Promise<void>;
  isGenerating: boolean;
  onSaveToBacklog: (story: UserStory) => void;
  onOpenRefineModal: () => void;
  onOpenAuditModal: () => void;
  onResetSystem?: () => void;
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
}) => {
  // Input state
  const [contextText, setContextText] = useState("");
  const [projectName, setProjectName] = useState("");
  const [epicName, setEpicName] = useState("");
  const [requester, setRequester] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Clear form completely for real data entry
  const handleClearForm = () => {
    setContextText("");
    setProjectName("");
    setEpicName("");
    setRequester("");
    setExtraInstructions("");
    setSelectedPresetId(null);
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onStoryChange(null);
  };

  // File Upload State
  const [attachedFile, setAttachedFile] = useState<ParsedFileInfo | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [viewMode, setViewMode] = useState<"interactive" | "markdown" | "jira">("interactive");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [validationToast, setValidationToast] = useState<{
    show: boolean;
    score: number;
    passed: number;
    total: number;
  } | null>(null);

  // Process Recorded Video
  const handleSaveRecordedVideo = async (blob: Blob, customFileName: string) => {
    setIsReadingFile(true);
    try {
      const parsed = await parseRecordedVideoBlob(blob, customFileName);
      setAttachedFile(parsed);
      if (parsed.textContent) {
        setContextText((prev) =>
          prev.trim()
            ? `${prev}\n\n--- Gravação de Vídeo Anexada ---\n${parsed.textContent}`
            : parsed.textContent || ""
        );
      }
    } catch (err) {
      console.error("Erro ao salvar gravação de vídeo:", err);
      alert("Erro ao processar a gravação de vídeo.");
    } finally {
      setIsReadingFile(false);
    }
  };

  // Load a preset
  const handleLoadPreset = (preset: ContextPreset) => {
    setSelectedPresetId(preset.id);
    setContextText(preset.contextText);
    setProjectName(preset.projectName);
    setEpicName(preset.epicName);
  };

  // Process File Selection
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setIsReadingFile(true);
    try {
      const parsed = await parseUploadedFile(file);
      setAttachedFile(parsed);

      if (parsed.textContent && !parsed.isImage) {
        // Append or replace text content
        setContextText((prev) =>
          prev.trim()
            ? `${prev}\n\n--- Conteúdo do Arquivo (${parsed.fileName}) ---\n${parsed.textContent}`
            : parsed.textContent || ""
        );
      }
    } catch (err) {
      console.error("Erro ao ler arquivo:", err);
      alert("Não foi possível ler o arquivo selecionado. Verifique o formato.");
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearContext = () => {
    setContextText("");
    setAttachedFile(null);
    setSelectedPresetId(null);
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
      imagesPayload = [
        {
          mimeType: attachedFile.mimeType,
          base64Data: attachedFile.base64Data,
          fileName: attachedFile.fileName,
        },
      ];
    }

    await onGenerateStory(contextText, projectName, epicName, requester, extraInstructions, imagesPayload);
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
    // Always calculate fresh validation before generating PDF
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

  const ambiguousInPrompt = ["fácil", "rápido", "amigável", "intuitivo", "bonito"].filter((word) =>
    contextText.toLowerCase().includes(word)
  );

  // Copy helpers
  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Format Jira Syntax
  const generateJiraFormat = (story: UserStory): string => {
    let jira = `h1. ${story.title}\n\n`;
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

  // Interactive Story Handlers (re-runs validation tests automatically)
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
        { id: nextId, text: "Novo critério de aceitação observável..." },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Scope Text Box & File Upload (5 cols) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white">Escopo & Contexto do Requisito</h2>
                <p className="text-[11px] text-slate-400 font-medium">Insira as informações do seu requisito real</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearForm}
              className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-sm active:scale-95"
              title="Limpar formulário e reiniciar estúdio"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Limpar Formulário</span>
            </button>
          </div>

          {/* Compact Example Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">
                Exemplos Rápido (1-Clique):
              </label>
              {selectedPresetId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(null);
                    setContextText("");
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-medium cursor-pointer"
                >
                  Limpar seleção
                </button>
              )}
            </div>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLoadPreset(p)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${
                    selectedPresetId === p.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-sm font-semibold"
                      : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                  title={p.title}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5">
            {/* Metadata Fields: Projeto e Demandante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Projeto / Sistema</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ex: Banking Mobile"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Demandante / Solicitante</label>
                <input
                  type="text"
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  placeholder="Ex: Ana Paula (GPM)"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Scope Text Box Header & Actions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Escopo Bruto do Requisito</span>
                </label>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[10px] text-indigo-400 font-medium hover:underline flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>Colar</span>
                </button>
              </div>

              {/* Text Area */}
              <textarea
                value={contextText}
                onChange={(e) => {
                  setContextText(e.target.value);
                  setSelectedPresetId(null);
                }}
                rows={8}
                placeholder="Cole aqui o escopo do requisito, ata de reunião, regras de negócio ou especificações brutas..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed resize-y transition"
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

            {/* File Upload / Drag & Drop & Video Recording Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Anexar Arquivo ou Gravar Vídeo:
                </label>
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span className="text-emerald-400 font-medium">Planilhas</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-medium">ZIP</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400 font-medium">Vídeos</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-indigo-400 font-medium">Docs/Imagens</span>
                </div>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
                {/* Main Drag & Drop Zone (3 cols) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={`sm:col-span-3 border border-dashed rounded-xl p-2 text-center cursor-pointer transition flex items-center justify-center space-x-2 ${
                    isDragOver
                      ? "border-indigo-400 bg-indigo-950/40"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950"
                  }`}
                >
                  {isReadingFile ? (
                    <div className="flex items-center space-x-2 text-indigo-400 text-xs py-0.5 font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando arquivo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                      <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                      <span>
                        <span className="font-semibold text-indigo-400">Anexar arquivo</span> (Excel, CSV, ZIP, Doc, Imagem)
                      </span>
                    </div>
                  )}
                </div>

                {/* Video Recording Trigger Button (1 col) */}
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="sm:col-span-1 border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 rounded-xl p-2 text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Gravar vídeo com explicação do requisito via câmera ou tela"
                >
                  <Camera className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Gravar Vídeo</span>
                </button>
              </div>

              {/* Attached File Pill */}
              {attachedFile && (
                <div className="bg-slate-950 border border-indigo-800/80 rounded-xl p-2.5 space-y-2 text-xs text-indigo-200">
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
                        <p className="font-bold text-white truncate">{attachedFile.fileName}</p>
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
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition shrink-0 cursor-pointer"
                      title="Remover anexo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Video Player Preview if Video is Attached */}
                  {attachedFile.isVideo && attachedFile.videoUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video max-h-36 mx-auto">
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
                placeholder="Foco Adicional (Opcional): ex. Dar atenção às normas Bacen"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={!contextText.trim() || isGenerating}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition cursor-pointer mt-1"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            {/* Top Bar Controls */}
            <div className="space-y-3 border-b border-slate-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase whitespace-nowrap shrink-0">
                    Incremento Gerado
                  </span>
                  {currentStory.projectName && (
                    <span className="text-xs text-slate-300 font-semibold whitespace-nowrap truncate max-w-[200px]">
                      {currentStory.projectName}
                    </span>
                  )}
                  {currentStory.attachedFileName && (
                    <span className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] px-2.5 py-0.5 rounded-full truncate max-w-[180px] whitespace-nowrap">
                      📎 {currentStory.attachedFileName}
                    </span>
                  )}
                </div>

                {/* Mode Switchers */}
                <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-xl flex items-center shrink-0">
                  <button
                    onClick={() => setViewMode("interactive")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                      viewMode === "interactive"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Interativo
                  </button>
                  <button
                    onClick={() => setViewMode("markdown")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                      viewMode === "markdown"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setViewMode("jira")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                      viewMode === "jira"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
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
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-md cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="whitespace-nowrap">Validar História</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  title="Gerar e baixar o PDF do produto final com laudo técnico"
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-md cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Baixar PDF Final</span>
                </button>

                <button
                  onClick={onOpenRefineModal}
                  title="Refinar com IA"
                  className="px-3 py-2 bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-900 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="whitespace-nowrap">Refinar</span>
                </button>

                <button
                  onClick={onOpenAuditModal}
                  title="Auditoria INVEST"
                  className="px-3 py-2 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="whitespace-nowrap">INVEST</span>
                </button>

                <button
                  onClick={handleSaveBacklog}
                  className={`px-3 py-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    savedFeedback
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  }`}
                >
                  {savedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span className="whitespace-nowrap">Salvo!</span>
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
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in duration-300 shadow-sm">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950">Validação de Qualidade Concluída!</span>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Resultado: <strong className="text-emerald-900">{validationToast.score}% de Aprovação</strong> ({validationToast.passed} de {validationToast.total} testes passaram)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 shadow-sm cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF Agora</span>
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
                {/* Title Section */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                    Título do Incremento
                  </label>
                  <input
                    type="text"
                    value={currentStory.title}
                    onChange={(e) =>
                      updateStoryAndValidate({ ...currentStory, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Demandante / Solicitante Banner Card */}
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                        Demandante / Solicitante da História
                      </label>
                      <input
                        type="text"
                        value={currentStory.requester || ""}
                        onChange={(e) =>
                          updateStoryAndValidate({ ...currentStory, requester: e.target.value })
                        }
                        placeholder="Ex: Ana Paula Costa - GPM de Pagamentos"
                        className="w-full sm:w-80 bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm mt-0.5"
                      />
                    </div>
                  </div>
                  <span className="inline-self-start sm:self-auto text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg">
                    Requisito Homologado
                  </span>
                </div>

                {/* User Story Card (Como, Quero, Para) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      História de Usuário (User Story)
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Padrão Agile / Scrum</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-indigo-800 w-12 shrink-0">Como</span>
                      <input
                        type="text"
                        value={currentStory.story.role}
                        onChange={(e) => handleUpdateStoryField("role", e.target.value)}
                        placeholder="papel do usuário..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-indigo-800 w-12 shrink-0">Quero</span>
                      <input
                        type="text"
                        value={currentStory.story.want}
                        onChange={(e) => handleUpdateStoryField("want", e.target.value)}
                        placeholder="funcionalidade / entrega..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-indigo-800 w-12 shrink-0">Para</span>
                      <input
                        type="text"
                        value={currentStory.story.soThat}
                        onChange={(e) => handleUpdateStoryField("soThat", e.target.value)}
                        placeholder="valor / objetivo de negócio..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Context Paragraph */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                    Contexto do Requisito
                  </label>
                  <textarea
                    value={currentStory.context}
                    onChange={(e) =>
                      updateStoryAndValidate({ ...currentStory, context: e.target.value })
                    }
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-sans"
                  />
                </div>

                {/* Acceptance Criteria (AC) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Critérios de Aceitação ({currentStory.acceptanceCriteria?.length || 0})</span>
                    </label>
                    <button
                      onClick={handleAddAC}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-300 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar AC</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentStory.acceptanceCriteria?.map((ac, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start space-x-2.5 group shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleACDone(idx)}
                          className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition shrink-0 cursor-pointer ${
                            ac.done
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-400 bg-white hover:border-emerald-500"
                          }`}
                        >
                          {ac.done && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span className="text-xs font-bold text-emerald-700 shrink-0 mt-0.5">
                          {ac.id}
                        </span>
                        <textarea
                          value={ac.text}
                          onChange={(e) => handleUpdateAC(idx, e.target.value)}
                          rows={2}
                          className={`flex-1 bg-white text-xs focus:outline-none p-1.5 rounded border border-slate-300 focus:border-indigo-500 ${
                            ac.done ? "line-through text-slate-400 bg-slate-100" : "text-slate-800 font-medium"
                          }`}
                        />
                        <button
                          onClick={() => handleDeleteAC(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
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
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-600" />
                      <span>Regras de Negócio ({currentStory.businessRules?.length || 0})</span>
                    </label>
                    <button
                      onClick={handleAddRN}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-300 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar RN</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentStory.businessRules?.map((rn, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start space-x-2.5 group shadow-sm"
                      >
                        <span className="text-xs font-bold text-cyan-700 shrink-0 mt-0.5">
                          {rn.id}
                        </span>
                        <textarea
                          value={rn.text}
                          onChange={(e) => handleUpdateRN(idx, e.target.value)}
                          rows={2}
                          className="flex-1 bg-white text-xs text-slate-800 font-medium focus:outline-none p-1.5 rounded border border-slate-300 focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleDeleteRN(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
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
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-indigo-600" />
                      <span>Cenários BDD / Gherkin ({currentStory.bddScenarios?.length || 0})</span>
                    </label>
                    <button
                      onClick={handleAddBDD}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-300 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar BDD</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentStory.bddScenarios?.map((bdd, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative group shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <input
                            type="text"
                            value={bdd.title}
                            onChange={(e) => {
                              const newBDDs = [...currentStory.bddScenarios];
                              newBDDs[idx].title = e.target.value;
                              updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                            }}
                            className="bg-white font-bold text-xs text-indigo-900 border border-slate-300 focus:outline-none focus:border-indigo-500 px-2 py-0.5 rounded shadow-sm"
                          />
                          <button
                            onClick={() => handleDeleteBDD(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="font-mono text-[11px] space-y-1.5">
                          <div className="flex items-start space-x-2">
                            <span className="text-cyan-700 font-bold w-12 shrink-0">Dado</span>
                            <textarea
                              value={bdd.given}
                              onChange={(e) => {
                                const newBDDs = [...currentStory.bddScenarios];
                                newBDDs[idx].given = e.target.value;
                                updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                              }}
                              rows={1}
                              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                            />
                          </div>

                          <div className="flex items-start space-x-2">
                            <span className="text-cyan-700 font-bold w-12 shrink-0">Quando</span>
                            <textarea
                              value={bdd.when}
                              onChange={(e) => {
                                const newBDDs = [...currentStory.bddScenarios];
                                newBDDs[idx].when = e.target.value;
                                updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                              }}
                              rows={1}
                              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                            />
                          </div>

                          <div className="flex items-start space-x-2">
                            <span className="text-cyan-700 font-bold w-12 shrink-0">Então</span>
                            <textarea
                              value={bdd.then}
                              onChange={(e) => {
                                const newBDDs = [...currentStory.bddScenarios];
                                newBDDs[idx].then = e.target.value;
                                updateStoryAndValidate({ ...currentStory, bddScenarios: newBDDs });
                              }}
                              rows={2}
                              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Epic Note Callout */}
                {currentStory.epicNote && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950 text-xs">
                        Observação de Múltiplos Incrementos (Épico)
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5 font-medium">{currentStory.epicNote}</p>
                    </div>
                  </div>
                )}

                {/* Clarification Questions */}
                {currentStory.clarificationQuestions && currentStory.clarificationQuestions.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>Dúvidas para Esclarecimento com o PO / Negócio:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-indigo-900 list-disc list-inside font-medium">
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
                  <span className="text-xs text-slate-500 font-mono">
                    Markdown estruturado estritamente conforme regras ágeis
                  </span>
                  <button
                    onClick={() => handleCopy(currentStory.rawMarkdown, "Markdown")}
                    className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer"
                  >
                    {copiedFormat === "Markdown" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            )}

            {/* VIEW MODE: JIRA SYNTAX */}
            {viewMode === "jira" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    Sintaxe adaptada para colagem direta no Atlassian JIRA / Confluence
                  </span>
                  <button
                    onClick={() => handleCopy(generateJiraFormat(currentStory), "JIRA")}
                    className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer"
                  >
                    {copiedFormat === "JIRA" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar Formato JIRA</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  readOnly
                  value={generateJiraFormat(currentStory)}
                  rows={20}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 font-mono leading-relaxed focus:outline-none shadow-sm"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Nenhuma História Gerada Ainda</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
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
