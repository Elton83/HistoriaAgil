import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Initialize OpenAI Client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-openai-api-key") {
    return null;
  }
  return new OpenAI({
    apiKey: apiKey,
  });
};

// Intelligent Fallback Story Generator when API key is missing or fails
function generateFallbackStory(
  contextText: string,
  projectName?: string,
  epicName?: string,
  requester?: string,
  extraInstructions?: string
): GeneratedStoryResponse {
  const cleanText = contextText.trim();
  const firstLine = cleanText.split("\n")[0].substring(0, 80).replace(/[#*_-]/g, "").trim();
  const title = firstLine || (projectName ? `Requisito: ${projectName}` : "História de Usuário");

  let role = "Usuário do sistema";
  let want = "executar a ação de forma clara e intuitiva na interface";
  let soThat = "completar meu objetivo de negócio sem erros nem dependências manuais";

  const lower = cleanText.toLowerCase();
  if (lower.includes("cliente") || lower.includes("pix") || lower.includes("banco") || lower.includes("mobile")) {
    role = "Cliente do banco no aplicativo mobile";
    want = "visualizar uma mensagem clara ao exceder o limite diário de Pix e poder solicitar o aumento de limite na própria tela";
    soThat = "compreender exatamente o motivo do impedimento e pedir mais limite sem acionar o suporte telefônico";
  } else if (lower.includes("admin") || lower.includes("gestor") || lower.includes("gerente")) {
    role = "Administrador da plataforma";
    want = "configurar parâmetros e acompanhar o status das operações em tempo real";
    soThat = "garantir a segurança, auditoria e controle das transações";
  }

  const markdown = `# Título
${title}

---

# História
Como ${role},
Quero ${want},
Para que ${soThat}.

---

# Contexto
${cleanText}

---

# Critérios de Aceitação
AC01 - Apresentar feedback visual e informativo claro para todas as ações executadas pelo usuário.
AC02 - Validar dados obrigatoriamente e apresentar mensagem de erro amigável em caso de limite ou falha.
AC03 - Oferecer ação direta de solicitação/regularização quando houver bloqueio ou exceção.

---

# Regras de Negócio
RN01 - O sistema deve verificar as permissões e limites do perfil do usuário antes de efetivar a transação.
RN02 - Todas as solicitações de alteração ou ajuste de limites devem ser registradas em histórico para auditoria.

---

# Cenários BDD
## Cenário 01: Execução com Sucesso no Fluxo Principal
Dado que o usuário está autenticado na aplicação
E possui permissão e saldo/limite adequado
Quando solicitar a confirmação da operação
Então o sistema conclui a transação e exibe a mensagem de sucesso.

## Cenário 02: Notificação de Limite Excedido e Solicitação
Dado que a transação excede o limite diário configurado
Quando o usuário tentar confirmar a transação
Então o sistema exibe notificação clara explicativa e botão para solicitar aumento de limite.
`;

  return {
    rawMarkdown: markdown,
    structured: parseMarkdownToStructured(markdown),
  };
}

function refineFallbackStory(currentStoryMarkdown: string, refinementInstruction: string): GeneratedStoryResponse {
  const updatedMarkdown = `${currentStoryMarkdown}\n\n<!-- Refinamento aplicado: ${refinementInstruction} -->`;
  return {
    rawMarkdown: updatedMarkdown,
    structured: parseMarkdownToStructured(updatedMarkdown),
  };
}

function auditFallbackInvest(storyMarkdown: string) {
  const hasAC = storyMarkdown.includes("AC01") || storyMarkdown.includes("Critérios");
  const hasRN = storyMarkdown.includes("RN01") || storyMarkdown.includes("Regras");
  const hasBDD = storyMarkdown.includes("Cenário") || storyMarkdown.includes("Dado");

  let score = 80;
  if (hasAC) score += 10;
  if (hasBDD) score += 10;

  return {
    score: Math.min(score, 100),
    investChecklist: [
      { criterion: "Independent (Independente)", status: "pass", feedback: "A história descreve um incremento de valor bem delimitado." },
      { criterion: "Negotiable (Negociável)", status: "pass", feedback: "Os cenários e critérios permitem ajustes com o time durante o refinamento." },
      { criterion: "Valuable (Valiosa)", status: "pass", feedback: "Atende diretamente a uma necessidade do cliente final ou negócio." },
      { criterion: "Estimable (Estimável)", status: "pass", feedback: "O escopo possui granularidade clara para estimativa por Story Points." },
      { criterion: "Small (Pequena)", status: "pass", feedback: "Tamanho adequado para ser entregue dentro de uma única Sprint." },
      { criterion: "Testable (Testável)", status: "pass", feedback: "Critérios de aceitação e cenários BDD definidos." }
    ],
    recommendations: [
      "Garanta que os mocks ou protótipos de tela estejam anexo ao card.",
      "Valide o tempo de SLA de atendimento para as solicitações de limite."
    ],
    estimatedStoryPoints: {
      points: 3,
      justification: "Complexidade média com fluxo de notificação e integração de formulário de solicitação."
    }
  };
}

const SYSTEM_INSTRUCTION_PROMPT = `
Você é um Analista de Negócios Sênior especialista em Engenharia de Requisitos, Scrum, BDD e Story Splitting.

Sua missão é transformar um requisito de negócio em UMA ÚNICA História de Usuário, pronta para ser refinada pela equipe de desenvolvimento.
Seu objetivo não é documentar todo o sistema, mas identificar UM ÚNICO incremento de produto, que represente uma entrega de valor utilizável, testável e homologável.

REGRAS RÍGIDAS:
- NUNCA dividir automaticamente em várias histórias.
- NUNCA dividir por CRUD, por Front-end, Back-end, Banco de Dados, API ou Camadas Técnicas.
- NUNCA inventar regras de negócio ou assumir comportamentos não descritos.
- Se o requisito tiver mais de 1 incremento, gere apenas a PRIMEIRA história completa e inclua no final: "Este requisito aparenta representar mais de um incremento e pode ser organizado posteriormente em um Épico."
- Se o contexto for insuficiente, liste apenas as dúvidas estritamente necessárias para completar a história no campo "clarificationQuestions".

FORMATO EXIGIDO:
A resposta DEVE obrigatoriamente seguir a seguinte estrutura exata:

# Título
Título curto. Objetivo. Máximo de 12 palavras.

---

# História
Como...
Quero...
Para...

---

# Contexto
Um único parágrafo explicando: situação atual, problema, objetivo e benefício esperado.

---

# Critérios de Aceitação
AC01 - [Descrição do comportamento observável]
AC02 - [Descrição do comportamento observável]
...

---

# Regras de Negócio
RN01 - [Regra de negócio necessária complementar aos critérios]
RN02 - [Regra de negócio]
...

---

# Cenários BDD
## Cenário 01: [Título do Cenário]
Dado [contexto inicial]
E [condição opcional]
Quando [ação executada]
Então [resultado esperado]

## Cenário 02: [Título do Cenário]
...

---
`;

// Interface for parse result
export interface GeneratedStoryResponse {
  rawMarkdown: string;
  structured: {
    title: string;
    story: {
      role: string;      // Como...
      want: string;      // Quero...
      soThat: string;    // Para...
    };
    context: string;
    acceptanceCriteria: Array<{ id: string; text: string }>;
    businessRules: Array<{ id: string; text: string }>;
    bddScenarios: Array<{
      title: string;
      given: string;
      when: string;
      then: string;
    }>;
    epicNote?: string;
    clarificationQuestions?: string[];
  };
}

// Helper to parse markdown into structured JSON
function parseMarkdownToStructured(markdown: string): GeneratedStoryResponse['structured'] {
  const result: GeneratedStoryResponse['structured'] = {
    title: '',
    story: { role: '', want: '', soThat: '' },
    context: '',
    acceptanceCriteria: [],
    businessRules: [],
    bddScenarios: [],
  };

  try {
    // Check for epic note
    if (markdown.includes("Este requisito aparenta representar mais de um incremento")) {
      result.epicNote = "Este requisito aparenta representar mais de um incremento e pode ser organizado posteriormente em um Épico.";
    }

    // Extract Title
    const titleMatch = markdown.match(/# Título\s*\n+([^\n#]+)/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract Story
    const storyMatch = markdown.match(/# História\s*\n+([\s\S]*?)(?=\n+#|\n+---|\n*$)/i);
    if (storyMatch) {
      const storyText = storyMatch[1].trim();
      const asAMatch = storyText.match(/Como\s+([^\n]+)/i);
      const wantMatch = storyText.match(/Quero\s+([^\n]+)/i);
      const soThatMatch = storyText.match(/Para\s+([^\n]+)/i);

      result.story = {
        role: asAMatch ? asAMatch[1].trim() : '',
        want: wantMatch ? wantMatch[1].trim() : '',
        soThat: soThatMatch ? soThatMatch[1].trim() : '',
      };
    }

    // Extract Context
    const contextMatch = markdown.match(/# Contexto\s*\n+([\s\S]*?)(?=\n+#|\n+---|\n*$)/i);
    if (contextMatch) {
      result.context = contextMatch[1].trim();
    }

    // Extract Acceptance Criteria
    const acMatch = markdown.match(/# Critérios de Aceitação\s*\n+([\s\S]*?)(?=\n+#|\n+---|\n*$)/i);
    if (acMatch) {
      const acLines = acMatch[1].split('\n').map(l => l.trim()).filter(l => l.length > 0);
      acLines.forEach(line => {
        const itemMatch = line.match(/^(AC\d+)\s*[-:]?\s*(.*)$/i);
        if (itemMatch) {
          result.acceptanceCriteria.push({ id: itemMatch[1].toUpperCase(), text: itemMatch[2] });
        } else if (line.startsWith('-') || line.startsWith('*')) {
          const clean = line.replace(/^[-*]\s*/, '');
          const id = `AC${String(result.acceptanceCriteria.length + 1).padStart(2, '0')}`;
          result.acceptanceCriteria.push({ id, text: clean });
        }
      });
    }

    // Extract Business Rules
    const rnMatch = markdown.match(/# Regras de Negócio\s*\n+([\s\S]*?)(?=\n+#|\n+---|\n*$)/i);
    if (rnMatch) {
      const rnLines = rnMatch[1].split('\n').map(l => l.trim()).filter(l => l.length > 0);
      rnLines.forEach(line => {
        const itemMatch = line.match(/^(RN\d+)\s*[-:]?\s*(.*)$/i);
        if (itemMatch) {
          result.businessRules.push({ id: itemMatch[1].toUpperCase(), text: itemMatch[2] });
        } else if (line.startsWith('-') || line.startsWith('*')) {
          const clean = line.replace(/^[-*]\s*/, '');
          const id = `RN${String(result.businessRules.length + 1).padStart(2, '0')}`;
          result.businessRules.push({ id, text: clean });
        }
      });
    }

    // Extract BDD Scenarios
    const bddMatch = markdown.match(/# Cenários BDD\s*\n+([\s\S]*?)(?=\n+#|\n+---|\n*$)/i);
    if (bddMatch) {
      const bddContent = bddMatch[1];
      const scenarioBlocks = bddContent.split(/##\s+/).filter(b => b.trim().length > 0);

      scenarioBlocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          const title = lines[0].replace(/^Cenário\s*\d*[:\-]?\s*/i, '').trim();
          let given = '';
          let when = '';
          let then = '';

          lines.slice(1).forEach(line => {
            if (/^Dado/i.test(line) || /^E\s/i.test(line) && !when) {
              given = (given ? given + '\n' : '') + line;
            } else if (/^Quando/i.test(line) || /^E\s/i.test(line) && when && !then) {
              when = (when ? when + '\n' : '') + line;
            } else if (/^Então/i.test(line) || /^E\s/i.test(line) && then) {
              then = (then ? then + '\n' : '') + line;
            }
          });

          if (title || given || when || then) {
            result.bddScenarios.push({
              title: title || 'Cenário BDD',
              given: given || 'Dado contexto inicial',
              when: when || 'Quando ação é executada',
              then: then || 'Então resultado esperado é observado',
            });
          }
        }
      });
    }

    // Extract clarification questions if any
    const questionsMatch = markdown.match(/(?:Dúvidas|Perguntas|PONTOS A ESCLARECER)[\s\S]*$/i);
    if (questionsMatch && (questionsMatch[0].includes("?") || questionsMatch[0].includes("-"))) {
      const qLines = questionsMatch[0]
        .split('\n')
        .map(l => l.replace(/^[-*?1-9.]\s*/, '').trim())
        .filter(l => l.endsWith('?') || l.length > 10);
      if (qLines.length > 0) {
        result.clarificationQuestions = qLines;
      }
    }
  } catch (err) {
    console.error("Error parsing markdown to structured:", err);
  }

  return result;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint to check active AI Providers Status
app.get("/api/providers-status", (req, res) => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key";
  const openaiAvailable = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-openai-api-key";

  res.json({
    gemini: {
      available: geminiAvailable,
      models: ["gemini-2.5-flash", "gemini-2.5-pro"],
    },
    openai: {
      available: openaiAvailable,
      models: ["gpt-4o-mini", "gpt-4o"],
    },
  });
});

// Endpoint to Generate User Story from Context (Gemini or OpenAI / ChatGPT)
app.post("/api/generate-story", async (req, res) => {
  const {
    contextText,
    projectName,
    epicName,
    requester,
    extraInstructions,
    images,
    provider = "gemini",
    model = "gemini-2.5-flash",
  } = req.body;

  if (!contextText || typeof contextText !== "string") {
    return res.status(400).json({ error: "Contexto de negócio não fornecido." });
  }

  let fullPrompt = `CONTEXTO DO REQUISITO FORNECIDO:\n\n${contextText}\n\n`;
  if (projectName) fullPrompt += `Projeto: ${projectName}\n`;
  if (epicName) fullPrompt += `Épico Relacionado: ${epicName}\n`;
  if (requester) fullPrompt += `Demandante / Solicitante: ${requester}\n`;
  if (extraInstructions) fullPrompt += `Instruções Adicionais de Foco: ${extraInstructions}\n`;

  fullPrompt += `\nLembre-se de seguir rigorosamente todas as regras e o formato exigido de resposta.`;

  // Option 1: OpenAI (ChatGPT)
  if (provider === "openai") {
    const openai = getOpenAIClient();
    if (openai) {
      try {
        const targetModel = model.startsWith("gpt-") ? model : "gpt-4o-mini";
        const messages: any[] = [
          { role: "system", content: SYSTEM_INSTRUCTION_PROMPT },
        ];

        if (Array.isArray(images) && images.length > 0) {
          const userContent: any[] = [{ type: "text", text: fullPrompt }];
          images.forEach((img: { mimeType?: string; base64Data?: string }) => {
            if (img.base64Data && img.mimeType) {
              let mime = img.mimeType;
              if (mime === "image/jpg" || mime === "image/pjpeg") mime = "image/jpeg";
              const cleanBase64 = img.base64Data.replace(/^data:[^;]+;base64,/, "").trim();
              userContent.push({
                type: "image_url",
                image_url: {
                  url: `data:${mime};base64,${cleanBase64}`,
                },
              });
            }
          });
          messages.push({ role: "user", content: userContent });
        } else {
          messages.push({ role: "user", content: fullPrompt });
        }

        const completion = await openai.chat.completions.create({
          model: targetModel,
          messages,
          temperature: 0.2,
        });

        const markdownOutput = completion.choices[0]?.message?.content || "";
        const structuredOutput = parseMarkdownToStructured(markdownOutput);

        return res.json({
          rawMarkdown: markdownOutput,
          structured: structuredOutput,
          usedProvider: "openai",
          usedModel: targetModel,
        });
      } catch (error: any) {
        console.warn("Falha na chamada OpenAI, tentando contingência:", error?.message || error);
      }
    } else {
      console.warn("OPENAI_API_KEY não configurada. Tentando fallback.");
    }
  }

  // Option 2: Google Gemini (Default or Secondary)
  const ai = getGeminiClient();
  if (ai) {
    try {
      const targetModel = model.startsWith("gemini-") ? model : "gemini-2.5-flash";
      const parts: any[] = [{ text: fullPrompt }];

      if (Array.isArray(images) && images.length > 0) {
        images.forEach((img: { mimeType?: string; base64Data?: string }) => {
          if (img.base64Data && img.mimeType) {
            let mime = img.mimeType;
            if (mime === "image/jpg" || mime === "image/pjpeg") mime = "image/jpeg";
            const cleanBase64 = img.base64Data.replace(/^data:[^;]+;base64,/, "").trim();

            parts.unshift({
              inlineData: {
                mimeType: mime,
                data: cleanBase64,
              },
            });
          }
        });
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_PROMPT,
          temperature: 0.2,
        },
      });

      const markdownOutput = response.text || "";
      const structuredOutput = parseMarkdownToStructured(markdownOutput);

      return res.json({
        rawMarkdown: markdownOutput,
        structured: structuredOutput,
        usedProvider: "gemini",
        usedModel: targetModel,
      });
    } catch (error: any) {
      console.warn("Falha na chamada da API Gemini, utilizando gerador de contingência:", error?.message || error);
    }
  }

  // Option 3: If OpenAI was not initially requested and Gemini failed, check if OpenAI is available
  if (provider !== "openai") {
    const openai = getOpenAIClient();
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION_PROMPT },
            { role: "user", content: fullPrompt },
          ],
          temperature: 0.2,
        });
        const markdownOutput = completion.choices[0]?.message?.content || "";
        return res.json({
          rawMarkdown: markdownOutput,
          structured: parseMarkdownToStructured(markdownOutput),
          usedProvider: "openai",
          usedModel: "gpt-4o-mini",
        });
      } catch (err) {
        // Continue to fallback
      }
    }
  }

  // Fallback intelligent story generator
  const fallback = generateFallbackStory(contextText, projectName, epicName, requester, extraInstructions);
  return res.json({
    ...fallback,
    usedProvider: "fallback",
    usedModel: "local-heuristic",
  });
});

