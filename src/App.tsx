import React, { useState, useEffect } from "react";
import { SidebarNav } from "./components/SidebarNav";
import { GeneratorStudio } from "./components/GeneratorStudio";
import { BacklogKanban } from "./components/BacklogKanban";
import { HomologationPipelineView } from "./components/HomologationPipelineView";
import { ReportsView } from "./components/ReportsView";
import { AdminPanel } from "./components/AdminPanel";
import { LoginScreen } from "./components/LoginScreen";
import { RefineModal } from "./components/RefineModal";
import { InvestAuditModal } from "./components/InvestAuditModal";
import { MethodologyGuideModal } from "./components/MethodologyGuideModal";
import { AuthModal, UserProfile } from "./components/AuthModal";
import { SupabaseModal } from "./components/SupabaseModal";
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
  syncUserProfileWithSupabase,
} from "./services/supabaseService";
import { CheckCircle2, AlertCircle, Loader2, Sparkles, PlusCircle, RefreshCw, Database } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"generator" | "kanban" | "pipeline" | "reports" | "audit" | "guide" | "admin">("generator");

  // Supabase Connection Modal State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

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
    showToast(`Sessão iniciada como ${user.name} (${user.role})!`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("agile_studio_user");
    showToast("Sessão encerrada com sucesso.", "info");
  };

  const handleUpdateCurrentUserRole = (newRole: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    try {
      localStorage.setItem("agile_studio_user", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to update user role:", e);
    }
    showToast(`Seu papel foi atualizado para ${newRole}!`, "success");
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
      if (!isSupabaseConfigured() || !currentUser) return;

      setIsLoadingStories(true);
      const result = await fetchStoriesFromSupabase();
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

  // Handle Tab changes from Navigation
  const handleTabChange = (
    tab: "generator" | "kanban" | "pipeline" | "reports" | "audit" | "guide" | "admin"
  ) => {
    if (tab === "guide") {
      setIsGuideModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Update a single story's state and sync with Supabase / LocalStorage
  const handleUpdateStory = async (updatedStory: UserStory) => {
    setStories((prev) =>
      prev.map((s) => (s.id === updatedStory.id ? updatedStory : s))
    );
    if (currentStory && currentStory.id === updatedStory.id) {
      setCurrentStory(updatedStory);
    }
    if (isSupabaseConfigured()) {
      await saveStoryToSupabase(updatedStory);
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
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.details || errJson.error || "Falha na geração do requisito via backend.";
        throw new Error(errMsg);
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
        requester: requester || currentUser?.name || "Product Owner",
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [projectName || "Requisito", "IA"].filter(Boolean),
        attachedFileName: images && images[0]?.fileName ? images[0].fileName : undefined,
      };

      const validationReport = validateUserStory(rawStory);
      const newStory: UserStory = { ...rawStory, validationReport };

      setCurrentStory(newStory);
      showToast("História de usuário gerada com sucesso!", "success");
    } catch (error: any) {
      console.error("Error generating story:", error);
      showToast(error?.message || "Erro ao gerar história via servidor de IA.", "error");
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
      showToast("História refinada com sucesso!", "success");
    } catch (error) {
      console.error("Error refining story:", error);
      showToast("Não foi possível refinar a história.", "error");
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

    if (isSupabaseConfigured()) {
      const res = await saveStoryToSupabase(storyWithTimestamp, currentUser?.id);
      if (res.error) {
        showToast(`Salvo localmente (Erro Supabase: ${res.error})`, "error");
      } else {
        if (res.story && res.story.id !== storyWithTimestamp.id) {
          setStories((prev) =>
            prev.map((s) => (s.id === storyToSave.id ? res.story : s))
          );
          if (currentStory?.id === storyToSave.id) {
            setCurrentStory(res.story);
          }
        }
        showToast("História salva no Supabase PostgreSQL!", "success");
      }
    } else {
      showToast("História salva no backlog (Cache Local)", "info");
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

  // Reset all system data
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

  const [isSyncingDatabase, setIsSyncingDatabase] = useState(false);

  // Full Database Synchronization
  const handleSyncDatabase = async () => {
    if (!currentUser) return;
    setIsSyncingDatabase(true);
    showToast("Sincronizando banco de dados Supabase PostgreSQL...", "info");

    try {
      // 1. Sync User Profile
      await syncUserProfileWithSupabase(currentUser);

      // 2. Upload local stories to Supabase if configured
      let uploadCount = 0;
      for (const st of stories) {
        const res = await saveStoryToSupabase(st, currentUser.id);
        if (!res.error) uploadCount++;
      }

      // 3. Fetch latest stories from Supabase
      const result = await fetchStoriesFromSupabase();
      if (result.isSupabase && !result.error) {
        if (result.stories.length > 0) {
          const storiesWithReports = result.stories.map((s) => ({
            ...s,
            validationReport: s.validationReport || validateUserStory(s),
          }));
          setStories(storiesWithReports);
          if (!currentStory || currentStory.id === INITIAL_SAMPLE_STORY.id) {
            setCurrentStory(storiesWithReports[0]);
          }
        }
        showToast(
          `Banco de dados sincronizado com sucesso! (${result.stories.length} histórias atualizadas)`,
          "success"
        );
      } else if (result.error) {
        showToast(`Sincronização concluída com avisos: ${result.error}`, "error");
      } else {
        showToast("Sincronização do banco concluída com sucesso!", "success");
      }
    } catch (err: any) {
      showToast(`Erro na sincronização com o banco: ${err.message || "Erro de conexão"}`, "error");
    } finally {
      setIsSyncingDatabase(false);
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

  // MANDATORY LOGIN WALL: If not authenticated, render LoginScreen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        savedStoriesCount={stories.length}
        readyStoriesCount={stories.filter((s) => s.status === "ready").length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetSystem={handleResetSystem}
        onCreateNewStory={handleCreateNewStory}
        onSyncDatabase={handleSyncDatabase}
        isSyncingDatabase={isSyncingDatabase}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Breadcrumb / Header Bar */}
        <header className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-4 hidden lg:flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>
                {activeTab === "generator" && "Gerador Ágil & Estúdio de Requisitos"}
                {activeTab === "kanban" && "Quadro Backlog & Fluxo Kanban"}
                {activeTab === "pipeline" && "Esteira de Homologação & Checklist de Release"}
                {activeTab === "reports" && "Relatórios Ágeis & Analytics do Backlog"}
                {activeTab === "admin" && "Painel de Governança & Controle de Acesso (RBAC)"}
                {activeTab === "guide" && "Guia Metodológico & Boas Práticas Scrum"}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {activeTab === "generator" && "Crie e edite histórias com AC, RN e BDD estruturados"}
              {activeTab === "kanban" && `Gestão e movimentação de ${stories.length} histórias cadastradas`}
              {activeTab === "pipeline" && "Validação com 8 passos de homologação, Q.A e publicação em Staging/Main"}
              {activeTab === "reports" && "Métricas de Story Points, maturidade de requisitos e exportação CSV"}
              {activeTab === "admin" && "Gerencie perfis, permissões e consulte métricas do banco de dados"}
              {activeTab === "guide" && "Diretrizes INVEST, Gherkin e Engenharia de Requisitos"}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateNewStory}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Nova História</span>
            </button>
          </div>
        </header>

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
              onOpenRefineModal={() => setIsRefineModalOpen(false)}
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

          {activeTab === "pipeline" && (
            <HomologationPipelineView
              stories={stories}
              onUpdateStory={handleUpdateStory}
              onSelectStoryForGenerator={(story) => {
                setCurrentStory(story);
                setActiveTab("generator");
              }}
            />
          )}

          {activeTab === "reports" && (
            <ReportsView stories={stories} showToast={showToast} />
          )}

          {activeTab === "admin" && (
            <AdminPanel
              currentUser={currentUser}
              stories={stories}
              onUpdateCurrentUserRole={handleUpdateCurrentUserRole}
              onResetSystem={handleResetSystem}
              showToast={showToast}
              onSyncDatabase={handleSyncDatabase}
              isSyncingDatabase={isSyncingDatabase}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Histórias Ágeis • Engenharia de Requisitos & BDD</span>
            <span className="text-slate-400 font-medium">Alinhado ao padrão INVEST & Framework Scrum</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onStatusChange={handleSyncDatabase}
      />

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
    </div>
  );
}
