export type MediaUploadType = "image" | "video" | "pdf";

export interface CloudinaryUploadResult {
  url: string;
  type: MediaUploadType;
  fileName: string;
  fileSize: number;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Detecta y valida el tipo de multimedia permitido para la comunidad
 */
export function getFileMediaType(file: File): MediaUploadType {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  throw new Error(
    "Formato no compatible. Por favor seleccioná una imagen (JPG, PNG, WebP), video (MP4, WebM) o documento PDF."
  );
}

/**
 * Valida los límites de peso establecidos para cada tipo de archivo
 */
export function validateFileSize(file: File, type: MediaUploadType): void {
  if (type === "image" && file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `La imagen supera el límite de 5 MB (peso actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`
    );
  }
  if (type === "pdf" && file.size > MAX_PDF_SIZE) {
    throw new Error(
      `El documento PDF supera el límite de 10 MB (peso actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`
    );
  }
  if (type === "video" && file.size > MAX_VIDEO_SIZE) {
    throw new Error(
      `El video supera el límite de 25 MB (peso actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`
    );
  }
}

/**
 * Formatea bytes a una cadena legible (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sube un archivo a Cloudinary vía API sin firma (unsigned upload preset)
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!file) {
    throw new Error("No se seleccionó ningún archivo.");
  }

  const type = getFileMediaType(file);
  validateFileSize(file, type);

  const cloudName =
    import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] ||
    (typeof process !== "undefined" ? process.env["VITE_CLOUDINARY_CLOUD_NAME"] : undefined);
  const uploadPreset =
    import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] ||
    (typeof process !== "undefined" ? process.env["VITE_CLOUDINARY_UPLOAD_PRESET"] : undefined);

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Configuración de Cloudinary pendiente: asegurate de definir VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tu archivo .env"
    );
  }

  // Endpoint oficial según el tipo de recurso
  let endpointType = "auto";
  if (type === "image") {
    endpointType = "image";
  } else if (type === "video") {
    endpointType = "video";
  } else if (type === "pdf") {
    endpointType = "raw";
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${endpointType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      data?.error?.message ||
      `Error de Cloudinary (${response.status}): ${response.statusText || "No se pudo subir el archivo"}`;
    throw new Error(errorMsg);
  }

  const resultUrl = data?.secure_url || data?.url;
  if (!resultUrl) {
    throw new Error("Cloudinary no devolvió una URL válida del archivo.");
  }

  return {
    url: resultUrl,
    type,
    fileName: file.name,
    fileSize: file.size,
  };
}
