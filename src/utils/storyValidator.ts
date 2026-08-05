import { UserStory, ValidationReport, ValidationTest } from "../types";

/**
 * Executa uma bateria de testes de validação automatizados sobre uma História de Usuário.
 */
export function validateUserStory(story: UserStory): ValidationReport {
  const tests: ValidationTest[] = [];

  // 1. Teste de Estrutura do Formato (Como, Quero, Para)
  const roleText = story.story?.role?.trim() || "";
  const wantText = story.story?.want?.trim() || "";
  const soThatText = story.story?.soThat?.trim() || "";

  if (roleText.length >= 3 && wantText.length >= 5 && soThatText.length >= 5) {
    tests.push({
      id: "T01_ESTRUTURA",
      name: "Sintaxe do Papel (Como/Quero/Para)",
      category: "estrutura",
      status: "pass",
      message: "Estrutura ágil padronizada identificada perfeitamente.",
      details: `Papel: "${roleText}" | Ação: "${wantText}" | Valor: "${soThatText}"`,
    });
  } else {
    tests.push({
      id: "T01_ESTRUTURA",
      name: "Sintaxe do Papel (Como/Quero/Para)",
      category: "estrutura",
      status: "fail",
      message: "Formato incompleto. Certifique-se de preencher 'Como', 'Quero' e 'Para'.",
    });
  }

  // 2. Teste de Critérios de Aceitação
  const acCount = story.acceptanceCriteria?.length || 0;
  if (acCount >= 2) {
    tests.push({
      id: "T02_AC_COBERTURA",
      name: "Critérios de Aceitação (ACs)",
      category: "criterios",
      status: "pass",
      message: `${acCount} critérios de aceitação observáveis e testáveis definidos.`,
    });
  } else if (acCount === 1) {
    tests.push({
      id: "T02_AC_COBERTURA",
      name: "Critérios de Aceitação (ACs)",
      category: "criterios",
      status: "warning",
      message: "Apenas 1 critério de aceitação definido. Recomendado no mínimo 2 para abranger a regra.",
    });
  } else {
    tests.push({
      id: "T02_AC_COBERTURA",
      name: "Critérios de Aceitação (ACs)",
      category: "criterios",
      status: "fail",
      message: "Nenhum critério de aceitação registrado. A história não pode ser homologada sem ACs.",
    });
  }

  // 3. Teste de Cenários BDD / Gherkin
  const bddCount = story.bddScenarios?.length || 0;
  const validBdds = story.bddScenarios?.filter(
    (b) => b.given?.trim() && b.when?.trim() && b.then?.trim()
  ).length || 0;

  if (bddCount > 0 && validBdds === bddCount) {
    tests.push({
      id: "T03_BDD_GHERKIN",
      name: "Sintaxe BDD (Dado / Quando / Então)",
      category: "bdd",
      status: "pass",
      message: `${validBdds} cenário(s) BDD válidos com Dado, Quando e Então completos.`,
    });
  } else if (bddCount > 0 && validBdds < bddCount) {
    tests.push({
      id: "T03_BDD_GHERKIN",
      name: "Sintaxe BDD (Dado / Quando / Então)",
      category: "bdd",
      status: "warning",
      message: "Alguns cenários BDD possuem etapas incompletas ou não preenchidas.",
    });
  } else {
    tests.push({
      id: "T03_BDD_GHERKIN",
      name: "Sintaxe BDD (Dado / Quando / Então)",
      category: "bdd",
      status: "fail",
      message: "Sem cenários BDD especificados. Recomendado para automação BDD.",
    });
  }

  // 4. Teste de Regras de Negócio
  const rnCount = story.businessRules?.length || 0;
  if (rnCount >= 1) {
    tests.push({
      id: "T04_REGRAS_NEGOCIO",
      name: "Regras de Negócio Mapeadas",
      category: "regras",
      status: "pass",
      message: `${rnCount} regra(s) de negócio e validações explicitadas.`,
    });
  } else {
    tests.push({
      id: "T04_REGRAS_NEGOCIO",
      name: "Regras de Negócio Mapeadas",
      category: "regras",
      status: "warning",
      message: "Nenhuma regra de negócio complementar explicitada.",
    });
  }

  // 5. Teste de Ambiguidade e Termos Subjetivos
  const fullText = (
    story.title +
    " " +
    story.context +
    " " +
    story.acceptanceCriteria.map((a) => a.text).join(" ")
  ).toLowerCase();

  const ambiguousWords = ["fácil", "rápido", "amigável", "intuitivo", "eficiente", "bonito", "imediato", "flexível"];
  const detectedAmbiguous = ambiguousWords.filter((word) => fullText.includes(word));

  if (detectedAmbiguous.length === 0) {
    tests.push({
      id: "T05_AMBIGUIDADE",
      name: "Clareza Semântica (Sem Adjetivos Vagose)",
      category: "ambiguidade",
      status: "pass",
      message: "Nenhum termo ambíguo ou não mensurável detectado.",
    });
  } else {
    tests.push({
      id: "T05_AMBIGUIDADE",
      name: "Clareza Semântica (Aviso de Subjetividade)",
      category: "ambiguidade",
      status: "warning",
      message: `Encontrado(s) termo(s) subjetivo(s): ${detectedAmbiguous.map((w) => `"${w}"`).join(", ")}. Substitua por métricas numéricas (ex: 'em menos de 2s').`,
    });
  }

  // 6. Teste de Fluxo de Exceção / Erros
  const hasExceptionPath =
    fullText.includes("erro") ||
    fullText.includes("inválido") ||
    fullText.includes("falha") ||
    fullText.includes("recusado") ||
    fullText.includes("expirad") ||
    fullText.includes("bloquead") ||
    fullText.includes("limite");

  if (hasExceptionPath) {
    tests.push({
      id: "T06_FLUXO_EXCECAO",
      name: "Cobertura de Exceções & Erros",
      category: "criterios",
      status: "pass",
      message: "Tratamento de exceções e cenários de erro foram contemplados na história.",
    });
  } else {
    tests.push({
      id: "T06_FLUXO_EXCECAO",
      name: "Cobertura de Exceções & Erros",
      category: "criterios",
      status: "warning",
      message: "Apenas o caminho feliz parece descrito. Considere adicionar um AC/BDD para fluxo de erro ou validação inválida.",
    });
  }

  // 7. Teste de Tamanho e Foco em 1 Incremento
  if (story.epicNote) {
    tests.push({
      id: "T07_TAMANHO_INCREMENTO",
      name: "Tamanho do Incremento (Foco de Entrega)",
      category: "invest",
      status: "warning",
      message: "Requisito pode representar mais de 1 incremento e sugere divisão em Épico.",
    });
  } else {
    tests.push({
      id: "T07_TAMANHO_INCREMENTO",
      name: "Tamanho do Incremento (Foco de Entrega)",
      category: "invest",
      status: "pass",
      message: "História bem delimitada para entrega em 1 único incremento de Sprint.",
    });
  }

  const totalTests = tests.length;
  const passedCount = tests.filter((t) => t.status === "pass").length;
  const warningsCount = tests.filter((t) => t.status === "warning").length;
  const failedCount = tests.filter((t) => t.status === "fail").length;

  const scorePercent = Math.round(((passedCount + warningsCount * 0.5) / totalTests) * 100);

  return {
    totalTests,
    passedCount,
    warningsCount,
    failedCount,
    scorePercent,
    tests,
    evaluatedAt: new Date().toISOString(),
  };
}
