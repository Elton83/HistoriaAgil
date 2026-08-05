import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Mock/Fallback mode will be enabled if needed.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

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

// Endpoint to Generate User Story from Context
app.post("/api/generate-story", async (req, res) => {
  try {
    const { contextText, projectName, epicName, requester, extraInstructions, images } = req.body;

    if (!contextText || typeof contextText !== "string") {
      return res.status(400).json({ error: "Contexto de negócio não fornecido." });
    }

    const ai = getGeminiClient();

    let fullPrompt = `CONTEXTO DO REQUISITO FORNECIDO:\n\n${contextText}\n\n`;
    if (projectName) fullPrompt += `Projeto: ${projectName}\n`;
    if (epicName) fullPrompt += `Épico Relacionado: ${epicName}\n`;
    if (requester) fullPrompt += `Demandante / Solicitante: ${requester}\n`;
    if (extraInstructions) fullPrompt += `Instruções Adicionais de Foco: ${extraInstructions}\n`;

    fullPrompt += `\nLembre-se de seguir rigorosamente todas as regras e o formato exigido de resposta.`;

    // Construct parts
    const parts: any[] = [{ text: fullPrompt }];

    // If images attached
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: { mimeType?: string; base64Data?: string }) => {
        if (img.base64Data && img.mimeType) {
          parts.unshift({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64Data,
            },
          });
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROMPT,
        temperature: 0.2, // low temperature for consistent agile output
      },
    });

    const markdownOutput = response.text || "";
    const structuredOutput = parseMarkdownToStructured(markdownOutput);

    return res.json({
      rawMarkdown: markdownOutput,
      structured: structuredOutput,
    });
  } catch (error: any) {
    console.error("Erro ao gerar história de usuário:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao comunicar com a IA para gerar a História de Usuário.",
      details: error?.message || String(error),
    });
  }
});

// Endpoint to Refine or Edit Story with AI
app.post("/api/refine-story", async (req, res) => {
  try {
    const { currentStoryMarkdown, refinementInstruction } = req.body;

    if (!currentStoryMarkdown || !refinementInstruction) {
      return res.status(400).json({ error: "História atual ou instrução de refinamento ausente." });
    }

    const ai = getGeminiClient();

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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
    });
  } catch (error: any) {
    console.error("Erro ao refinar história:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao refinar a História de Usuário.",
      details: error?.message || String(error),
    });
  }
});

// Endpoint for INVEST criteria & Quality Audit
app.post("/api/audit-invest", async (req, res) => {
  try {
    const { storyMarkdown } = req.body;
    const ai = getGeminiClient();

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
- estimatedStoryPoints: número recomendado (ex: 1, 2, 3, 5, 8, 13) e justificativa.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    return res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Erro no audit INVEST:", error);
    return res.status(500).json({ error: "Falha na auditoria INVEST da história." });
  }
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
