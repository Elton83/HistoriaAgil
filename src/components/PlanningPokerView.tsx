import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Layers,
  Users,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Coffee,
  ArrowRight,
  TrendingUp,
  Flame,
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  Award,
  ListFilter,
  BookOpen,
  Calendar,
  Clock,
  Shirt,
  Hash,
} from "lucide-react";
import {
  UserStory,
  PokerDeckType,
  PokerCard,
  SquadMemberEstimate,
  PokerAIEstimateResult,
  FIBONACCI_DECK,
  TSHIRT_DECK,
  SEQUENTIAL_DECK,
  LLMProvider,
  getStoryDeadlineStatus,
} from "../types";
import { UserProfile } from "./AuthModal";

interface PlanningPokerViewProps {
  stories: UserStory[];
  currentUser: UserProfile | null;
  onUpdateStory: (updatedStory: UserStory) => void;
  onSelectStoryForGenerator?: (story: UserStory) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  selectedProvider?: LLMProvider;
  selectedModel?: string;
}

const DEFAULT_SQUAD_MEMBERS: Array<{ id: string; name: string; role: string; avatarColor: string }> = [
  { id: "tech-lead", name: "Carlos (Tech Lead)", role: "Arquiteto", avatarColor: "from-indigo-600 to-indigo-800" },
  { id: "dev-back", name: "Mariana (Backend)", role: "Dev Sênior", avatarColor: "from-emerald-600 to-emerald-800" },
  { id: "dev-front", name: "Lucas (Frontend)", role: "Dev Pleno", avatarColor: "from-cyan-600 to-cyan-800" },
  { id: "qa-eng", name: "Beatriz (QA)", role: "QA Engineer", avatarColor: "from-purple-600 to-purple-800" },
  { id: "po-user", name: "Renato (PO)", role: "Product Owner", avatarColor: "from-amber-600 to-amber-800" },
];

