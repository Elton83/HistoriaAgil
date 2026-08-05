import { jsPDF } from "jspdf";
import { UserStory } from "../types";

export function generateStoryPDF(story: UserStory): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;
  let y = margin;

  const checkAddPage = (neededHeight: number = 10) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Top banner border
    doc.setDrawColor(79, 70, 229); // Indigo 600
    doc.setLineWidth(1);
    doc.line(margin, 10, pageWidth - margin, 10);

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(
      "Agile Requirement Studio • Documento de Homologação de Requisito",
      margin,
      pageHeight - 8
    );
    doc.text(
      `Página ${doc.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  };

  drawHeaderFooter();

  // Document Title Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, y, maxLineWidth, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("ESPECIFICAÇÃO DE REQUISITO & HOMOLOGAÇÃO", margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254); // Indigo 200
  doc.text(
    `Projeto: ${story.projectName || "Geral"}  |  Épico: ${story.epicName || "N/A"}  |  Data: ${new Date(
      story.updatedAt || Date.now()
    ).toLocaleDateString("pt-BR")}`,
    margin + 5,
    y + 13
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240); // Slate 200
  doc.text(
    `Demandante / Solicitante: ${story.requester || "Não especificado"}`,
    margin + 5,
    y + 19
  );

  y += 29;

  // Title of Story
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(story.title || "História de Usuário", maxLineWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 2;

  // Validation Report Badge Box if available
  if (story.validationReport) {
    const report = story.validationReport;
    const score = report.scorePercent;

    let boxColor: [number, number, number] = [236, 253, 245]; // Emerald 50
    let borderColor: [number, number, number] = [16, 185, 129]; // Emerald 500
    let textColor: [number, number, number] = [4, 120, 87]; // Emerald 700

    if (score < 60) {
      boxColor = [255, 241, 242];
      borderColor = [244, 63, 94];
      textColor = [190, 18, 60];
    } else if (score < 85) {
      boxColor = [254, 252, 232];
      borderColor = [234, 179, 8];
      textColor = [161, 98, 7];
    }

    doc.setFillColor(...boxColor);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, maxLineWidth, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(
      `RELATÓRIO DE VALIDAÇÃO: ${score}% APROVADO (${report.passedCount} Passou • ${report.warningsCount} Alerta(s) • ${report.failedCount} Falha(s))`,
      margin + 4,
      y + 6
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Sintaxe e critérios de aceitação validados em ${new Date(
        report.evaluatedAt
      ).toLocaleString("pt-BR")}`,
      margin + 4,
      y + 11
    );

    y += 18;
  }

  // User Story Core Box (Como, Quero, Para)
  checkAddPage(25);
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);

  const roleText = `COMO: ${story.story.role || ""}`;
  const wantText = `QUERO: ${story.story.want || ""}`;
  const soThatText = `PARA: ${story.story.soThat || ""}`;

  const roleWrapped = doc.splitTextToSize(roleText, maxLineWidth - 8);
  const wantWrapped = doc.splitTextToSize(wantText, maxLineWidth - 8);
  const soThatWrapped = doc.splitTextToSize(soThatText, maxLineWidth - 8);

  const boxHeight = (roleWrapped.length + wantWrapped.length + soThatWrapped.length) * 5 + 10;
  doc.roundedRect(margin, y, maxLineWidth, boxHeight, 2, 2, "FD");

  let boxY = y + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(67, 56, 202); // Indigo 700

  doc.text(roleWrapped, margin + 4, boxY);
  boxY += roleWrapped.length * 5;

  doc.text(wantWrapped, margin + 4, boxY);
  boxY += wantWrapped.length * 5;

  doc.text(soThatWrapped, margin + 4, boxY);

  y += boxHeight + 6;

  // Context Section
  if (story.context) {
    checkAddPage(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("1. Contexto e Motivação de Negócio", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const contextLines = doc.splitTextToSize(story.context, maxLineWidth);
    doc.text(contextLines, margin, y);
    y += contextLines.length * 4.5 + 6;
  }

  // Acceptance Criteria (ACs)
  if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
    checkAddPage(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Critérios de Aceitação (ACs)", margin, y);
    y += 6;

    story.acceptanceCriteria.forEach((ac) => {
      checkAddPage(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(16, 185, 129); // Emerald 600
      doc.text(`[${ac.done ? "X" : " "}] ${ac.id}:`, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      const acLines = doc.splitTextToSize(ac.text, maxLineWidth - 18);
      doc.text(acLines, margin + 18, y);
      y += acLines.length * 4.5 + 3;
    });

    y += 3;
  }

  // Business Rules (RNs)
  if (story.businessRules && story.businessRules.length > 0) {
    checkAddPage(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("3. Regras de Negócio e Validações Complementares", margin, y);
    y += 6;

    story.businessRules.forEach((rn) => {
      checkAddPage(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(6, 182, 212); // Cyan 600
      doc.text(`${rn.id}:`, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      const rnLines = doc.splitTextToSize(rn.text, maxLineWidth - 16);
      doc.text(rnLines, margin + 16, y);
      y += rnLines.length * 4.5 + 3;
    });

    y += 3;
  }

  // BDD Scenarios
  if (story.bddScenarios && story.bddScenarios.length > 0) {
    checkAddPage(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("4. Especificação por Exemplo / Cenários BDD (Gherkin)", margin, y);
    y += 6;

    story.bddScenarios.forEach((sc, i) => {
      checkAddPage(25);

      doc.setFillColor(241, 245, 249); // Slate 100
      doc.rect(margin, y, maxLineWidth, 5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(79, 70, 229);
      doc.text(`Cenário ${i + 1}: ${sc.title}`, margin + 2, y + 3.5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      const givenLines = doc.splitTextToSize(`Dado ${sc.given}`, maxLineWidth - 6);
      doc.text(givenLines, margin + 4, y);
      y += givenLines.length * 4;

      const whenLines = doc.splitTextToSize(`Quando ${sc.when}`, maxLineWidth - 6);
      doc.text(whenLines, margin + 4, y);
      y += whenLines.length * 4;

      const thenLines = doc.splitTextToSize(`Então ${sc.then}`, maxLineWidth - 6);
      doc.text(thenLines, margin + 4, y);
      y += thenLines.length * 4 + 4;
    });
  }

  // Detailed Validation Tests Section in PDF
  if (story.validationReport && story.validationReport.tests.length > 0) {
    checkAddPage(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("5. Detalhamento dos Testes de Validação Automática", margin, y);
    y += 6;

    story.validationReport.tests.forEach((test) => {
      checkAddPage(10);

      let statusLabel = "[PASSOU]";
      let statusColor: [number, number, number] = [16, 185, 129]; // Emerald
      if (test.status === "warning") {
        statusLabel = "[ALERTA]";
        statusColor = [217, 119, 6]; // Amber
      } else if (test.status === "fail") {
        statusLabel = "[FALHOU]";
        statusColor = [225, 29, 72]; // Rose
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...statusColor);
      doc.text(`${statusLabel} ${test.name}`, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const msgLines = doc.splitTextToSize(test.message, maxLineWidth - 35);
      doc.text(msgLines, margin + 35, y);
      y += Math.max(1, msgLines.length) * 4 + 2;
    });
  }

  // Save / Download PDF
  const filenameClean = (story.title || "requisito")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 30);
  doc.save(`Requisito_Validado_${filenameClean}.pdf`);
}
