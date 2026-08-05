/**
 * Helper utility to extract text content and Base64 images from user uploaded files.
 */

export interface ParsedFileInfo {
  fileName: string;
  fileSizeFormatted: string;
  fileType: string;
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
  isImage: boolean;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function parseUploadedFile(file: File): Promise<ParsedFileInfo> {
  const fileName = file.name;
  const fileSizeFormatted = formatFileSize(file.size);
  const mimeType = file.type;
  const isImage = file.type.startsWith("image/");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (isImage) {
      reader.onload = () => {
        const resultStr = reader.result as string;
        // Strip data:image/png;base64, header for Gemini API inlineData
        const base64Data = resultStr.split(",")[1] || resultStr;
        resolve({
          fileName,
          fileSizeFormatted,
          fileType: file.type || "Imagem",
          base64Data,
          mimeType: file.type || "image/png",
          isImage: true,
          textContent: `[Arquivo de Imagem Anexado: ${fileName} (${fileSizeFormatted})]`,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    } else {
      // Text / Document file
      reader.onload = () => {
        const textContent = (reader.result as string) || "";
        resolve({
          fileName,
          fileSizeFormatted,
          fileType: file.type || "Documento",
          textContent,
          isImage: false,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    }
  });
}
