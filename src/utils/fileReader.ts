import JSZip from "jszip";
import * as XLSX from "xlsx";

export interface ParsedFileInfo {
  fileName: string;
  fileSizeFormatted: string;
  fileType: string;
  category: "image" | "spreadsheet" | "zip" | "video" | "text" | "document";
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
  isImage: boolean;
  isVideo: boolean;
  isSpreadsheet: boolean;
  isZip: boolean;
  videoUrl?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function parseUploadedFile(file: File): Promise<ParsedFileInfo> {
  const fileName = file.name;
  const fileSizeFormatted = formatFileSize(file.size);
  const mimeType = file.type || "";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const isImage = mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
  const isVideo = mimeType.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext);
  const isSpreadsheet =
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv") ||
    ["csv", "xlsx", "xls", "ods"].includes(ext);
  const isZip = mimeType.includes("zip") || ext === "zip";

  // 1. IMAGE PROCESSING
  if (isImage) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.split(",")[1] || resultStr;
        resolve({
          fileName,
          fileSizeFormatted,
          fileType: mimeType || "Imagem",
          category: "image",
          base64Data,
          mimeType: mimeType || "image/png",
          isImage: true,
          isVideo: false,
          isSpreadsheet: false,
          isZip: false,
          textContent: `[Arquivo de Imagem Anexado: ${fileName} (${fileSizeFormatted})]`,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // 2. VIDEO PROCESSING
  if (isVideo) {
    const videoUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.split(",")[1] || resultStr;
        resolve({
          fileName,
          fileSizeFormatted,
          fileType: mimeType || "Vídeo",
          category: "video",
          base64Data,
          mimeType: mimeType || "video/mp4",
          isImage: false,
          isVideo: true,
          isSpreadsheet: false,
          isZip: false,
          videoUrl,
          textContent: `[Gravação / Vídeo Anexado: ${fileName} (${fileSizeFormatted}) - O escopo inclui demonstração visual em vídeo.]`,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // 3. SPREADSHEET (XLSX, XLS, CSV)
  if (isSpreadsheet) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      let spreadsheetSummary = `--- Conteúdo da Planilha (${fileName}) ---\n`;
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        if (csvContent.trim()) {
          spreadsheetSummary += `\n--- Aba: ${sheetName} ---\n${csvContent}\n`;
        }
      });

      return {
        fileName,
        fileSizeFormatted,
        fileType: "Planilha (Excel/CSV)",
        category: "spreadsheet",
        textContent: spreadsheetSummary,
        isImage: false,
        isVideo: false,
        isSpreadsheet: true,
        isZip: false,
      };
    } catch (err) {
      console.warn("Falha ao ler planilha via XLSX, fallback para leitura em texto:", err);
      const text = await file.text();
      return {
        fileName,
        fileSizeFormatted,
        fileType: "Planilha (Texto)",
        category: "spreadsheet",
        textContent: `--- Conteúdo da Planilha (${fileName}) ---\n${text}`,
        isImage: false,
        isVideo: false,
        isSpreadsheet: true,
        isZip: false,
      };
    }
  }

  // 4. ZIP ARCHIVE
  if (isZip) {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      const fileList: string[] = [];
      let extractedText = `--- Conteúdo Extraído do Arquivo ZIP (${fileName}) ---\n\n`;

      const entries = Object.keys(contents.files);
      for (const entryPath of entries) {
        const entry = contents.files[entryPath];
        if (!entry.dir) {
          fileList.push(entryPath);
          const entryExt = entryPath.split(".").pop()?.toLowerCase() || "";
          
          // Read readable text files inside zip
          if (["txt", "md", "json", "csv", "js", "ts", "tsx", "jsx", "html", "css", "py", "sql", "xml", "yaml", "yml"].includes(entryExt)) {
            try {
              const text = await entry.async("string");
              if (text.trim().length > 0 && text.length < 50000) {
                extractedText += `=== Arquivo: ${entryPath} ===\n${text}\n\n`;
              }
            } catch {
              // ignore non-text file read errors inside zip
            }
          }
        }
      }

      const zipSummary = `Arquivos no ZIP (${fileList.length} itens):\n${fileList.slice(0, 15).map(f => ` - ${f}`).join("\n")}${fileList.length > 15 ? `\n ... e mais ${fileList.length - 15} arquivos` : ""}\n\n${extractedText}`;

      return {
        fileName,
        fileSizeFormatted,
        fileType: "Arquivo Compactado (ZIP)",
        category: "zip",
        textContent: zipSummary,
        isImage: false,
        isVideo: false,
        isSpreadsheet: false,
        isZip: true,
      };
    } catch (err) {
      console.error("Erro ao descompactar arquivo ZIP:", err);
      return {
        fileName,
        fileSizeFormatted,
        fileType: "Arquivo ZIP (Erro de leitura)",
        category: "zip",
        textContent: `[Arquivo ZIP Anexado: ${fileName} (${fileSizeFormatted}) - Não foi possível extrair o conteúdo automaticamente.]`,
        isImage: false,
        isVideo: false,
        isSpreadsheet: false,
        isZip: true,
      };
    }
  }

  // 5. STANDARD DOCUMENT / TEXT
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const textContent = (reader.result as string) || "";
      resolve({
        fileName,
        fileSizeFormatted,
        fileType: mimeType || "Documento",
        category: "document",
        textContent: `--- Conteúdo do Documento (${fileName}) ---\n${textContent}`,
        isImage: false,
        isVideo: false,
        isSpreadsheet: false,
        isZip: false,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

/**
 * Helper to process recorded video Blob from MediaRecorder
 */
export async function parseRecordedVideoBlob(blob: Blob, customName?: string): Promise<ParsedFileInfo> {
  const fileName = customName || `gravacao_video_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.webm`;
  const fileSizeFormatted = formatFileSize(blob.size);
  const videoUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.split(",")[1] || resultStr;
      resolve({
        fileName,
        fileSizeFormatted,
        fileType: blob.type || "video/webm",
        category: "video",
        base64Data,
        mimeType: blob.type || "video/webm",
        isImage: false,
        isVideo: true,
        isSpreadsheet: false,
        isZip: false,
        videoUrl,
        textContent: `[Gravação de Vídeo ao Vivo Anexada: ${fileName} (${fileSizeFormatted}) - Vídeo de demonstração gravado via câmera/tela pelo usuário.]`,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

