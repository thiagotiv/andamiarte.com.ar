export type FileKind = "avatar" | "cv";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const RULES: Record<FileKind, { types: string[]; label: string }> = {
  avatar: { types: ["image/jpeg", "image/png", "image/webp"], label: "una imagen JPG, PNG o WEBP" },
  cv: { types: ["application/pdf"], label: "un archivo PDF" },
};
export const acceptFor = (kind: FileKind) => RULES[kind].types.join(",");
/** Returns an error message in Spanish, or null when the file is valid. */
export function validateProfileFile(kind: FileKind, file: { type: string; size: number }): string | null {
  if (!RULES[kind].types.includes(file.type)) return `Elegí ${RULES[kind].label}.`;
  if (file.size > MAX_FILE_BYTES) return "El archivo debe pesar menos de 5 MB.";
  return null;
}
export function profileFilePath(userId: string, kind: FileKind, fileName: string, now = Date.now()) {
  const ext = kind === "cv" ? "pdf" : (fileName.split(".").pop() ?? "jpg").toLowerCase();
  return `${userId}/${kind === "cv" ? "cv_path" : "avatar_path"}-${now}.${ext}`;
}
