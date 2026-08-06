import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { GeneratorStudio } from "./components/GeneratorStudio";
import { BacklogKanban } from "./components/BacklogKanban";
import { RefineModal } from "./components/RefineModal";
import { InvestAuditModal } from "./components/InvestAuditModal";
import { MethodologyGuideModal } from "./components/MethodologyGuideModal";
import { AuthModal, UserProfile } from "./components/AuthModal";
import { UserStory, StoryStatus, InvestAudit } from "./types";
import { INITIAL_SAMPLE_STORY } from "./data/presets";
import { validateUserStory } from "./utils/storyValidator";
import { isSupabaseConfigured } from "./lib/supabase";
import {
  fetchStoriesFromSupabase,
  saveStoryToSupabase,
  updateStoryStatusInSupabase,
  deleteStoryFromSupabase,
  clearAllStoriesFromSupabase,
} from "./services/supabaseService";
import { CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"generator" | "kanban" | "audit" | "guide">("generator");

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("agile_studio_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Toast / Banner notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("agile_studio_user", JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save user:", e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("agile_studio_user");
  };

  // Stories list in backlog
  const [stories, setStories] = useState<UserStory[]>(() => {
    try {
      const local = localStorage.getItem("agile_studio_stories");
      if (local) {
        const parsed: UserStory[] = JSON.parse(local);
        return parsed.map((s) => ({
          ...s,
          validationReport: s.validationReport || validateUserStory(s),
        }));
      }
      return [{ ...INITIAL_SAMPLE_STORY, validationReport: validateUserStory(INITIAL_SAMPLE_STORY) }];
    } catch {
      return [{ ...INITIAL_SAMPLE_STORY, validationReport: validateUserStory(INITIAL_SAMPLE_STORY) }];
    }
  });

  // Current active story in generator studio
  const [currentStory, setCurrentStory] = useState<UserStory | null>(() => ({
    ...INITIAL_SAMPLE_STORY,
    validationReport: validateUserStory(INITIAL_SAMPLE_STORY),
  }));

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isLoadingStories, setIsLoadingStories] = useState(false);

  // Modal visibility
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Active audit results
  const [currentAudit, setCurrentAudit] = useState<InvestAudit | null>(null);

  // Initial load from Supabase if configured
  useEffect(() => {
    async function loadDataFromSupabase() {
      if (!isSupabaseConfigured()) return;

      setIsLoadingStories(true);
      const result = await fetchStoriesFromSupabase(currentUser?.id);
      setIsLoadingStories(false);

      if (result.isSupabase && !result.error && result.stories.length > 0) {
        const storiesWithReports = result.stories.map((s) => ({
          ...s,
          validationReport: s.validationReport || validateUserStory(s),
        }));
        setStories(storiesWithReports);
        if (!currentStory || currentStory.id === INITIAL_SAMPLE_STORY.id) {
          setCurrentStory(storiesWithReports[0]);
        }
        showToast("Histórias de usuário carregadas do Supabase PostgreSQL!", "info");
      }
    }

    loadDataFromSupabase();
  }, [currentUser?.id]);

  // Sync stories to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem("agile_studio_stories", JSON.stringify(stories));
    } catch (e) {
      console.error("Failed to save stories to localStorage:", e);
    }
  }, [stories]);

  // Handle Tab changes from Header
  const handleTabChange = (tab: "generator" | "kanban" | "audit" | "guide") => {
    if (tab === "guide") {
      setIsGuideModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Generate User Story via Backend API
  const handleGenerateStory = async (
    contextText: string,
    projectName: string,
    epicName: string,
    requester: string,
    extraInstructions: string,
    images?: Array<{ mimeType: string; base64Data: string; fileName?: string }>
  ) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextText,
          projectName,
          epicName,
          requester,
          extraInstructions,
          images,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na geração do requisito via backend.");
      }

      const data = await response.json();
      const structured = data.structured;

      const rawStory: UserStory = {
        id: `story-${Date.now()}`,
        title: structured.title || "Nova História de Usuário",
        story: structured.story || { role: "", want: "", soThat: "" },
        context: structured.context || contextText,
        acceptanceCriteria: structured.acceptanceCriteria || [],
        businessRules: structured.businessRules || [],
        bddScenarios: structured.bddScenarios || [],
        epicNote: structured.epicNote,
        clarificationQuestions: structured.clarificationQuestions,
        rawMarkdown: data.rawMarkdown,
        projectName: projectName || "Projeto Geral",
        epicName: epicName || "Incrementos",
        requester: requester || "Ana Paula Costa - GPM de Pagamentos",
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [projectName || "Requisito", "IA"].filter(Boolean),
        attachedFileName: images && images[0]?.fileName ? images[0].fileName : undefined,
      };

      // Run automatic validation tests
      const validationReport = validateUserStory(rawStory);
      const newStory: UserStory = { ...rawStory, validationReport };

      setCurrentStory(newStory);
    } catch (error) {
      console.error("Error generating story:", error);
      alert("Erro ao comunicar com o servidor de IA. Verifique as configurações e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine current story via Backend API
  const handleRefineStory = async (refinementInstruction: string) => {
    if (!currentStory) return;
    setIsRefining(true);
    try {
      const response = await fetch("/api/refine-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStoryMarkdown: currentStory.rawMarkdown,
          refinementInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha no refinamento da história.");
      }

      const data = await response.json();
      const structured = data.structured;

      const updatedRaw: UserStory = {
        ...currentStory,
        title: structured.title || currentStory.title,
        story: structured.story || currentStory.story,
        context: structured.context || currentStory.context,
        acceptanceCriteria: structured.acceptanceCriteria || currentStory.acceptanceCriteria,
        businessRules: structured.businessRules || currentStory.businessRules,
        bddScenarios: structured.bddScenarios || currentStory.bddScenarios,
        rawMarkdown: data.rawMarkdown,
        updatedAt: new Date().toISOString(),
      };

      const updatedStory: UserStory = {
        ...updatedRaw,
        validationReport: validateUserStory(updatedRaw),
      };

      setCurrentStory(updatedStory);
      setIsRefineModalOpen(false);
    } catch (error) {
      console.error("Error refining story:", error);
      alert("Não foi possível refinar a história. Tente novamente.");
    } finally {
      setIsRefining(false);
    }
  };

  // Audit INVEST via Backend API
  const handleOpenAuditModal = async () => {
    if (!currentStory) return;
    setIsAuditModalOpen(true);
    setIsAuditing(true);
    try {
      const response = await fetch("/api/audit-invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyMarkdown: currentStory.rawMarkdown }),
      });

      if (!response.ok) {
        throw new Error("Falha na auditoria INVEST.");
      }

      const auditData: InvestAudit = await response.json();
      setCurrentAudit(auditData);

      // Save audit score and story points recommendation to story
      if (auditData.estimatedStoryPoints) {
        setCurrentStory({
          ...currentStory,
          storyPoints: auditData.estimatedStoryPoints,
          audit: auditData,
        });
      }
    } catch (error) {
      console.error("Error auditing story:", error);
    } finally {
      setIsAuditing(false);
    }
  };

  // Save story to Kanban backlog (and Supabase)
  const handleSaveToBacklog = async (storyToSave: UserStory) => {
    const storyWithTimestamp = {
      ...storyToSave,
      updatedAt: new Date().toISOString(),
    };

    // Update state locally for instant UI response
    setStories((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === storyToSave.id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex] = storyWithTimestamp;
        return next;
      } else {
        return [storyWithTimestamp, ...prev];
      }
    });

    // Save to Supabase
    if (isSupabaseConfigured()) {
      const res = await saveStoryToSupabase(storyWithTimestamp, currentUser?.id);
      if (res.error) {
        showToast(`Salvo localmente (Erro Supabase: ${res.error})`, "error");
      } else {
        // Update story ID if DB generated UUID
        if (res.story && res.story.id !== storyWithTimestamp.id) {
          setStories((prev) =>
            prev.map((s) => (s.id === storyToSave.id ? res.story : s))
          );
          if (currentStory?.id === storyToSave.id) {
            setCurrentStory(res.story);
          }
        }
        showToast("História salva no Supabase PostgreSQL com sucesso!", "success");
      }
    } else {
      showToast("História salva no backlog (Modo Cache Local)", "info");
    }
  };

  // Update story status in Kanban
  const handleUpdateStatus = async (storyId: string, newStatus: StoryStatus) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s))
    );

    if (isSupabaseConfigured()) {
      const res = await updateStoryStatusInSupabase(storyId, newStatus);
      if (!res.error) {
        showToast("Status da história atualizado no Supabase!", "success");
      }
    }
  };

  // Delete story
  const handleDeleteStory = async (storyId: string) => {
    if (confirm("Tem certeza que deseja excluir esta história do backlog?")) {
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      if (currentStory?.id === storyId) {
        setCurrentStory(null);
      }

      if (isSupabaseConfigured()) {
        const res = await deleteStoryFromSupabase(storyId);
        if (!res.error) {
          showToast("História removida do Supabase PostgreSQL.", "success");
        }
      } else {
        showToast("História removida do backlog.", "info");
      }
    }
  };

  // Reset all system data for real requirements entry
  const handleResetSystem = async () => {
    if (
      confirm(
        "Tem certeza que deseja resetar todas as histórias e limpar a área de trabalho para inserir seus dados e requisitos reais do zero?"
      )
    ) {
      setStories([]);
      setCurrentStory(null);
      localStorage.removeItem("agile_studio_stories");

      if (isSupabaseConfigured()) {
        await clearAllStoriesFromSupabase(currentUser?.id);
        showToast("Todas as histórias foram apagadas do Supabase PostgreSQL.", "info");
      } else {
        showToast("Área de trabalho resetada.", "info");
      }
    }
  };

  // Create empty new story in studio
  const handleCreateNewStory = () => {
    const blank: UserStory = {
      id: `story-${Date.now()}`,
      title: "Nova História de Usuário",
      story: { role: "Usuário do sistema", want: "executar uma ação", soThat: "alcançar um objetivo" },
      context: "Descreva a necessidade de negócio aqui...",
      acceptanceCriteria: [
        { id: "AC01", text: "O sistema deverá validar os dados informados conforme RN01." },
      ],
      businessRules: [
        { id: "RN01", text: "A validação deve garantir a consistência das informações." },
      ],
      bddScenarios: [
        {
          title: "Fluxo Principal",
          given: "Dado que o usuário está na tela inicial",
          when: "Quando confirma o formulário",
          then: "Então o sistema salva o registro e exibe mensagem de sucesso",
        },
      ],
      rawMarkdown: "",
      projectName: "Projeto Geral",
      epicName: "Sprint Backlog",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["Sprint"],
    };

    setCurrentStory(blank);
    setActiveTab("generator");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Global Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        savedStoriesCount={stories.length}
        readyStoriesCount={stories.filter((s) => s.status === "ready").length}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onResetSystem={handleResetSystem}
      />

      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center space-x-3 text-xs font-semibold backdrop-blur-md ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                : "bg-indigo-950/90 border-indigo-500/50 text-indigo-200"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoadingStories && (
          <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-center space-x-3 text-indigo-300 text-xs">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
            <span>Sincronizando histórias com o banco de dados Supabase PostgreSQL...</span>
          </div>
        )}
        {activeTab === "generator" && (
          <GeneratorStudio
            currentStory={currentStory}
            onStoryChange={setCurrentStory}
            onGenerateStory={handleGenerateStory}
            isGenerating={isGenerating}
            onSaveToBacklog={handleSaveToBacklog}
            onOpenRefineModal={() => setIsRefineModalOpen(true)}
            onOpenAuditModal={handleOpenAuditModal}
            onResetSystem={handleResetSystem}
          />
        )}

        {activeTab === "kanban" && (
          <BacklogKanban
            stories={stories}
            onSelectStory={(story) => {
              setCurrentStory(story);
              setActiveTab("generator");
            }}
            onUpdateStatus={handleUpdateStatus}
            onDeleteStory={handleDeleteStory}
            onCreateNewStory={handleCreateNewStory}
          />
        )}
      </main>

      {/* Modals */}
      <RefineModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onRefine={handleRefineStory}
        isRefining={isRefining}
      />

      <InvestAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        audit={currentAudit}
        isLoading={isAuditing}
      />

      <MethodologyGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Histórias Ágeis • Engenharia de Requisitos & BDD</span>
          <span className="text-slate-400 font-medium">Alinhado ao padrão INVEST & Framework Scrum</span>
        </div>
      </footer>
    </div>
  );
}