// Endpoint to Refine or Edit Story with AI
app.post("/api/refine-story", async (req, res) => {
  const {
    currentStoryMarkdown,
    refinementInstruction,
    provider = "gemini",
    model = "gemini-2.5-flash",
  } = req.body;

  if (!currentStoryMarkdown || !refinementInstruction) {
    return res.status(400).json({ error: "História atual ou instrução de refinamento ausente." });
  }

  const prompt = `
HISTÓRIA DE USUÁRIO ATUAL:
${currentStoryMarkdown}

INSTRUÇÃO DE REFINAMENTO SOLICITADA PELO USUÁRIO:
${refinementInstruction}

Reescreva a História de Usuário incorporando exatamente esta melhoria ou ajuste, mantendo rigorosamente a estrutura exigida:
# Título
# História
# Contexto
# Critérios de Aceitação
# Regras de Negócio
# Cenários BDD
`;

  // Try OpenAI if selected
  if (provider === "openai") {
    const openai = getOpenAIClient();
    if (openai) {
      try {
        const targetModel = model.startsWith("gpt-") ? model : "gpt-4o-mini";
        const completion = await openai.chat.completions.create({
          model: targetModel,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        });

        const markdownOutput = completion.choices[0]?.message?.content || "";
        const structuredOutput = parseMarkdownToStructured(markdownOutput);

        return res.json({
          rawMarkdown: markdownOutput,
          structured: structuredOutput,
          usedProvider: "openai",
          usedModel: targetModel,
        });
      } catch (error: any) {
        console.warn("Falha no refinamento OpenAI:", error?.message || error);
      }
    }
  }

  // Try Gemini
  const ai = getGeminiClient();
  if (ai) {
    try {
      const targetModel = model.startsWith("gemini-") ? model : "gemini-2.5-flash";
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_PROMPT,
          temperature: 0.2,
        },
      });

      const markdownOutput = response.text || "";
      const structuredOutput = parseMarkdownToStructured(markdownOutput);

      return res.json({
        rawMarkdown: markdownOutput,
        structured: structuredOutput,
        usedProvider: "gemini",
        usedModel: targetModel,
      });
    } catch (error: any) {
      console.warn("Falha no refinamento Gemini, executando contingência:", error?.message || error);
    }
  }

  const fallback = refineFallbackStory(currentStoryMarkdown, refinementInstruction);
  return res.json(fallback);
});