export const PlanningPokerView: React.FC<PlanningPokerViewProps> = ({
  stories,
  currentUser,
  onUpdateStory,
  onSelectStoryForGenerator,
  showToast,
  selectedProvider = "gemini",
  selectedModel = "gemini-3.7-flash",
}) => {
  // Filter and selected story state
  const [filterMode, setFilterMode] = useState<"all" | "unestimated" | "estimated">("all");
  const [selectedStoryId, setSelectedStoryId] = useState<string>(() => {
    const firstUnestimated = stories.find((s) => typeof s.storyPoints !== "number");
    return firstUnestimated ? firstUnestimated.id : stories[0]?.id || "";
  });

  // Active story
  const selectedStory = useMemo(() => {
    return stories.find((s) => s.id === selectedStoryId) || stories[0] || null;
  }, [stories, selectedStoryId]);

  // Deck configuration
  const [deckType, setDeckType] = useState<PokerDeckType>("fibonacci");

  const currentDeck: PokerCard[] = useMemo(() => {
    if (deckType === "tshirt") return TSHIRT_DECK;
    if (deckType === "sequential") return SEQUENTIAL_DECK;
    return FIBONACCI_DECK;
  }, [deckType]);

  // Voting Arena State
  const [myVote, setMyVote] = useState<string | number | null>(null);
  const [squadVotes, setSquadVotes] = useState<SquadMemberEstimate[]>([]);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<PokerAIEstimateResult | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);
  const [consensusPoints, setConsensusPoints] = useState<number | null>(null);

  // Initialize squad members when story changes
  useEffect(() => {
    setMyVote(null);
    setIsRevealed(false);
    setAiAnalysis(null);
    setConsensusPoints(null);

    // Initial squad state
    const members: SquadMemberEstimate[] = DEFAULT_SQUAD_MEMBERS.map((m) => ({
      ...m,
      hasVoted: false,
      vote: null,
    }));
    setSquadVotes(members);
  }, [selectedStoryId, deckType]);

  // Filtered stories list
  const filteredStories = useMemo(() => {
    if (filterMode === "unestimated") {
      return stories.filter((s) => typeof s.storyPoints !== "number");
    }
    if (filterMode === "estimated") {
      return stories.filter((s) => typeof s.storyPoints === "number");
    }
    return stories;
  }, [stories, filterMode]);

  const unestimatedCount = useMemo(() => {
    return stories.filter((s) => typeof s.storyPoints !== "number").length;
  }, [stories]);

  const totalSprintPoints = useMemo(() => {
    return stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
  }, [stories]);

  // Player Casts Vote
  const handleSelectCard = (card: PokerCard) => {
    setMyVote(card.value);
    if (!isRevealed) {
      // Auto trigger squad votes if not voted yet to make it lively
      setSquadVotes((prev) =>
        prev.map((m) => {
          if (m.hasVoted) return m;
          return {
            ...m,
            hasVoted: true,
            vote: simulateMemberVote(m.id, card.value, deckType),
          };
        })
      );
    }
  };

  // Helper to simulate realistic vote distributions
  const simulateMemberVote = (
    memberId: string,
    playerVote: string | number,
    deck: PokerDeckType
  ): string | number => {
    if (deck === "fibonacci") {
      const fibs = [1, 2, 3, 5, 8, 13, 20];
      const numeric = typeof playerVote === "number" ? playerVote : 5;
      const currentIndex = fibs.indexOf(numeric);
      const baseIdx = currentIndex === -1 ? 3 : currentIndex;

      if (memberId === "tech-lead") {
        // Tech lead might see higher architectural complexity
        const idx = Math.min(fibs.length - 1, baseIdx + (Math.random() > 0.6 ? 1 : 0));
        return fibs[idx];
      }
      if (memberId === "dev-front") {
        // Frontend might see simpler or slightly variance
        const idx = Math.max(0, baseIdx + (Math.random() > 0.7 ? -1 : 0));
        return fibs[idx];
      }
      if (memberId === "qa-eng") {
        return fibs[baseIdx];
      }
      // General variance
      const delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const finalIdx = Math.max(0, Math.min(fibs.length - 1, baseIdx + delta));
      return fibs[finalIdx];
    } else if (deck === "tshirt") {
      const sizes = ["PP", "P", "M", "G", "GG"];
      const strVote = String(playerVote);
      const idx = sizes.indexOf(strVote);
      const baseIdx = idx === -1 ? 2 : idx;
      const delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const finalIdx = Math.max(0, Math.min(sizes.length - 1, baseIdx + delta));
      return sizes[finalIdx];
    }
    // Sequential
    const num = typeof playerVote === "number" ? playerVote : 5;
    return Math.max(1, Math.min(10, num + (Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0)));
  };

  // Simulate All Squad Votes
  const handleSimulateSquadVotes = () => {
    if (!selectedStory) return;
    const acCount = selectedStory.acceptanceCriteria?.length || 2;
    const rnCount = selectedStory.businessRules?.length || 2;
    const bddCount = selectedStory.bddScenarios?.length || 1;
    const totalComplexity = acCount + rnCount + bddCount;

    let baseFib = 5;
    if (totalComplexity <= 3) baseFib = 2;
    else if (totalComplexity <= 6) baseFib = 3;
    else if (totalComplexity <= 10) baseFib = 5;
    else if (totalComplexity <= 15) baseFib = 8;
    else baseFib = 13;

    const baseVote = deckType === "fibonacci" ? baseFib : deckType === "tshirt" ? (baseFib <= 3 ? "P" : baseFib <= 5 ? "M" : "G") : baseFib;

    setSquadVotes((prev) =>
      prev.map((m) => ({
        ...m,
        hasVoted: true,
        vote: simulateMemberVote(m.id, baseVote, deckType),
      }))
    );

    if (myVote === null) {
      setMyVote(baseVote);
    }
  };

  // AI Poker Estimate Analysis
  const handleRequestAiEstimate = async () => {
    if (!selectedStory) return;
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/poker-ai-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: selectedStory,
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na consulta ao assistente de estimativa.");
      }

      const result: PokerAIEstimateResult = await response.json();
      setAiAnalysis(result);

      // Set suggested card
      if (deckType === "fibonacci") {
        setMyVote(result.suggestedPoints);
      } else if (deckType === "tshirt") {
        setMyVote(result.suggestedTshirt);
      }

      // Populate squad votes if returned
      if (result.squadVotes && result.squadVotes.length > 0) {
        setSquadVotes((prev) =>
          prev.map((member, index) => {
            const aiMember = result.squadVotes?.[index % result.squadVotes.length];
            return {
              ...member,
              hasVoted: true,
              vote: deckType === "fibonacci" ? aiMember?.vote || result.suggestedPoints : result.suggestedTshirt,
              comment: aiMember?.comment,
            };
          })
        );
      } else {
        handleSimulateSquadVotes();
      }

      showToast(`Estimativa sugerida pela IA: ${result.suggestedPoints} pts (${result.suggestedTshirt})`, "info");
    } catch (err: any) {
      console.warn("Erro ao obter análise de IA:", err);
      // Fallback local
      handleSimulateSquadVotes();
      showToast("Estimativa heurística gerada com sucesso!", "info");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Reveal Cards (Showdown)
  const handleRevealCards = () => {
    if (!myVote) {
      showToast("Selecione sua carta antes de revelar os votos!", "info");
      return;
    }
    // Ensure all squad members have voted
    setSquadVotes((prev) =>
      prev.map((m) => {
        if (m.hasVoted && m.vote !== null) return m;
        return {
          ...m,
          hasVoted: true,
          vote: simulateMemberVote(m.id, myVote, deckType),
        };
      })
    );
    setIsRevealed(true);
  };

  // Reset Round
  const handleResetRound = () => {
    setMyVote(null);
    setIsRevealed(false);
    setConsensusPoints(null);
    setSquadVotes((prev) =>
      prev.map((m) => ({
        ...m,
        hasVoted: false,
        vote: null,
      }))
    );
  };

  // Calculate Statistics from Revealed Votes
  const votingStats = useMemo(() => {
    if (!isRevealed) return null;

    const allVotes: (string | number)[] = [];
    if (myVote !== null) allVotes.push(myVote);
    squadVotes.forEach((m) => {
      if (m.vote !== null && m.vote !== undefined) allVotes.push(m.vote);
    });

    if (allVotes.length === 0) return null;

    // Filter numeric votes
    const numericVotes = allVotes.filter((v): v is number => typeof v === "number" && !isNaN(v));

    if (numericVotes.length === 0) {
      // T-shirt or string mode
      const counts: Record<string, number> = {};
      allVotes.forEach((v) => {
        const s = String(v);
        counts[s] = (counts[s] || 0) + 1;
      });
      let mostFrequent = String(allVotes[0]);
      let maxCount = 0;
      Object.entries(counts).forEach(([val, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostFrequent = val;
        }
      });

      const uniqueCount = Object.keys(counts).length;
      const isConsensus = uniqueCount === 1;

      return {
        isNumeric: false,
        totalVotes: allVotes.length,
        mostFrequent,
        isConsensus,
        uniqueCount,
        min: null,
        max: null,
        average: null,
        suggestedStoryPoints: mostFrequent === "PP" ? 1 : mostFrequent === "P" ? 3 : mostFrequent === "M" ? 5 : mostFrequent === "G" ? 8 : 13,
        suggestedTshirt: mostFrequent as "PP" | "P" | "M" | "G" | "GG",
      };
    }

    const sum = numericVotes.reduce((a, b) => a + b, 0);
    const average = Number((sum / numericVotes.length).toFixed(1));
    const min = Math.min(...numericVotes);
    const max = Math.max(...numericVotes);
    const isConsensus = min === max;

    // Find nearest fibonacci
    const fibs = [0, 1, 2, 3, 5, 8, 13, 20, 40, 100];
    let nearestFib = 5;
    let minDiff = Infinity;
    fibs.forEach((f) => {
      const diff = Math.abs(f - average);
      if (diff < minDiff) {
        minDiff = diff;
        nearestFib = f;
      }
    });

    let tshirt: "PP" | "P" | "M" | "G" | "GG" = "M";
    if (nearestFib <= 1) tshirt = "PP";
    else if (nearestFib <= 3) tshirt = "P";
    else if (nearestFib <= 5) tshirt = "M";
    else if (nearestFib <= 8) tshirt = "G";
    else tshirt = "GG";

    return {
      isNumeric: true,
      totalVotes: numericVotes.length,
      average,
      min,
      max,
      isConsensus,
      divergence: max - min,
      suggestedStoryPoints: nearestFib,
      suggestedTshirt: tshirt,
    };
  }, [isRevealed, myVote, squadVotes]);

  // Apply Estimation to Story
  const handleApplyEstimation = (pointsToApply?: number, tshirtToApply?: string) => {
    if (!selectedStory) return;

    const finalPoints = pointsToApply !== undefined ? pointsToApply : consensusPoints !== null ? consensusPoints : votingStats?.suggestedStoryPoints || (typeof myVote === "number" ? myVote : 5);
    const finalTshirt = tshirtToApply || votingStats?.suggestedTshirt || (deckType === "tshirt" && typeof myVote === "string" ? myVote : undefined);

    const updatedStory: UserStory = {
      ...selectedStory,
      storyPoints: finalPoints,
      tShirtSize: finalTshirt,
      status: selectedStory.status === "draft" ? "ready" : selectedStory.status,
      updatedAt: new Date().toISOString(),
      tags: Array.from(new Set([...(selectedStory.tags || []), `${finalPoints} pts`])),
    };

    onUpdateStory(updatedStory);
    showToast(`História "${selectedStory.title}" classificada com ${finalPoints} Story Points (${finalTshirt || "Fibonacci"})!`, "success");

    // Advance to next unestimated story if available
    const nextUnestimated = stories.find((s) => s.id !== selectedStory.id && typeof s.storyPoints !== "number");
    if (nextUnestimated) {
      setSelectedStoryId(nextUnestimated.id);
    }
  };

  const deadlineInfo = selectedStory?.dueDate ? getStoryDeadlineStatus(selectedStory.dueDate) : null;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner & Deck Controls */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-700 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Planning Poker & Classificação Ágil
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shadow-xs">
                  Scrum Sizing
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Estime o esforço, complexidade e riscos das histórias de usuário com a equipe e o suporte da IA.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Deck System Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Unestimated count pill */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-2 text-xs">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-400">Pendentes:</span>
              <span className="font-bold text-amber-300">{unestimatedCount} histórias</span>
            </div>

            {/* Total points estimated */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-2 text-xs">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Total Backlog:</span>
              <span className="font-bold text-emerald-300">{totalSprintPoints} pts</span>
            </div>

            {/* Deck Selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDeckType("fibonacci")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  deckType === "fibonacci"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Fibonacci</span>
              </button>
              <button
                onClick={() => setDeckType("tshirt")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  deckType === "tshirt"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>T-Shirt</span>
              </button>
              <button
                onClick={() => setDeckType("sequential")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  deckType === "sequential"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>1-10</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Story Details & Selector / Right Poker Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Story Selector & Story Context (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Story Selector Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <ListFilter className="w-4 h-4 text-indigo-400" />
                <span>Selecionar História para Pontuar</span>
              </label>

              {/* Filters */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                    filterMode === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todas ({stories.length})
                </button>
                <button
                  onClick={() => setFilterMode("unestimated")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                    filterMode === "unestimated"
                      ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Pendentes ({unestimatedCount})
                </button>
              </div>
            </div>

            <select
              value={selectedStoryId}
              onChange={(e) => setSelectedStoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition font-medium"
            >
              {filteredStories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storyPoints ? `[${s.storyPoints} pts] ` : "[Sem Pontos] "} {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Active Story Card Context */}
          {selectedStory ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {selectedStory.projectName}
                    </span>
                    <span className="text-[10px] text-slate-400">{selectedStory.epicName}</span>
                    {selectedStory.storyPoints !== undefined ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        {selectedStory.storyPoints} Story Points {selectedStory.tShirtSize ? `(${selectedStory.tShirtSize})` : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800">
                        Não Classificada
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white leading-tight">{selectedStory.title}</h2>
                </div>

                <button
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title={isDetailsExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                >
                  {isDetailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Deadline & Assignee Header */}
              {deadlineInfo && deadlineInfo.status !== "no_date" && (
                <div className="flex items-center space-x-2 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Prazo de Entrega:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${deadlineInfo.badgeClass}`}>
                    {selectedStory.dueDate} ({deadlineInfo.label})
                  </span>
                </div>
              )}

              {/* User Persona Narrative */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-1.5 text-xs">
                <p className="text-slate-300">
                  <span className="font-bold text-indigo-400">Como: </span>
                  {selectedStory.story.role || "Usuário da aplicação"}
                </p>
                <p className="text-slate-300">
                  <span className="font-bold text-emerald-400">Quero: </span>
                  {selectedStory.story.want || "executar a funcionalidade requerida"}
                </p>
                <p className="text-slate-300">
                  <span className="font-bold text-amber-400">Para que: </span>
                  {selectedStory.story.soThat || "obter o valor de negócio esperado"}
                </p>
              </div>

              {/* Expandable Criteria, Rules and BDD */}
              {isDetailsExpanded && (
                <div className="space-y-4 pt-1 text-xs">
                  {/* Acceptance Criteria */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Critérios de Aceitação ({selectedStory.acceptanceCriteria?.length || 0})</span>
                      </span>
                    </div>
                    <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedStory.acceptanceCriteria?.map((ac, idx) => (
                        <li key={ac.id || idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                          <span className="font-bold text-emerald-400 mr-1.5">AC{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}:</span>
                          {ac.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Business Rules */}
                  {selectedStory.businessRules && selectedStory.businessRules.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-300 flex items-center space-x-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Regras de Negócio ({selectedStory.businessRules.length})</span>
                      </span>
                      <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedStory.businessRules.map((rn, idx) => (
                          <li key={rn.id || idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                            <span className="font-bold text-amber-400 mr-1.5">RN{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}:</span>
                            {rn.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* BDD Scenarios Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-400">
                    <span>Cenários BDD (Gherkin):</span>
                    <span className="font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800">
                      {selectedStory.bddScenarios?.length || 0} cenários
                    </span>
                  </div>

                  {onSelectStoryForGenerator && (
                    <button
                      onClick={() => onSelectStoryForGenerator(selectedStory)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Abrir no Estúdio de Requisitos</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
              Nenhuma história cadastrada no backlog para estimativa.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Poker Table & Interactive Voting Arena (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Poker Arena Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Table Header with Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Mesa de Estimativa do Squad</span>
                {isRevealed && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                    Votos Revelados
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* AI Assistant Button */}
                <button
                  onClick={handleRequestAiEstimate}
                  disabled={isAiLoading || !selectedStory}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Obter estimativa calculada pela Inteligência Artificial"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAiLoading ? "Analisando..." : "Assistente IA"}</span>
                </button>

                {/* Simulate Squad */}
                <button
                  onClick={handleSimulateSquadVotes}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                  title="Simular votos dos integrantes do time"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Simular Time</span>
                </button>

                {/* Reveal Showdown Button */}
                {!isRevealed ? (
                  <button
                    onClick={handleRevealCards}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Revelar Cartas</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResetRound}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nova Rodada</span>
                  </button>
                )}
              </div>
            </div>

            {/* Virtual Poker Felt Table */}
            <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 border border-slate-800/90 shadow-inner relative min-h-[260px] flex flex-col justify-between">
              {/* Squad Members around the Table (Top Row) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {squadVotes.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-900/80 border border-slate-800 transition transform hover:scale-102"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-md mb-1.5 border border-white/20`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 truncate w-full">{member.name}</span>
                    <span className="text-[9px] text-slate-400 mb-2 truncate w-full">{member.role}</span>

                    {/* Member's Card */}
                    <div
                      className={`w-10 h-14 rounded-lg flex items-center justify-center font-black text-sm transition-all duration-300 shadow-md ${
                        isRevealed
                          ? member.vote !== null
                            ? "bg-gradient-to-b from-indigo-600 to-indigo-800 text-white border border-indigo-400 scale-105 shadow-indigo-600/30"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                          : member.hasVoted
                          ? "bg-slate-800 border-2 border-indigo-500 text-indigo-400 animate-pulse"
                          : "bg-slate-950 border border-dashed border-slate-800 text-slate-600"
                      }`}
                    >
                      {isRevealed ? (
                        member.vote !== null ? (
                          member.vote
                        ) : (
                          "-"
                        )
                      ) : member.hasVoted ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-slate-700" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Center Table Summary Felt Area */}
              <div className="my-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                    🃏
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {isRevealed
                        ? "Showdown Concluído"
                        : myVote !== null
                        ? "Voto Registrado • Aguardando Revelação"
                        : "Selecione sua carta abaixo para votar"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Modo Atual: <strong className="text-indigo-300 uppercase">{deckType}</strong>
                    </p>
                  </div>
                </div>

                {/* Player Current Card on Center Table */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Seu Voto</span>
                    <span className="text-xs font-extrabold text-white">
                      {currentUser?.name || "Você"}
                    </span>
                  </div>
                  <div
                    className={`w-12 h-16 rounded-xl flex items-center justify-center font-black text-lg transition-all shadow-lg ${
                      myVote !== null
                        ? "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border-2 border-indigo-300 shadow-indigo-500/40"
                        : "bg-slate-950 border-2 border-dashed border-slate-800 text-slate-600"
                    }`}
                  >
                    {myVote !== null ? myVote : "?"}
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Hand: Deck of Cards to Click */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sua Mão de Cartas ({currentDeck.length} opções)</span>
                </span>
                <span className="text-[10px] text-slate-400">Clique para selecionar seu voto</span>
              </div>

              {/* Cards Deck Horizontal Flex */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                {currentDeck.map((card) => {
                  const isSelected = myVote === card.value;
                  return (
                    <button
                      key={String(card.value)}
                      onClick={() => handleSelectCard(card)}
                      className={`shrink-0 w-14 sm:w-16 h-22 sm:h-24 rounded-xl flex flex-col items-center justify-between p-2.5 transition-all duration-200 cursor-pointer select-none group relative ${
                        isSelected
                          ? "bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-800 text-white border-2 border-white shadow-xl shadow-indigo-600/50 -translate-y-2 scale-105"
                          : "bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 text-slate-200 hover:-translate-y-1 shadow-md"
                      }`}
                      title={card.description}
                    >
                      <span className="text-[10px] font-extrabold self-start opacity-70 leading-none">
                        {card.label}
                      </span>
                      <span className="text-lg sm:text-xl font-black group-hover:scale-110 transition-transform">
                        {card.label}
                      </span>
                      <span className="text-[8px] font-medium text-slate-400 truncate w-full text-center leading-none">
                        {deckType === "fibonacci" && typeof card.value === "number"
                          ? `${card.value} pts`
                          : card.description?.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Analysis & Recommendation Box (When requested) */}
          {aiAnalysis && (
            <div className="bg-slate-900/90 border border-indigo-800/60 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Análise do Assistente de Estimativa IA</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                    Confiança: {aiAnalysis.confidence}
                  </span>
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm">
                    {aiAnalysis.suggestedPoints} Story Points ({aiAnalysis.suggestedTshirt})
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                {aiAnalysis.justification}
              </p>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">UI / Frontend</span>
                  <span className="font-bold text-slate-200">{aiAnalysis.breakdown?.uiComplexity?.score || 3}/5</span>
                  <p className="text-[9px] text-slate-500 truncate">{aiAnalysis.breakdown?.uiComplexity?.note}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Backend & Regras</span>
                  <span className="font-bold text-slate-200">{aiAnalysis.breakdown?.backendComplexity?.score || 3}/5</span>
                  <p className="text-[9px] text-slate-500 truncate">{aiAnalysis.breakdown?.backendComplexity?.note}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Risco de Integração</span>
                  <span className="font-bold text-slate-200">{aiAnalysis.breakdown?.integrationRisk?.score || 2}/5</span>
                  <p className="text-[9px] text-slate-500 truncate">{aiAnalysis.breakdown?.integrationRisk?.note}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Esforço de QA</span>
                  <span className="font-bold text-slate-200">{aiAnalysis.breakdown?.testEffort?.score || 3}/5</span>
                  <p className="text-[9px] text-slate-500 truncate">{aiAnalysis.breakdown?.testEffort?.note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Consensus & Classification Result Panel (Shown on Reveal) */}
          {votingStats && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Resultado da Votação & Consenso da Equipe
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {votingStats.isConsensus
                      ? "🎉 Consenso unânime alcançado pelo Squad!"
                      : "⚖️ Houve divergência entre as notas. Alinhem os pontos de atenção antes de confirmar."}
                  </p>
                </div>

                {/* Score badge */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Sugestão Final</span>
                    <span className="text-sm font-black text-indigo-300">
                      {votingStats.suggestedStoryPoints} Story Points
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/30">
                    {votingStats.suggestedStoryPoints}
                  </div>
                </div>
              </div>

              {/* Stats Metrics Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Média Aritmética</span>
                  <span className="text-sm font-black text-slate-200">
                    {votingStats.average !== null ? `${votingStats.average} pts` : votingStats.mostFrequent}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Menor Voto</span>
                  <span className="text-sm font-black text-emerald-400">
                    {votingStats.min !== null ? `${votingStats.min} pts` : "-"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Maior Voto</span>
                  <span className="text-sm font-black text-rose-400">
                    {votingStats.max !== null ? `${votingStats.max} pts` : "-"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">T-Shirt Equivalente</span>
                  <span className="text-sm font-black text-indigo-400">
                    Tamanho {votingStats.suggestedTshirt}
                  </span>
                </div>
              </div>

              {/* Actions to Save and Classify */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Classificar com:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 5, 8, 13, 20].map((pt) => (
                      <button
                        key={pt}
                        onClick={() => setConsensusPoints(pt)}
                        className={`px-2 py-1 rounded-md font-bold text-xs transition cursor-pointer ${
                          (consensusPoints !== null ? consensusPoints : votingStats.suggestedStoryPoints) === pt
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleApplyEstimation(consensusPoints || votingStats.suggestedStoryPoints, votingStats.suggestedTshirt)}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar e Classificar História ({consensusPoints || votingStats.suggestedStoryPoints} pts)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
