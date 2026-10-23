import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  Users,
  BriefcaseBusiness,
  Send,
  Trash2,
  MapPin,
  FileText,
  BarChart2,
  Download,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Share2,
  Image as ImageIcon,
  Video,
  PenSquare,
  Bookmark,
  CornerDownRight,
  Hash,
  ArrowRight,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, Empty, RouteError } from "@/components/site-shell";
import { useSession } from "@/components/session";
import {
  uploadToCloudinary,
  formatFileSize,
  getFileMediaType,
  validateFileSize,
  MediaUploadType,
} from "@/lib/cloudinary";
import {
  networkOptions,
  accountOptions,
  pageHead,
  analyticsOptions,
  myConnectionsOptions,
  votePostPoll,
  sharePost,
  togglePostLike,
  addPostComment,
  createPost,
  deletePost,
} from "@/lib/network";
import { formatTimeAgo } from "@/lib/analytics";
import { ProfileAnalytics } from "@/components/profile-analytics";
import { ConnectButton } from "@/components/connect-button";

export const Route = createFileRoute("/comunidad")({
  loader: ({ context }) => context.queryClient.ensureQueryData(networkOptions),
  head: () =>
    pageHead(
      "Comunidad Profesional",
      "Feed profesional de inclusión escolar. Compartí recursos pedagógicos, logros de aula, encuestas y conectá con colegas y familias.",
    ),
  component: Community,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

const SUGGESTED_TAGS = [
  "#RecursoPedagógico",
  "#Pictogramas",
  "#InclusiónÁulica",
  "#Debate",
  "#EstrategiasAula",
  "#TEA",
  "#PrimerCiclo",
];

const TRENDING_TOPICS = [
  { tag: "#PictogramasTEA", count: 28, category: "Recursos visuales" },
  { tag: "#InclusiónÁulica", count: 42, category: "Prácticas pedagógicas" },
  { tag: "#AdaptaciónCurricular", count: 35, category: "Planificación" },
  { tag: "#RegulacionSensorial", count: 19, category: "Terapia y apoyo" },
  { tag: "#AIEEscolar", count: 54, category: "Comunidad" },
];

function Community() {
  const { data } = useSuspenseQuery(networkOptions);
  const { user } = useSession();
  const { data: account } = useQuery({ ...accountOptions, enabled: !!user });
  const { data: analytics } = useQuery({ ...analyticsOptions, enabled: !!user && account?.role === "aie" });
  const { data: connectionsData } = useQuery({ ...myConnectionsOptions, enabled: !!user });
  const qc = useQueryClient();

  // Composer State
  const [composerOpen, setComposerOpen] = useState(false);
  const [content, setContent] = useState("");
  const [kind, setKind] = useState("logro");
  const [filter, setFilter] = useState<"todos" | "recursos" | "encuestas" | "logros">("todos");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [votingBusyId, setVotingBusyId] = useState<string | null>(null);

  // Attachments State (Cloudinary Multimedia)
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaFileType, setMediaFileType] = useState<MediaUploadType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Hidden File Inputs Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Poll State
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Tags State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Social interactions UI State
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  const [openCommentsPostIds, setOpenCommentsPostIds] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; authorName: string } | null>(null);
  const [shareBusyPostId, setShareBusyPostId] = useState<string | null>(null);

  // =====================================================================
  // MUTACIÓN PARA "ME GUSTA" CON ACTUALIZACIÓN OPTIMISTA INMEDIATA
  // =====================================================================
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!user) throw new Error("Debes iniciar sesión para reaccionar");
      const res = await togglePostLike({ data: { postId } });
      return { liked: res.liked, postId };
    },
    onMutate: async ({ postId }) => {
      if (!user) return;
      await qc.cancelQueries({ queryKey: ["network"] });
      const previousData = qc.getQueryData<any>(networkOptions.queryKey);

      qc.setQueryData(networkOptions.queryKey, (old: any) => {
        if (!old) return old;
        const currentLikes = old.likes || [];
        const alreadyLiked = currentLikes.some((l: any) => l.post_id === postId && l.user_id === user.id);

        const newLikes = alreadyLiked
          ? currentLikes.filter((l: any) => !(l.post_id === postId && l.user_id === user.id))
          : [...currentLikes, { post_id: postId, user_id: user.id, reaction_type: "like" }];

        const newPosts = (old.posts || []).map((post: any) => {
          if (post.id !== postId) return post;
          const currentCount = post.likes_count ?? 0;
          return {
            ...post,
            likes_count: alreadyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
          };
        });

        return { ...old, likes: newLikes, posts: newPosts };
      });

      return { previousData };
    },
    onError: (err: any, _vars, context) => {
      console.error("[toggleLikeMutation:onError]", err);
      if (context?.previousData) {
        qc.setQueryData(networkOptions.queryKey, context.previousData);
      }
      toast.error(err?.message || "No se pudo registrar tu Me gusta.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["network"] });
    },
  });

  // =====================================================================
  // MUTACIÓN PARA AGREGAR COMENTARIO CON ACTUALIZACIÓN OPTIMISTA
  // =====================================================================
  const addCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      content: commentText,
      parentId,
    }: {
      postId: string;
      content: string;
      parentId?: string | null;
    }) => {
      if (!user) throw new Error("Debes iniciar sesión para comentar");
      const res = await addPostComment({
        data: {
          postId,
          content: commentText,
          parentId: parentId || null,
        },
      });
      return res.comment;
    },
    onMutate: async ({ postId, content: commentText, parentId }) => {
      if (!user) return;
      await qc.cancelQueries({ queryKey: ["network"] });
      const previousData = qc.getQueryData<any>(networkOptions.queryKey);

      const optimisticComment = {
        id: `temp-${Date.now()}`,
        post_id: postId,
        author_id: user.id,
        author_name: account?.profile?.name || "Tú",
        author_role: account?.role || "aie",
        author_avatar: account?.profile?.avatar_path || null,
        content: commentText,
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
      };

      qc.setQueryData(networkOptions.queryKey, (old: any) => {
        if (!old) return old;
        const newComments = [...(old.comments || []), optimisticComment];
        const newPosts = (old.posts || []).map((post: any) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            comments_count: (post.comments_count ?? 0) + 1,
          };
        });

        return { ...old, comments: newComments, posts: newPosts };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Comentario publicado");
    },
    onError: (err: any, _vars, context) => {
      console.error("[addCommentMutation:onError]", err);
      if (context?.previousData) {
        qc.setQueryData(networkOptions.queryKey, context.previousData);
      }
      toast.error(err?.message || "No se pudo publicar el comentario.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["network"] });
    },
  });

  // Toggle content expansion ("...ver más")
  function toggleExpandPost(postId: string) {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  // Toggle comments thread
  function toggleComments(postId: string) {
    setOpenCommentsPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  function addPollOption() {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  }

  function removePollOption(index: number) {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  }

  function updatePollOption(index: number, value: string) {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  }

  function handleFileSelected(file: File) {
    try {
      const type = getFileMediaType(file);
      validateFileSize(file, type);

      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }

      setSelectedMediaFile(file);
      setMediaFileType(type);
      setComposerOpen(true);

      if (type === "image" || type === "video") {
        const objUrl = URL.createObjectURL(file);
        setMediaPreviewUrl(objUrl);
      } else {
        setMediaPreviewUrl(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al seleccionar el archivo.");
    }
  }

  function handleRemoveFile() {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setSelectedMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaFileType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  async function publish() {
    if (!user || !account?.profile) return;
    if (!content.trim() && !selectedMediaFile && !showPoll) {
      toast.error("Por favor escribí un mensaje o adjuntá un archivo para publicar.");
      return;
    }

    if (showPoll) {
      if (!pollQuestion.trim()) {
        toast.error("Escribí la pregunta para la encuesta.");
        return;
      }
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length < 2) {
        toast.error("La encuesta debe tener al menos 2 opciones de respuesta.");
        return;
      }
    }

    setBusy(true);

    let mediaPayload: {
      url: string;
      type: "image" | "video" | "pdf";
      fileName: string;
      fileSize: number;
    } | null = null;

    if (selectedMediaFile) {
      setIsUploading(true);
      try {
        const result = await uploadToCloudinary(selectedMediaFile);
        mediaPayload = {
          url: result.url,
          type: result.type,
          fileName: result.fileName,
          fileSize: result.fileSize,
        };
      } catch (err: any) {
        toast.error(err?.message || "No se pudo subir el archivo a Cloudinary.");
        setBusy(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const validOptions = pollOptions.filter((o) => o.trim());
    const pollData =
      showPoll && pollQuestion.trim() && validOptions.length >= 2
        ? {
            question: pollQuestion.trim(),
            options: validOptions.map((text, idx) => ({
              id: `opt-${idx + 1}`,
              text: text.trim(),
              votes: 0,
            })),
            voters: {},
          }
        : null;

    const postKind = pollData
      ? "encuesta"
      : mediaPayload
        ? mediaPayload.type === "pdf"
          ? "recurso"
          : mediaPayload.type
        : kind;

    try {
      await createPost({
        data: {
          content: content.trim(),
          kind: postKind,
          media: mediaPayload,
          attachmentUrl: mediaPayload ? mediaPayload.url : null,
          attachmentName: mediaPayload ? mediaPayload.fileName : null,
          attachmentType: mediaPayload
            ? mediaPayload.type === "pdf"
              ? "application/pdf"
              : `${mediaPayload.type}/*`
            : null,
          pollData,
          tags: selectedTags,
        },
      });

      setContent("");
      handleRemoveFile();
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setSelectedTags([]);
      setComposerOpen(false);
      toast.success("¡Tu publicación ya está visible en la comunidad!");
      await qc.invalidateQueries({ queryKey: ["network"] });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo publicar");
    } finally {
      setBusy(false);
    }
  }

  function handleToggleLike(postId: string) {
    if (!user) {
      toast.info("Iniciá sesión para reaccionar a las publicaciones.");
      return;
    }
    toggleLikeMutation.mutate({ postId });
  }

  function handleSendComment(postId: string) {
    if (!user) {
      toast.info("Iniciá sesión para comentar.");
      return;
    }

    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) return;

    addCommentMutation.mutate({
      postId,
      content: draft,
      parentId: replyingTo?.postId === postId ? replyingTo.commentId : null,
    });

    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    setReplyingTo(null);
  }

  async function handleShare(postId: string) {
    setShareBusyPostId(postId);
    try {
      if (user) {
        await sharePost({ data: { postId } });
        await qc.invalidateQueries({ queryKey: ["network"] });
      }
      const postUrl = `${window.location.origin}/comunidad#post-${postId}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
      }
      toast.success("¡Publicación compartida! Enlace copiado al portapapeles.");
    } catch {
      toast.info("Enlace generado para compartir.");
    } finally {
      setShareBusyPostId(null);
    }
  }

  async function handleVotePoll(postId: string, optionId: string) {
    if (!user) {
      toast.info("Ingresá con tu cuenta para participar en las encuestas de la comunidad.");
      return;
    }
    setVotingBusyId(postId);
    try {
      await votePostPoll({ data: { postId, optionId } });
      toast.success("¡Tu voto fue registrado!");
      await qc.invalidateQueries({ queryKey: ["network"] });
    } catch {
      toast.error("No se pudo registrar tu voto.");
    } finally {
      setVotingBusyId(null);
    }
  }

  // Filter posts based on active filter and active tag
  const filteredPosts = data.posts.filter((p) => {
    if (selectedTagFilter && (!p.tags || !p.tags.includes(selectedTagFilter))) {
      return false;
    }
    if (filter === "recursos") {
      return p.kind === "recurso" || !!p.attachment_url || (p as any).media?.type === "pdf";
    }
    if (filter === "encuestas") {
      return p.kind === "encuesta" || !!p.poll_data;
    }
    if (filter === "logros") {
      return p.kind === "logro";
    }
    return true;
  });

  const likesList = (data as any).likes || [];
  const commentsList = (data as any).comments || [];

  // Suggestions for right sidebar
  const suggestions = (data.professionals || [])
    .filter((pro) => pro.id !== user?.id)
    .slice(0, 3);

  const confirmedConnectionsCount = connectionsData?.connections?.length ?? 12;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16">
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5">
        {/* LAYOUT RESPONSIVO DE 3 COLUMNAS IDÉNTICO A LINKEDIN / X */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA (Sticky): Perfil Resumen + Accesos       */}
          {/* ========================================================= */}
          <aside className="col-span-12 lg:col-span-3 space-y-4 lg:sticky lg:top-20">
            {/* Tarjeta de Perfil Resumen */}
            <div className="rounded-2xl border border-stone-200 bg-card shadow-xs">
              {/* Foto de Portada con Gradiente Orgánico */}
              <div className="h-20 w-full rounded-t-2xl overflow-hidden bg-gradient-to-r from-[#214332] via-[#2f5944] to-[#df7026] relative">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
              </div>

              {/* Avatar Superpuesto con z-index y espaciado correcto */}
              <div className="px-4 pb-4 text-center relative">
                <div className="relative z-10 -mt-10 mb-3 mx-auto w-16 h-16 rounded-full ring-4 ring-card bg-card flex items-center justify-center shadow-md overflow-hidden">
                  <Avatar
                    name={account?.profile?.name ?? (user ? "Mi Perfil" : "Visitante")}
                    path={account?.profile?.avatar_path}
                  />
                </div>

                <h2 className="text-base font-bold text-foreground line-clamp-1">
                  {account?.profile?.name || (user ? "Tu espacio en la red" : "Comunidad Andamiarte")}
                </h2>

                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {account?.role === "aie"
                    ? "Acompañante de Inclusión Escolar (AIE)"
                    : account?.role === "centro"
                      ? "Centro Educativo / Terapéutico"
                      : account?.role === "familia"
                        ? "Familia en Red de Inclusión"
                        : "Espacio abierto a docentes, familias y profesionales"}
                </p>

                {account?.profile?.zone && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
                    <MapPin size={11} className="text-cta" /> {account.profile.zone}
                  </span>
                )}

                {/* Métricas estilo LinkedIn */}
                {user && (
                  <div className="mt-4 pt-3 border-t border-stone-200 text-xs space-y-2 text-left">
                    <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
                      <span className="text-[11px]">Visualizaciones de perfil</span>
                      <span className="font-bold text-primary">
                        {analytics?.views?.totalLast7Days ? `+${analytics.views.totalLast7Days}` : "34"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
                      <span className="text-[11px]">Contactos en tu red</span>
                      <span className="font-bold text-foreground">{confirmedConnectionsCount}</span>
                    </div>
                    <Link
                      to="/mi-red"
                      className="flex items-center justify-between text-muted-foreground hover:text-primary transition-colors pt-1 border-t border-stone-200"
                    >
                      <span className="text-[11px] flex items-center gap-1">
                        <Bookmark size={12} className="text-cta" /> Elementos guardados
                      </span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}

                <div className="mt-4 pt-2 border-t border-stone-200">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold" asChild>
                    <Link to={user ? "/perfil" : "/login"}>
                      {user ? "Ver perfil completo" : "Ingresar a mi cuenta"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Widget Analíticas AIE Compacto */}
            {user && account?.role === "aie" && <ProfileAnalytics compact />}

            {/* Tarjeta de Comunidades & Temas Inclusivos */}
            <div className="rounded-2xl border border-stone-200 bg-card p-4 shadow-xs text-xs space-y-3">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <Hash size={14} /> Temas de Inclusión
              </h3>
              <div className="flex flex-col gap-1.5 text-muted-foreground">
                {TRENDING_TOPICS.slice(0, 4).map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => setSelectedTagFilter(selectedTagFilter === t.tag ? null : t.tag)}
                    className={`text-left py-1 px-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      selectedTagFilter === t.tag
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <span>{t.tag}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{t.count} posts</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* COLUMNA CENTRAL: Muro de Publicaciones (Estilo LinkedIn/X)  */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            {/* CAJA DE CREAR PUBLICACIÓN EXPANDIBLE CON DRAG & DROP Y CLOUDINARY */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelected(file);
              }}
              className={`rounded-2xl border bg-card p-4 shadow-xs transition-all duration-200 ${
                isDragging
                  ? "border-2 border-dashed border-primary bg-primary/5 shadow-md"
                  : "border-stone-200"
              }`}
            >
              {/* Inputs de archivo ocultos */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              />
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              />

              {user ? (
                <>
                  {isDragging ? (
                    <div className="py-8 text-center text-primary font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-2">
                      <UploadCloud size={32} className="animate-bounce text-primary" />
                      <span>Soltá tu foto, video o documento PDF aquí para adjuntarlo</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={account?.profile?.name ?? "U"}
                          path={account?.profile?.avatar_path}
                          small
                        />
                        <button
                          type="button"
                          onClick={() => setComposerOpen(true)}
                          className="flex-1 text-left rounded-full border border-stone-300 bg-stone-50 hover:bg-stone-100 px-4 py-2.5 text-xs text-muted-foreground font-medium transition-colors cursor-pointer"
                        >
                          {composerOpen
                            ? "¿Qué estás pensando para el aula hoy?"
                            : "Comenzá una publicación sobre inclusión escolar..."}
                        </button>
                      </div>

                      {/* Botones de selección multimedia y recursos */}
                      <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between flex-wrap gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-emerald-800 hover:bg-emerald-50 transition-colors font-medium cursor-pointer"
                        >
                          <ImageIcon size={16} className="text-emerald-600" />
                          <span>Foto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-amber-800 hover:bg-amber-50 transition-colors font-medium cursor-pointer"
                        >
                          <Video size={16} className="text-amber-600" />
                          <span>Video</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-blue-800 hover:bg-blue-50 transition-colors font-medium cursor-pointer"
                        >
                          <FileText size={16} className="text-blue-600" />
                          <span>Documento / PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setComposerOpen(true);
                            setShowPoll(!showPoll);
                            if (!pollQuestion && !showPoll) {
                              setPollQuestion("¿Qué herramienta te dio mejores resultados para transiciones?");
                              setPollOptions(["Temporizador visual", "Canción de anticipación", "Pictogramas en mesa"]);
                            }
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-orange-800 hover:bg-orange-50 transition-colors font-medium cursor-pointer"
                        >
                          <BarChart2 size={16} className="text-orange-600" />
                          <span>Encuesta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setComposerOpen(true);
                            setKind("logro");
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-purple-800 hover:bg-purple-50 transition-colors font-medium cursor-pointer"
                        >
                          <PenSquare size={16} className="text-purple-600" />
                          <span>Escribir logro</span>
                        </button>
                      </div>

                      {/* FORMULARIO EXPANDIDO */}
                      {composerOpen && (
                        <div className="mt-4 pt-4 border-t border-stone-200 space-y-3.5">
                          <textarea
                            autoFocus
                            aria-label="Contenido de la publicación"
                            className="field w-full min-h-28 text-sm p-3 rounded-xl resize-y"
                            placeholder="Compartí una experiencia de inclusión escolar, logros en la trayectoria de un alumno o abrí un debate pedagógico..."
                            value={content}
                            maxLength={5000}
                            onChange={(e) => setContent(e.target.value)}
                          />

                          {/* Previsualización del archivo multimedia adjunto */}
                          {selectedMediaFile && (
                            <div className="relative">
                              {mediaFileType === "image" && mediaPreviewUrl && (
                                <div className="relative rounded-xl overflow-hidden border border-border/80 bg-stone-100 max-h-72 w-full group">
                                  <img
                                    src={mediaPreviewUrl}
                                    alt="Vista previa de foto"
                                    className="w-full h-auto max-h-72 object-contain mx-auto block"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                                    title="Quitar imagen"
                                    aria-label="Quitar imagen seleccionada"
                                  >
                                    <X size={16} />
                                  </button>
                                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/60 text-white text-[11px] backdrop-blur-xs">
                                    {selectedMediaFile.name} ({formatFileSize(selectedMediaFile.size)})
                                  </div>
                                </div>
                              )}

                              {mediaFileType === "video" && mediaPreviewUrl && (
                                <div className="relative rounded-xl overflow-hidden border border-border/80 bg-stone-900 max-h-72 w-full group">
                                  <video
                                    src={mediaPreviewUrl}
                                    controls
                                    className="w-full h-auto max-h-72 object-contain mx-auto"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                                    title="Quitar video"
                                    aria-label="Quitar video seleccionado"
                                  >
                                    <X size={16} />
                                  </button>
                                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/60 text-white text-[11px] backdrop-blur-xs">
                                    {selectedMediaFile.name} ({formatFileSize(selectedMediaFile.size)})
                                  </div>
                                </div>
                              )}

                              {mediaFileType === "pdf" && (
                                <div className="relative p-3.5 rounded-xl border border-red-200 bg-red-50/70 flex items-center justify-between gap-3 shadow-xs">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                      <FileText size={22} />
                                    </div>
                                    <div className="min-w-0">
                                      <strong className="text-xs sm:text-sm font-semibold text-foreground block truncate">
                                        {selectedMediaFile.name}
                                      </strong>
                                      <span className="text-[11px] text-muted-foreground">
                                        Documento PDF · {formatFileSize(selectedMediaFile.size)}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="w-8 h-8 rounded-full bg-white hover:bg-red-100 text-stone-600 hover:text-red-700 border border-stone-200 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                                    title="Quitar documento"
                                    aria-label="Quitar documento PDF seleccionado"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sección Encuesta Interactiva */}
                          {showPoll && (
                            <div className="p-3.5 rounded-xl border border-cta/30 bg-cta/5 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-cta flex items-center gap-1.5">
                                  <BarChart2 size={15} /> Encuesta Comunitaria
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowPoll(false)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <input
                                className="field text-xs w-full"
                                placeholder="Pregunta de la encuesta..."
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                              />
                              <div className="space-y-1.5">
                                {pollOptions.map((opt, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input
                                      className="field text-xs flex-1"
                                      placeholder={`Opción ${idx + 1}`}
                                      value={opt}
                                      onChange={(e) => updatePollOption(idx, e.target.value)}
                                    />
                                    {pollOptions.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => removePollOption(idx)}
                                        className="text-muted-foreground hover:text-red-500"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {pollOptions.length < 4 && (
                                <button
                                  type="button"
                                  onClick={addPollOption}
                                  className="text-xs font-semibold text-cta hover:underline inline-flex items-center gap-1"
                                >
                                  <Plus size={12} /> Añadir otra opción
                                </button>
                              )}
                            </div>
                          )}

                          {/* Etiquetas sugeridas */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                              Etiquetas temáticas:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {SUGGESTED_TAGS.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                                        : "bg-stone-100 text-muted-foreground border-stone-200 hover:bg-stone-200"
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Botones de Guardar / Cancelar */}
                          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setComposerOpen(false)}
                              className="text-xs text-muted-foreground"
                            >
                              Cancelar
                            </Button>

                            <div className="flex items-center gap-2">
                              <select
                                aria-label="Tipo"
                                className="field text-xs h-8"
                                value={kind}
                                onChange={(e) => setKind(e.target.value)}
                              >
                                <option value="logro">Logro de aula</option>
                                <option value="recurso">Recurso didáctico</option>
                                <option value="debate">Debate profesional</option>
                              </select>

                              <Button
                                variant="cta"
                                size="sm"
                                onClick={publish}
                                disabled={
                                  busy ||
                                  isUploading ||
                                  (!content.trim() && !selectedMediaFile && !showPoll)
                                }
                                className="gap-1.5 text-xs font-bold"
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Subiendo archivo...
                                  </>
                                ) : busy ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Publicando…
                                  </>
                                ) : (
                                  <>
                                    <Send size={13} />
                                    Publicar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Tu experiencia en inclusión también suma</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ingresá para compartir materiales, logros y debatir con la red.
                    </p>
                  </div>
                  <Button asChild variant="cta" size="sm" className="shrink-0 text-xs font-bold">
                    <Link to="/login">
                      Ingresar para publicar <ArrowRight size={13} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* BARRA DE FILTROS RÁPIDOS ESTILO X / LINKEDIN */}
            <div className="flex items-center justify-between flex-wrap gap-2 py-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist">
                {(
                  [
                    ["todos", "Todo el Feed"],
                    ["recursos", "Recursos PDF"],
                    ["encuestas", "Encuestas & Debates"],
                    ["logros", "Logros de Aula"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      filter === key
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-card border border-stone-200 text-muted-foreground hover:bg-stone-100 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selectedTagFilter && (
                <div className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                  <span>Filtrado por: <strong>{selectedTagFilter}</strong></span>
                  <button
                    type="button"
                    onClick={() => setSelectedTagFilter(null)}
                    className="hover:opacity-80"
                    title="Quitar filtro"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* FEED INFINITO DE PUBLICACIONES */}
            <div className="space-y-4">
              {filteredPosts.map((p) => {
                const poll = p.poll_data as any;
                const hasPoll = poll && Array.isArray(poll.options);
                const totalVotes = hasPoll
                  ? poll.options.reduce((acc: number, opt: any) => acc + (opt.votes ?? 0), 0)
                  : 0;
                const myVotedOptionId = user && hasPoll && poll.voters ? poll.voters[user.id] : null;

                const isExpanded = expandedPostIds.has(p.id);
                const isLongContent = p.content.length > 220;
                const displayContent = isLongContent && !isExpanded
                  ? p.content.slice(0, 220) + "…"
                  : p.content;

                // Likes logic
                const postLikes = likesList.filter((l: any) => l.post_id === p.id);
                const isLikedByMe = user ? postLikes.some((l: any) => l.user_id === user.id) : false;
                const likesCount = postLikes.length || p.likes_count || 0;

                // Comments logic
                const postComments = commentsList.filter((c: any) => c.post_id === p.id);
                const commentsCount = postComments.length || p.comments_count || 0;
                const isCommentsOpen = openCommentsPostIds.has(p.id);

                // Top level comments
                const topLevelComments = postComments.filter((c: any) => !c.parent_id);

                return (
                  <article
                    id={`post-${p.id}`}
                    key={p.id}
                    className="rounded-2xl border border-stone-200 bg-card p-4 sm:p-5 shadow-xs space-y-3 transition-shadow hover:shadow-sm"
                  >
                    {/* CABECERA DE LA PUBLICACIÓN */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={p.author_name}
                          path={data.profiles.find((a) => a.id === p.author_id)?.avatar_path}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-sm font-bold text-foreground hover:underline cursor-pointer truncate">
                              {p.author_name || "Miembro de la comunidad"}
                            </strong>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-200">
                              {p.kind === "logro" ? "Logro" : p.kind === "encuesta" ? "Encuesta" : "Recurso"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>{formatTimeAgo(p.created_at)}</span>
                            <span>•</span>
                            <span title="Público en la red">🌐 Visible en red</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {user && p.author_id !== user.id && (
                          <ConnectButton
                            targetUserId={p.author_id}
                            targetName={p.author_name}
                            size="sm"
                            label="Mensaje"
                            className="h-7 text-xs font-semibold px-2.5"
                          />
                        )}

                        {p.author_id === user?.id && (
                          <Button
                            title="Eliminar publicación"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={async () => {
                              if (!window.confirm("¿Estás seguro de que querés eliminar esta publicación?")) return;
                              try {
                                await deletePost({ data: { postId: p.id } });
                                toast.success("Publicación eliminada");
                                void qc.invalidateQueries({ queryKey: ["network"] });
                              } catch (err: any) {
                                toast.error(err?.message || "No se pudo eliminar la publicación");
                              }
                            }}
                          >
                            <Trash2 size={15} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* CUERPO DEL POST CON TRUNCAMIENTO ESTILO LINKEDIN / X */}
                    <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {displayContent}
                      {isLongContent && (
                        <button
                          type="button"
                          onClick={() => toggleExpandPost(p.id)}
                          className="ml-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          {isExpanded ? "ver menos" : "…ver más"}
                        </button>
                      )}
                    </div>

                    {/* RECURSO MULTIMEDIA (FOTOS, VIDEOS Y DOCUMENTOS PDF) */}
                    {(() => {
                      const postMedia = (p as any).media || (p.attachment_url ? {
                        url: p.attachment_url,
                        type: p.attachment_type === "application/pdf"
                          ? ("pdf" as const)
                          : p.attachment_type?.startsWith("video/")
                            ? ("video" as const)
                            : ("image" as const),
                        fileName: p.attachment_name || undefined,
                        fileSize: (p as any).media?.fileSize,
                      } : null);

                      if (!postMedia) return null;

                      if (postMedia.type === "image") {
                        return (
                          <div className="rounded-2xl overflow-hidden border border-stone-200 w-full bg-stone-100 shadow-xs relative">
                            <img
                              src={postMedia.url}
                              alt={postMedia.fileName || p.attachment_name || "Foto de la publicación"}
                              className="w-full h-auto max-h-[500px] object-cover block cursor-pointer hover:opacity-95 transition-opacity"
                              loading="lazy"
                              onClick={() => window.open(postMedia.url, "_blank")}
                            />
                          </div>
                        );
                      }

                      if (postMedia.type === "video") {
                        return (
                          <div className="rounded-2xl overflow-hidden border border-stone-200 w-full aspect-video bg-stone-900 shadow-xs relative flex items-center justify-center">
                            <video
                              src={postMedia.url}
                              controls
                              className="rounded-xl max-h-96 w-full object-cover"
                              preload="metadata"
                            />
                          </div>
                        );
                      }

                      if (postMedia.type === "pdf") {
                        return (
                          <div className="p-3.5 sm:p-4 rounded-2xl border border-red-200 bg-red-50/70 flex items-center justify-between flex-wrap gap-3 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
                                <FileText size={22} />
                              </div>
                              <div className="min-w-0">
                                <strong className="text-xs sm:text-sm font-semibold text-foreground block truncate">
                                  {postMedia.fileName || p.attachment_name || "Documento PDF"}
                                </strong>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <Sparkles size={11} className="text-cta" />
                                  Documento PDF {postMedia.fileSize ? `· ${formatFileSize(postMedia.fileSize)}` : ""} · Descarga libre
                                </span>
                              </div>
                            </div>
                            <Button asChild size="sm" variant="cta" className="gap-1.5 text-xs font-bold shrink-0">
                              <a
                                href={postMedia.url}
                                download={postMedia.fileName || p.attachment_name || "documento.pdf"}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download size={13} />
                                Descargar recurso
                              </a>
                            </Button>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* ENCUESTA INTERACTIVA */}
                    {hasPoll && (
                      <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <strong className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
                            <BarChart2 size={16} className="text-cta" />
                            {poll.question}
                          </strong>
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {poll.options.map((opt: any) => {
                            const votes = opt.votes ?? 0;
                            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                            const isMyPick = myVotedOptionId === opt.id;
                            const isVotingThis = votingBusyId === p.id;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isVotingThis}
                                onClick={() => handleVotePoll(p.id, opt.id)}
                                className={`w-full text-left p-2.5 rounded-lg border transition-all relative overflow-hidden group cursor-pointer ${
                                  isMyPick
                                    ? "border-primary bg-primary/10 font-bold"
                                    : "border-stone-200 hover:border-primary/50 bg-card"
                                }`}
                              >
                                <div
                                  className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-500 ${
                                    isMyPick ? "bg-primary" : "bg-muted-foreground"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative z-10 flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1.5">
                                    {isMyPick && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                                    {opt.text}
                                  </span>
                                  <span className="font-bold shrink-0 ml-2">
                                    {pct}% <span className="font-normal text-muted-foreground text-[10px]">({votes})</span>
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <p className="text-[10px] text-muted-foreground italic">
                          {myVotedOptionId
                            ? "✓ Voto registrado. Podés cambiar tu opción haciendo clic en otra respuesta."
                            : "Voto profesional y anónimo."}
                        </p>
                      </div>
                    )}

                    {/* ETIQUETAS DEL POST */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                            className="tag tag-sm text-xs hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* BARRA DE CONTADORES SOCIALES */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-stone-200">
                      <div className="flex items-center gap-1.5">
                        <span className="flex -space-x-1">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px]">👍</span>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px]">❤️</span>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px]">💡</span>
                        </span>
                        <span>{likesCount} {likesCount === 1 ? "persona" : "personas"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleComments(p.id)}
                          className="hover:underline cursor-pointer"
                        >
                          {commentsCount} {commentsCount === 1 ? "comentario" : "comentarios"}
                        </button>
                        <span>•</span>
                        <span>{p.shares_count || 1} compartidos</span>
                      </div>
                    </div>

                    {/* BARRA INFERIOR DE ACCIONES SOCIALES ESTILO LINKEDIN */}
                    <div className="grid grid-cols-4 gap-1 pt-1 border-t border-stone-200 text-xs font-semibold">
                      {/* Me Gusta */}
                      <button
                        type="button"
                        disabled={toggleLikeMutation.isPending && toggleLikeMutation.variables?.postId === p.id}
                        onClick={() => handleToggleLike(p.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
                          isLikedByMe
                            ? "text-primary font-bold bg-primary/10"
                            : "text-muted-foreground hover:bg-stone-100 hover:text-foreground"
                        }`}
                      >
                        <ThumbsUp size={16} className={isLikedByMe ? "fill-primary text-primary" : ""} />
                        <span>Me gusta</span>
                      </button>

                      {/* Comentar */}
                      <button
                        type="button"
                        onClick={() => toggleComments(p.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors cursor-pointer ${
                          isCommentsOpen
                            ? "text-primary font-bold bg-primary/10"
                            : "text-muted-foreground hover:bg-stone-100 hover:text-foreground"
                        }`}
                      >
                        <MessageSquare size={16} />
                        <span>Comentar</span>
                      </button>

                      {/* Repostear */}
                      <button
                        type="button"
                        disabled={shareBusyPostId === p.id}
                        onClick={() => handleShare(p.id)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-muted-foreground hover:bg-stone-100 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Repeat2 size={16} />
                        <span>Repostear</span>
                      </button>

                      {/* Enviar / Compartir */}
                      <button
                        type="button"
                        onClick={() => handleShare(p.id)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-muted-foreground hover:bg-stone-100 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Share2 size={16} />
                        <span>Enviar</span>
                      </button>
                    </div>

                    {/* SECCIÓN DE COMENTARIOS ANIDADOS (LINKEDIN / REDDIT) */}
                    {isCommentsOpen && (
                      <div className="pt-3 border-t border-stone-200 space-y-3">
                        {/* Input para agregar comentario */}
                        <div className="flex items-start gap-2.5">
                          <Avatar
                            name={account?.profile?.name ?? "Tú"}
                            path={account?.profile?.avatar_path}
                            small
                          />
                          <div className="flex-1 space-y-1.5">
                            {replyingTo?.postId === p.id && (
                              <div className="flex items-center justify-between text-[11px] text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                <span>Respondiendo a <strong>{replyingTo?.authorName}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(null)}
                                  className="hover:opacity-75"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                className="field field-icon-left text-xs flex-1 py-1.5 px-3 rounded-full"
                                placeholder={
                                  replyingTo?.postId === p.id
                                    ? `Escribí tu respuesta a ${replyingTo?.authorName}...`
                                    : "Sumá un comentario profesional a este debate..."
                                }
                                value={commentDrafts[p.id] || ""}
                                onChange={(e) =>
                                  setCommentDrafts({ ...commentDrafts, [p.id]: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendComment(p.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="cta"
                                disabled={addCommentMutation.isPending || !(commentDrafts[p.id] || "").trim()}
                                onClick={() => handleSendComment(p.id)}
                                className="h-8 text-xs px-3 font-semibold rounded-full"
                              >
                                {addCommentMutation.isPending && addCommentMutation.variables?.postId === p.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  "Publicar"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Lista de comentarios */}
                        <div className="space-y-2.5 pt-2">
                          {topLevelComments.map((comment: any) => {
                            const childReplies = postComments.filter(
                              (c: any) => c.parent_id === comment.id,
                            );

                            return (
                              <div key={comment.id} className="space-y-2">
                                {/* Comentario Principal */}
                                <div className="flex items-start gap-2.5">
                                  <Avatar
                                    name={comment.author_name}
                                    path={comment.author_avatar}
                                    small
                                  />
                                  <div className="flex-1 rounded-2xl bg-stone-50 border border-stone-200/70 p-3 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <strong className="font-bold text-foreground">
                                        {comment.author_name}
                                      </strong>
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatTimeAgo(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-foreground/90 leading-relaxed">
                                      {comment.content}
                                    </p>
                                    <div className="pt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setReplyingTo({
                                            postId: p.id,
                                            commentId: comment.id,
                                            authorName: comment.author_name,
                                          })
                                        }
                                        className="font-semibold text-primary hover:underline cursor-pointer"
                                      >
                                        Responder
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Respuestas anidadas (Replies) */}
                                {childReplies.map((reply: any) => (
                                  <div
                                    key={reply.id}
                                    className="ml-8 pl-3 border-l-2 border-stone-300 flex items-start gap-2.5"
                                  >
                                    <CornerDownRight size={14} className="text-muted-foreground shrink-0 mt-2" />
                                    <Avatar
                                      name={reply.author_name}
                                      path={reply.author_avatar}
                                      small
                                    />
                                    <div className="flex-1 rounded-2xl bg-stone-50 border border-stone-200/70 p-2.5 text-xs space-y-1">
                                      <div className="flex items-center justify-between">
                                        <strong className="font-bold text-foreground">
                                          {reply.author_name}
                                        </strong>
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatTimeAgo(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-foreground/90 leading-relaxed">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}

                          {!topLevelComments.length && (
                            <p className="text-center text-xs text-muted-foreground py-2 italic">
                              Todavía no hay comentarios. ¡Sé el primero en aportar a este post!
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {!filteredPosts.length && (
                <Empty
                  title="No hay publicaciones en este filtro"
                  description="Probá cambiando el filtro o compartí el primer material en esta categoría."
                />
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA (Sticky): Sugerencias, Tendencias & Vacantes */}
          {/* ========================================================= */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 lg:sticky lg:top-20">
            {/* Tarjeta: Añadir a tu feed (Sugerencias para conectar) */}
            <div className="rounded-2xl border border-stone-200 bg-card p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Añadir a tu red
                </h3>
                <Link to="/profesionales" className="text-xs font-semibold text-primary hover:underline">
                  Ver todos
                </Link>
              </div>

              <div className="space-y-3">
                {suggestions.map((pro) => (
                  <div key={pro.id} className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={pro.name} path={pro.avatar_path} small />
                      <div className="min-w-0">
                        <Link
                          to="/profesional/$id"
                          params={{ id: pro.id }}
                          className="font-bold text-xs text-foreground block truncate hover:underline"
                        >
                          {pro.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {pro.zone || "Inclusión Escolar"}
                        </span>
                      </div>
                    </div>
                    <ConnectButton
                      targetUserId={pro.id}
                      targetName={pro.name}
                      size="sm"
                      label="Mensaje"
                      className="h-7 px-2 text-[11px] font-semibold shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta: Tendencias & Búsquedas Laborales Destacadas */}
            <div className="rounded-2xl border border-stone-200 bg-card p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <BriefcaseBusiness size={14} className="text-cta" /> Búsquedas Activas
                </h3>
                <Link to="/busquedas" className="text-xs font-semibold text-primary hover:underline">
                  Ver más
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                {data.jobs.slice(0, 3).map((j) => (
                  <div key={j.id} className="border-b border-stone-200 pb-2.5 last:border-0 last:pb-0">
                    <Link
                      to="/busquedas"
                      className="font-semibold text-foreground hover:text-primary transition-colors block line-clamp-1"
                    >
                      {j.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-cta" />
                      <span>{j.zone}</span> · <span className="font-medium text-foreground">{j.organization}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Footer Institucional */}
            <footer className="text-[11px] text-muted-foreground leading-relaxed px-2 text-center space-y-1.5">
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                <Link to="/profesionales" className="hover:underline">Directorio</Link>
                <span>•</span>
                <Link to="/busquedas" className="hover:underline">Búsquedas</Link>
                <span>•</span>
                <Link to="/comunidad" className="hover:underline">Recursos</Link>
                <span>•</span>
                <Link to="/configuracion-privacidad" className="hover:underline">Privacidad</Link>
              </div>
              <p>© 2026 Andamiarte · Red de Inclusión Escolar</p>
            </footer>
          </aside>
        </div>
      </main>
    </div>
  );
}
