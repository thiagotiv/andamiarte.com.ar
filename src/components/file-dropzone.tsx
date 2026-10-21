import { useEffect, useRef, useState, type DragEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, ImageUp, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { acceptFor, profileFilePath, validateProfileFile, type FileKind } from "@/lib/profile-files";

export function FileDropzone({ userId, kind, currentPath }: { userId: string; kind: FileKind; currentPath?: string | null }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "avatar" || !currentPath || preview) return;
    let alive = true;
    supabase.storage.from("profile-files").createSignedUrl(currentPath, 3600).then(({ data }) => {
      if (alive && data) setPreview(data.signedUrl);
    });
    return () => { alive = false; };
  }, [kind, currentPath, preview]);

  async function handle(file: File | undefined) {
    if (!file) return;
    const err = validateProfileFile(kind, file);
    if (err) { toast.error(err); return; }
    setBusy(true);
    const path = profileFilePath(userId, kind, file.name);
    const up = await supabase.storage.from("profile-files").upload(path, file, { contentType: file.type });
    if (up.error) { toast.error("No pudimos subir el archivo."); setBusy(false); return; }
    const u = await supabase.from("profiles").update(kind === "avatar" ? { avatar_path: path } : { cv_path: path }).eq("id", userId);
    setBusy(false);
    if (u.error) { toast.error("No pudimos guardar el archivo en tu perfil."); return; }
    if (kind === "avatar") setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    toast.success(kind === "avatar" ? "Foto actualizada" : "CV guardado");
    await qc.invalidateQueries();
  }
  function drop(e: DragEvent) { e.preventDefault(); setOver(false); void handle(e.dataTransfer.files[0]); }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`dropzone ${over ? "over" : ""}`}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") input.current?.click(); }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <input ref={input} hidden type="file" accept={acceptFor(kind)} onChange={(e) => void handle(e.target.files?.[0])} />
      {kind === "avatar" && preview ? <img src={preview} alt="Vista previa de tu foto" className="dropzone-preview" />
        : <span className="dropzone-icon">{kind === "avatar" ? <ImageUp /> : <FileText />}</span>}
      <div>
        <strong>{kind === "avatar" ? "Foto de perfil" : "CV en PDF"}</strong>
        <p className="meta">
          {busy ? <><Loader2 className="animate-spin" /> Subiendo…</>
            : fileName ?? (kind === "cv" && currentPath ? "Ya tenés un CV cargado. Soltá otro para reemplazarlo."
              : <><UploadCloud /> Arrastrá el archivo o hacé clic · máx. 5 MB</>)}
        </p>
      </div>
    </div>
  );
}