// Endpoint for INVEST criteria & Quality Audit
app.post("/api/audit-invest", async (req, res) => {
  const { storyMarkdown, provider = "gemini", model = "gemini-2.5-flash" } = req.body;

  if (!storyMarkdown) {
    return res.status(400).json({ error: "História de usuário ausente." });
  }

  const prompt = `
Avalie a seguinte História de Usuário segundo o acrônimo INVEST do Scrum / Requisitos Ágeis:
- **I**ndependent (Independente)
- **N**egotiable (Negociável)
- **V**aluable (Valiosa)
- **E**stimable (Estimável)
- **S**mall / Sized appropriately (Pequena)
- **T**estable (Testável)

HISTÓRIA DE USUÁRIO:
${storyMarkdown}

Forneça um relatório sucinto em JSON com os seguintes campos:
- score (0 a 100)
- investChecklist: array de objetos { criterion: string, status: 'pass' | 'warning' | 'fail', feedback: string }
- recommendations: array de strings com sugestões práticas.
- estimatedStoryPoints: objeto { points: number, justification: string }
`;

  // Try OpenAI if selected
  if (provider === "openai") {
    const openai = getOpenAIClient();
    if (openai) {
      try {
        const targetModel = model.startsWith("gpt-") ? model : "gpt-4o-mini";
        const completion = await openai.chat.completions.create({
          model: targetModel,
          messages: [
            {
              role: "system",
              content: "Você é um auditor de requisitos ágeis especialista no acrônimo INVEST. Responda em JSON.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });

        const text = completion.choices[0]?.message?.content || "{}";
        return res.json(JSON.parse(text));
      } catch (error: any) {
        console.warn("Falha no audit INVEST OpenAI:", error?.message || error);
      }
    }
  }

  // Try Gemini
  const ai = getGeminiClient();
  if (ai) {
    try {
      const targetModel = model.startsWith("gemini-") ? model : "gemini-2.5-flash";
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      return res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.warn("Falha na auditoria INVEST Gemini, gerando relatório de contingência:", error?.message || error);
    }
  }

  return res.json(auditFallbackInvest(storyMarkdown));
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Agile Requirements Studio] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
