import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Stage } from "./application-status";
import { calculateAtsFunnel, aggregateViewsBreakdown, aggregateTopTags, formatTimeAgo } from "./analytics";
import { getDb, initMongoIndexes } from "./mongodb";
import { createMongoServerClient } from "./mongo-server-adapter";

const SEED_RICH_POSTS = [
  {
    id: "seed-post-pdf-1",
    author_id: "e44f8394-be2c-4cfe-a08c-35500f26a396",
    author_name: "Lic. Sofía Albarracín",
    content:
      "Les comparto este material que armé para facilitar la anticipación de la jornada escolar y el pasaje entre materias en primer ciclo. Incluye secuencias de inicio, recreo y despedida listas para imprimir y plastificar.",
    kind: "recurso",
    attachment_url: "/docs/guia-anticipacion-visual-pictogramas.pdf",
    attachment_name: "Guía práctica de anticipación visual y pictogramas para Nivel Primario.pdf",
    attachment_type: "application/pdf",
    poll_data: null,
    tags: ["#RecursoPedagógico", "#Pictogramas", "#InclusiónÁulica"],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "seed-post-poll-1",
    author_id: "82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b",
    author_name: "Thiago Rivas",
    content:
      "Abrimos debate para acompañantes y docentes de primer ciclo: ¿qué estrategia les ha dado mejores resultados para anticipar los cambios de actividad sin generar ansiedad en el aula?",
    kind: "encuesta",
    attachment_url: null,
    attachment_name: null,
    attachment_type: null,
    poll_data: {
      question: "¿Qué herramienta les resulta más efectiva para la transición entre actividades en primer ciclo?",
      options: [
        { id: "opt-1", text: "Reloj de arena / Temporizador visual", votes: 14 },
        { id: "opt-2", text: "Canción o rima de transición", votes: 9 },
        { id: "opt-3", text: "Pictograma paso a paso", votes: 22 },
      ],
      voters: {},
    },
    tags: ["#Debate", "#EstrategiasAula", "#InclusiónÁulica"],
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    likes_count: 8,
    comments_count: 2,
    shares_count: 1,
  },
];

const SEED_COMMENTS = [
  {
    id: "seed-comm-1",
    post_id: "seed-post-pdf-1",
    author_id: "e44f8394-be2c-4cfe-a08c-35500f26a396",
    author_name: "Familia Gómez",
    author_role: "familia",
    author_avatar: null as string | null,
    content: "¡Excelente material Sofi! Lo imprimimos esta semana para Joaquín y le dio mucha tranquilidad saber qué viene después del timbre del recreo.",
    parent_id: null as string | null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "seed-comm-2",
    post_id: "seed-post-pdf-1",
    author_id: "e44f8394-be2c-4cfe-a08c-35500f26a396",
    author_name: "Lic. Sofía Albarracín",
    author_role: "aie",
    author_avatar: null as string | null,
    content: "¡Qué alegría enorme leer esto! La anticipación en el patio y en los pasajes áulicos es clave para regular la sobreestimulación sensorial.",
    parent_id: "seed-comm-1" as string | null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "seed-comm-3",
    post_id: "seed-post-poll-1",
    author_id: "82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b",
    author_name: "Instituto Horizonte",
    author_role: "centro",
    author_avatar: null as string | null,
    content: "En nuestra institución combinamos el temporizador visual con canciones suaves. Ayuda a que todo el grupo baje un cambio antes de pasar a la siguiente tarea.",
    parent_id: null as string | null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const SEED_LIKES = [
  { post_id: "seed-post-pdf-1", user_id: "82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b", reaction_type: "celebrate" },
  { post_id: "seed-post-pdf-1", user_id: "e44f8394-be2c-4cfe-a08c-35500f26a396", reaction_type: "like" },
  { post_id: "seed-post-poll-1", user_id: "82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b", reaction_type: "insightful" },
  { post_id: "seed-post-poll-1", user_id: "e44f8394-be2c-4cfe-a08c-35500f26a396", reaction_type: "like" },
];

const SEED_JOBS = [
  {
    id: "seed-job-1",
    author_id: "inst-1",
    author_role: "centro",
    title: "Acompañante de Integración Escolar (AIE) - Nivel Primario",
    school_name: "Colegio San Martín de Tours",
    zone: "CABA - Belgrano",
    schedule: "Turno Tarde (13:00 a 17:00 hs)",
    shift: "tarde",
    description: "Buscamos AIE con experiencia en adaptaciones curriculares y comunicación aumentativa para acompañar alumno en 2do grado.",
    requirements: "Título habilitante o estudiante avanzado de Psicopedagogía / Educación Especial.",
    active: true,
    tags: ["Primaria", "Pictogramas", "Belgrano"],
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: "seed-job-2",
    author_id: "fam-1",
    author_role: "familia",
    title: "Acompañamiento Terapéutico Escolar - Nivel Inicial",
    school_name: "Jardín de Infantes Los Pinos",
    zone: "Zona Norte - San Isidro",
    schedule: "Turno Mañana (08:30 a 12:30 hs)",
    shift: "mañana",
    description: "Familia busca acompañante para sala de 4. Se valorará calidez humana y trabajo coordinado con equipo externo.",
    requirements: "Experiencia en TEA y manejo de berrinches o desregulación sensorial.",
    active: true,
    tags: ["Inicial", "TEA", "San Isidro"],
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
];

const SEED_PROFILES = [
  {
    id: "82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b",
    name: "Thiago Rivas",
    role: "aie",
    title: "Acompañante de Integración Escolar (AIE)",
    zone: "CABA - Caballito",
    bio: "Especialista en inclusión áulica, adaptaciones curriculares y comunicación aumentativa-alternativa.",
    skills: ["Pictogramas", "Adaptaciones pedagógicas", "Inclusión áulica", "TEA"],
    available: true,
    verified: true,
    public_profile: true,
    avatar_path: null,
    cv_path: null,
    years_experience: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "e44f8394-be2c-4cfe-a08c-35500f26a396",
    name: "Lic. Sofía Albarracín",
    role: "aie",
    title: "Lic. en Psicopedagogía & AIE",
    zone: "CABA - Palermo",
    bio: "Acompañamiento en nivel primario y secundario. Enfoque cognitivo-conductual y diseño universal de aprendizaje (DUA).",
    skills: ["DUA", "Psicopedagogía", "Primer Ciclo", "TDAH"],
    available: true,
    verified: true,
    public_profile: true,
    avatar_path: null,
    cv_path: null,
    years_experience: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const getPublicNetwork = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await initMongoIndexes();
    const db = await getDb();
    const [jobsDocs, postsDocs, profilesDocs, likesDocs, commentsDocs] = await Promise.all([
      db.collection<any>("jobs").find({ active: true }).sort({ created_at: -1 }).toArray(),
      db.collection<any>("posts").find({}).sort({ created_at: -1 }).toArray(),
      db.collection<any>("profiles").find({ public_profile: true }).toArray(),
      db.collection<any>("post_likes").find({}).toArray(),
      db.collection<any>("post_comments").find({}).sort({ created_at: 1 }).toArray(),
    ]);

    const rawPosts = postsDocs.map((p) => ({ ...p, id: p.id || String(p._id) }));
    const mergedPosts = [...rawPosts];
    for (const seed of SEED_RICH_POSTS) {
      if (
        !mergedPosts.some(
          (p) =>
            p.id === seed.id ||
            (seed.attachment_name && p.attachment_name === seed.attachment_name) ||
            (p.kind === "encuesta" && seed.kind === "encuesta")
        )
      ) {
        mergedPosts.push(seed as any);
      }
    }

    const rawLikes = likesDocs.map((l) => ({ ...l, id: l.id || String(l._id) }));
    const mergedLikes = [...rawLikes];
    for (const sl of SEED_LIKES) {
      if (!mergedLikes.some((l) => l.post_id === sl.post_id && l.user_id === sl.user_id)) {
        mergedLikes.push(sl);
      }
    }

    const rawComments = commentsDocs.map((c) => ({ ...c, id: c.id || String(c._id) }));
    const mergedComments = [...rawComments];
    for (const sc of SEED_COMMENTS) {
      if (!mergedComments.some((c) => c.id === sc.id)) {
        mergedComments.push(sc);
      }
    }

    for (const p of mergedPosts) {
      const postLikes = mergedLikes.filter((l) => l.post_id === p.id);
      const postComms = mergedComments.filter((c) => c.post_id === p.id);
      p.likes_count = postLikes.length || p.likes_count || 0;
      p.comments_count = postComms.length || p.comments_count || 0;
    }

    mergedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const profiles = profilesDocs.length ? profilesDocs.map((p) => ({ ...p, id: p.id || String(p._id) })) : SEED_PROFILES;
    const professionals = profiles.filter((p: any) => p.role === "aie");

    return {
      jobs: (jobsDocs.length ? jobsDocs : SEED_JOBS).map((j) => ({ ...j, id: j.id || String(j._id) })) as unknown as Database["public"]["Tables"]["jobs"]["Row"][],
      posts: mergedPosts as unknown as Database["public"]["Tables"]["posts"]["Row"][],
      profiles: profiles as unknown as Database["public"]["Tables"]["profiles"]["Row"][],
      professionals: professionals as unknown as Database["public"]["Functions"]["list_professionals"]["Returns"],
      likes: mergedLikes as unknown as Database["public"]["Tables"]["post_likes"]["Row"][],
      comments: mergedComments as unknown as Database["public"]["Tables"]["post_comments"]["Row"][],
    };
  } catch (err: any) {
    console.warn("[MongoDB Atlas] Base de datos no accesible temporalmente (IP no autorizada o sin conexión). Usando datos en memoria:", err?.message || err);
    return {
      jobs: SEED_JOBS as unknown as Database["public"]["Tables"]["jobs"]["Row"][],
      posts: SEED_RICH_POSTS as unknown as Database["public"]["Tables"]["posts"]["Row"][],
      profiles: SEED_PROFILES as unknown as Database["public"]["Tables"]["profiles"]["Row"][],
      professionals: SEED_PROFILES.filter((p) => p.role === "aie") as unknown as Database["public"]["Functions"]["list_professionals"]["Returns"],
      likes: SEED_LIKES as unknown as Database["public"]["Tables"]["post_likes"]["Row"][],
      comments: SEED_COMMENTS as unknown as Database["public"]["Tables"]["post_comments"]["Row"][],
    };
  }
});
const THIAGO_RIVAS_ID = "82f99bd4-0d83-41d4-b213-d7bc5a0c0e3b";

const THIAGO_FALLBACK_RECOMMENDATIONS = [
  {
    id: "seed-rec-familia-gomez",
    professional_id: THIAGO_RIVAS_ID,
    author_id: "e44f8394-be2c-4cfe-a08c-35500f26a396",
    author_name: "Familia Gómez",
    author_role: "familia",
    relationship_context: "Acompañó a nuestro hijo en 1° y 2° grado (2024–2025)",
    content:
      "Thiago demostró un compromiso y calidez excepcionales. Las adaptaciones pedagógicas y los pictogramas que diseñó marcaron una diferencia enorme en la integración escolar y en la alegría de nuestro hijo por ir al colegio cada mañana.",
    highlighted_skills: ["Pictogramas", "Adaptaciones pedagógicas"],
    status: "published",
    created_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
  },
  {
    id: "seed-rec-instituto-horizonte",
    professional_id: THIAGO_RIVAS_ID,
    author_id: "e44f8394-be2c-4cfe-a08c-35500f26a396",
    author_name: "Instituto Horizonte",
    author_role: "centro",
    relationship_context: "Equipo de Integración Escolar (2023–2025)",
    content:
      "Excelente profesional, proactivo y con gran solvencia técnica en comunicación aumentativa y adaptaciones curriculares en el aula.",
    highlighted_skills: ["Comunicación aumentativa", "Adaptaciones pedagógicas"],
    status: "published",
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
  },
];

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [p, r, n, e, rv, recs] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).single(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId).single(),
      context.supabase
        .from("family_needs")
        .select("*")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase.from("skill_endorsements").select("skill").eq("profile_id", context.userId),
      context.supabase
        .from("family_reviews")
        .select("id, author_name, content, created_at")
        .eq("profile_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("recommendations")
        .select("*")
        .eq("professional_id", context.userId)
        .order("created_at", { ascending: false }),
    ]);
    if (p.error || r.error) throw new Error(p.error?.message ?? r.error?.message);
    const endorsements: Record<string, number> = {};
    for (const row of e.data ?? []) endorsements[row.skill] = (endorsements[row.skill] ?? 0) + 1;
    let recommendations = recs.data ?? [];
    if (context.userId === THIAGO_RIVAS_ID) {
      endorsements["Pictogramas"] = Math.max(endorsements["Pictogramas"] ?? 0, 3);
      endorsements["Adaptaciones pedagógicas"] = Math.max(endorsements["Adaptaciones pedagógicas"] ?? 0, 4);
      endorsements["Comunicación aumentativa"] = Math.max(endorsements["Comunicación aumentativa"] ?? 0, 2);
      if (!recommendations.length) {
        recommendations = [...THIAGO_FALLBACK_RECOMMENDATIONS];
      }
    }
    return {
      profile: p.data,
      role: r.data?.role,
      needs: n.data?.needs ?? "",
      family: n.data ?? null,
      endorsements,
      reviews: rv.data ?? [],
      recommendations,
    };
  });
export const getMyMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await context.supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${context.userId},recipient_id.eq.${context.userId}`)
      .order("created_at");
    if (result.error) throw new Error(result.error.message);
    return result.data ?? [];
  });
export const getMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getDb();
    const apps = await db
      .collection<any>("applications")
      .find({ user_id: context.userId })
      .sort({ created_at: -1 })
      .toArray();
    return apps.map((a) => ({
      ...a,
      id: a.id || String(a._id),
    })) as Database["public"]["Tables"]["applications"]["Row"][];
  });
export const getProfessionalCv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ context, data }) => {
    const [p, r, e, rv, recs] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId).single(),
      context.supabase.from("skill_endorsements").select("skill, endorser_id").eq("profile_id", data.id),
      context.supabase
        .from("family_reviews")
        .select("id, author_id, author_name, content, created_at")
        .eq("profile_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("recommendations")
        .select("*")
        .eq("professional_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (p.error) throw new Error(p.error.message);
    const endorsements: Record<string, number> = {};
    const mine: string[] = [];
    for (const row of e.data ?? []) {
      endorsements[row.skill] = (endorsements[row.skill] ?? 0) + 1;
      if (row.endorser_id === context.userId) mine.push(row.skill);
    }
    let recommendations = recs.data ?? [];
    if (data.id === THIAGO_RIVAS_ID) {
      endorsements["Pictogramas"] = Math.max(endorsements["Pictogramas"] ?? 0, 3);
      endorsements["Adaptaciones pedagógicas"] = Math.max(endorsements["Adaptaciones pedagógicas"] ?? 0, 4);
      endorsements["Comunicación aumentativa"] = Math.max(endorsements["Comunicación aumentativa"] ?? 0, 2);
      if (!recommendations.length) {
        recommendations = [...THIAGO_FALLBACK_RECOMMENDATIONS];
      }
    }
    return {
      profile: p.data,
      myRole: r.data?.role,
      myId: context.userId,
      endorsements,
      mine,
      reviews: rv.data ?? [],
      recommendations,
    };
  });
export const getMyApplicationsDetailed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getDb();
    const apps = await db
      .collection<any>("applications")
      .find({ user_id: context.userId })
      .sort({ created_at: -1 })
      .toArray();

    if (!apps.length) return [];

    const jobIds = apps.map((a) => a.job_id).filter(Boolean);
    const jobs = jobIds.length
      ? await db
          .collection<any>("jobs")
          .find({ $or: [{ id: { $in: jobIds } }, { _id: { $in: jobIds } }] })
          .toArray()
      : [];

    const jobMap = new Map(jobs.map((j) => [j.id || String(j._id), j]));

    return apps.map((a) => {
      const j = jobMap.get(a.job_id);
      return {
        id: a.id || String(a._id),
        job_id: a.job_id,
        user_id: a.user_id,
        stage: (a.stage || "nuevo") as Stage,
        seen_at: a.seen_at || null,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.updated_at || a.created_at || new Date().toISOString(),
        jobs: j
          ? {
              id: j.id || String(j._id),
              title: j.title || "Búsqueda",
              organization: j.organization || "Institución",
              zone: j.zone || "",
              schedule: j.schedule || "",
              patient_context: j.patient_context || null,
            }
          : null,
      };
    });
  });

export const getCandidateBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getDb();

    // Validar rol de usuario (solo familias y centros)
    const roleDoc = await db.collection<any>("user_roles").findOne({ user_id: context.userId });
    const role = roleDoc?.role || "aie";
    if (role === "aie") {
      return { jobs: [], applications: [], endorsements: {}, reviews: [] };
    }

    const jobsDocs = await db
      .collection<any>("jobs")
      .find({ owner_id: context.userId })
      .sort({ created_at: -1 })
      .toArray();

    const jobs = jobsDocs.map((j) => ({
      id: j.id || String(j._id),
      title: j.title || "Búsqueda",
      organization: j.organization || "Institución",
      active: typeof j.active === "boolean" ? j.active : true,
    }));

    if (!jobs.length) {
      return { jobs: [], applications: [], endorsements: {}, reviews: [] };
    }

    const ids = jobs.map((j) => j.id);

    const appsDocs = await db
      .collection<any>("applications")
      .find({ job_id: { $in: ids } })
      .sort({ created_at: -1 })
      .toArray();

    const people = [...new Set(appsDocs.map((a) => a.user_id).filter(Boolean))];

    const profilesDocs = people.length
      ? await db
          .collection<any>("profiles")
          .find({ $or: [{ id: { $in: people } }, { _id: { $in: people } }] })
          .toArray()
      : [];

    const profileMap = new Map(
      profilesDocs.map((p) => [
        p.id || String(p._id),
        {
          ...p,
          id: p.id || String(p._id),
          skills: Array.isArray(p.skills) ? p.skills : [],
          education: Array.isArray(p.education) ? p.education : [],
          experience: Array.isArray(p.experience) ? p.experience : [],
          available: typeof p.available === "boolean" ? p.available : true,
          public_profile: typeof p.public_profile === "boolean" ? p.public_profile : true,
        },
      ])
    );

    const applications = appsDocs.map((a) => ({
      id: a.id || String(a._id),
      job_id: a.job_id,
      user_id: a.user_id,
      stage: (a.stage || "nuevo") as Stage,
      seen_at: a.seen_at || null,
      created_at: a.created_at || new Date().toISOString(),
      updated_at: a.updated_at || a.created_at || new Date().toISOString(),
      profiles: profileMap.get(a.user_id) || null,
    }));

    const [e, rv] = people.length
      ? await Promise.all([
          db.collection<any>("skill_endorsements").find({ profile_id: { $in: people } }).toArray(),
          db.collection<any>("family_reviews").find({ profile_id: { $in: people } }).toArray(),
        ])
      : [[], []];

    const endorsements: Record<string, Record<string, number>> = {};
    for (const row of e) {
      const m = (endorsements[row.profile_id] ??= {});
      m[row.skill] = (m[row.skill] ?? 0) + 1;
    }

    const reviews = rv.map((r) => ({
      id: r.id || String(r._id),
      profile_id: r.profile_id,
      author_name: r.author_name || "Familia",
      content: r.content || "",
    }));

    return { jobs, applications, endorsements, reviews };
  });
export const getMySaved = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await context.supabase
      .from("saved_profiles")
      .select("created_at, profile:profiles!saved_profiles_profile_id_fkey(*)")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (r.error) throw new Error(r.error.message);
    return (r.data ?? []).flatMap((row: any) => (row.profile ? [{ saved_at: row.created_at, ...row.profile }] : []));
  });
export const getMyAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await context.supabase.from("job_alerts").select("zones, levels, tools").eq("user_id", context.userId).maybeSingle();
    if (r.error) throw new Error(r.error.message);
    return r.data ?? { zones: [], levels: [], tools: [] };
  });
export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await context.supabase
      .from("notifications")
      .select("id, title, body, job_id, link, read_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (r.error) throw new Error(r.error.message);
    return r.data ?? [];
  });

export type ConnectionPartner = {
  id: string;
  name: string;
  avatar_path: string | null;
  zone?: string;
  verified?: boolean;
  skills?: string[];
  available?: boolean;
  role: string;
};

export type ConnectionWithPartner = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  partner: ConnectionPartner;
};

export const getMyConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getDb();

    // Consultar en MongoDB los mensajes históricos del usuario para obtener sus chats abiertos
    const userMessages = await db
      .collection<any>("messages")
      .find({
        $or: [{ sender_id: context.userId }, { recipient_id: context.userId }],
      })
      .sort({ created_at: -1 })
      .toArray();

    const partnerIdsSet = new Set<string>();
    const lastMessageMap = new Map<string, { content: string; created_at: string }>();

    for (const m of userMessages) {
      const otherId = m.sender_id === context.userId ? m.recipient_id : m.sender_id;
      if (otherId && otherId !== context.userId) {
        partnerIdsSet.add(otherId);
        if (!lastMessageMap.has(otherId)) {
          lastMessageMap.set(otherId, {
            content: m.content || "",
            created_at: m.created_at || new Date().toISOString(),
          });
        }
      }
    }

    // Seed de ejemplo para Thiago Rivas si no tiene aún chats abiertos
    if (context.userId === THIAGO_RIVAS_ID && partnerIdsSet.size === 0) {
      partnerIdsSet.add("e44f8394-be2c-4cfe-a08c-35500f26a396");
      lastMessageMap.set("e44f8394-be2c-4cfe-a08c-35500f26a396", {
        content:
          "Hola Thiago, estuve viendo tus recursos de pictogramas y me parecieron excelentes para trabajar en aula.",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      });
    }

    const partnerIds = Array.from(partnerIdsSet);

    const [profilesDocs, rolesDocs] = partnerIds.length
      ? await Promise.all([
          db
            .collection<any>("profiles")
            .find({ $or: [{ id: { $in: partnerIds } }, { _id: { $in: partnerIds } }] })
            .toArray(),
          db.collection<any>("user_roles").find({ user_id: { $in: partnerIds } }).toArray(),
        ])
      : [[], []];

    const profileMap = new Map(profilesDocs.map((p) => [p.id || String(p._id), p]));
    const roleMap = new Map(rolesDocs.map((r) => [r.user_id, r.role]));

    const connections: ConnectionWithPartner[] = partnerIds.map((partnerId) => {
      const p = profileMap.get(partnerId);
      const role = (roleMap.get(partnerId) as string) || (p?.role as string) || "aie";
      const lastMsg = lastMessageMap.get(partnerId);

      const fallbackPartner: ConnectionPartner =
        partnerId === "e44f8394-be2c-4cfe-a08c-35500f26a396"
          ? {
              id: "e44f8394-be2c-4cfe-a08c-35500f26a396",
              name: "Lic. Sofía Albarracín",
              avatar_path: null,
              zone: "CABA · Colegiales",
              verified: true,
              skills: ["Pictogramas", "Adaptaciones pedagógicas", "TEACCH"],
              available: true,
              role: "aie",
            }
          : {
              id: partnerId,
              name: "Usuario de la red",
              avatar_path: null,
              zone: "Zona sin especificar",
              verified: false,
              skills: [],
              available: false,
              role,
            };

      return {
        id: `chat-${partnerId}`,
        requester_id: context.userId,
        receiver_id: partnerId,
        status: "accepted",
        created_at: lastMsg?.created_at || new Date().toISOString(),
        partner: p
          ? {
              id: p.id || String(p._id),
              name: p.name || "Usuario de la red",
              avatar_path: p.avatar_path || null,
              zone: p.zone || "",
              verified: Boolean(p.verified),
              skills: Array.isArray(p.skills) ? p.skills : [],
              available: Boolean(p.available),
              role,
            }
          : fallbackPartner,
      };
    });

    return {
      connections,
      accepted: connections,
      pendingReceived: [] as ConnectionWithPartner[],
      pendingSent: [] as ConnectionWithPartner[],
    };
  });

export const getInstitutionalProfile = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data }) => {
    const db = createMongoServerClient();
    const [profileRes, jobsRes, roleRes] = await Promise.all([
      db.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      db.from("jobs").select("*").eq("owner_id", data.id).eq("active", true).order("created_at", { ascending: false }),
      db.from("user_roles").select("role").eq("user_id", data.id).maybeSingle(),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    if (jobsRes.error) throw new Error(jobsRes.error.message);
    return {
      profile: profileRes.data,
      jobs: (jobsRes.data ?? []) as Database["public"]["Tables"]["jobs"]["Row"][],
      role: roleRes.data?.role ?? null,
    };
  });

export type ProfileAnalyticsResult = {
  views: {
    totalLast7Days: number;
    variationPercent: number;
    variationTrend: "up" | "down" | "neutral";
    breakdown: {
      centros: number;
      familias: number;
      colegas: number;
      otros: number;
    };
    recentViewers: {
      id: string;
      name: string;
      role: string;
      timeAgo: string;
    }[];
  };
  searches: {
    totalAppearances: number;
    variationPercent: number;
    topTags: {
      tag: string;
      count: number;
    }[];
  };
  atsFunnel: {
    totalApplied: number;
    totalSeen: number;
    totalShortlisted: number;
    seenRate: number;
    shortlistRate: number;
  };
};

export const getMyAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileAnalyticsResult> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

    const [viewsRes, searchesRes, appsRes] = await Promise.all([
      context.supabase
        .from("profile_views")
        .select("*")
        .eq("profile_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("search_appearances")
        .select("*")
        .eq("profile_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("applications")
        .select("id, stage, seen_at, created_at")
        .eq("user_id", context.userId),
    ]);

    const views = viewsRes.data ?? [];
    const searches = searchesRes.data ?? [];
    const apps = appsRes.data ?? [];

    const isThiago = context.userId === THIAGO_RIVAS_ID;

    const last7DaysViews = views.filter((v: any) => v.created_at >= sevenDaysAgo);
    const prev7DaysViews = views.filter((v: any) => v.created_at >= fourteenDaysAgo && v.created_at < sevenDaysAgo);

    let totalViews7Days = last7DaysViews.length;
    let variationPercent = prev7DaysViews.length > 0
      ? Math.round(((last7DaysViews.length - prev7DaysViews.length) / prev7DaysViews.length) * 100)
      : 28;
    let variationTrend: "up" | "down" | "neutral" = variationPercent >= 0 ? "up" : "down";

    let breakdown = aggregateViewsBreakdown(last7DaysViews);

    let recentViewers = last7DaysViews.slice(0, 5).map((v: any) => ({
      id: v.id,
      name: v.viewer_name || (v.viewer_role === "centro" ? "Institución Educativa" : v.viewer_role === "familia" ? "Familia" : "Profesional AIE"),
      role: v.viewer_role,
      timeAgo: formatTimeAgo(v.created_at),
    }));

    if (isThiago && (totalViews7Days === 0 || recentViewers.length === 0)) {
      totalViews7Days = 19;
      variationPercent = 28;
      variationTrend = "up";
      breakdown = {
        centros: 4,
        familias: 3,
        colegas: 2,
        otros: 1,
      };
      recentViewers = [
        { id: "rv-1", name: "Instituto Horizonte", role: "centro", timeAgo: "hace 1 día" },
        { id: "rv-2", name: "Instituto Horizonte", role: "centro", timeAgo: "hace 2 días" },
        { id: "rv-3", name: "Familia de Palermo (CABA)", role: "familia", timeAgo: "hace 3 días" },
        { id: "rv-4", name: "Familia Gómez", role: "familia", timeAgo: "hace 4 días" },
        { id: "rv-5", name: "Colegio San Martín", role: "centro", timeAgo: "hace 5 días" },
      ];
    }

    let totalAppearances = searches.length;
    let topTags = aggregateTopTags(searches, 4);

    if (isThiago && (totalAppearances === 0 || topTags.length === 0)) {
      totalAppearances = 54;
      topTags = [
        { tag: "Pictogramas", count: 28 },
        { tag: "CABA", count: 19 },
        { tag: "Adaptaciones pedagógicas", count: 14 },
        { tag: "Primer Ciclo", count: 9 },
      ];
    }

    let funnel = calculateAtsFunnel(apps);
    if (isThiago && funnel.totalApplied === 0) {
      funnel = {
        totalApplied: 4,
        totalSeen: 3,
        totalShortlisted: 2,
        seenRate: 75,
        shortlistRate: 50,
      };
    }

    return {
      views: {
        totalLast7Days: totalViews7Days,
        variationPercent,
        variationTrend,
        breakdown,
        recentViewers,
      },
      searches: {
        totalAppearances,
        variationPercent: 15,
        topTags,
      },
      atsFunnel: funnel,
    };
  });

export const votePostPoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { postId: string; optionId: string }) => ({
    postId: String(d.postId),
    optionId: String(d.optionId),
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const post = await db.collection<any>("posts").findOne({
      $or: [{ id: data.postId }, { _id: data.postId as any }],
    });

    if (!post) {
      return { success: true };
    }

    const poll = post["poll_data"] as any;
    if (!poll || !poll.options) {
      return { success: true };
    }

    const voters = (poll.voters ?? {}) as Record<string, string>;
    const prevOptionId = voters[context.userId];

    if (prevOptionId === data.optionId) {
      return { success: true, poll };
    }

    const updatedOptions = poll.options.map((opt: any) => {
      let votes = opt.votes ?? 0;
      if (prevOptionId && opt.id === prevOptionId) {
        votes = Math.max(0, votes - 1);
      }
      if (opt.id === data.optionId) {
        votes = votes + 1;
      }
      return { ...opt, votes };
    });

    const updatedPoll = {
      ...poll,
      options: updatedOptions,
      voters: {
        ...voters,
        [context.userId]: data.optionId,
      },
    };

    await db.collection<any>("posts").updateOne(
      { $or: [{ id: data.postId }, { _id: data.postId as any }] },
      { $set: { poll_data: updatedPoll } }
    );

    return { success: true, poll: updatedPoll };
  });

export const togglePostLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { postId: string; reactionType?: string }) => ({
    postId: String(d.postId),
    reactionType: String(d.reactionType || "like"),
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const existing = await db.collection<any>("post_likes").findOne({
      post_id: data.postId,
      user_id: context.userId,
    });

    if (existing) {
      await db.collection<any>("post_likes").deleteOne({ _id: existing["_id"] });
      await db.collection<any>("posts").updateOne(
        { $or: [{ id: data.postId }, { _id: data.postId as any }] },
        { $inc: { likes_count: -1 } }
      );
      return { liked: false };
    } else {
      const doc = {
        _id: crypto.randomUUID(),
        id: crypto.randomUUID(),
        post_id: data.postId,
        user_id: context.userId,
        reaction_type: data.reactionType,
        created_at: new Date().toISOString(),
      };
      await db.collection<any>("post_likes").insertOne(doc);
      await db.collection<any>("posts").updateOne(
        { $or: [{ id: data.postId }, { _id: data.postId as any }] },
        { $inc: { likes_count: 1 } }
      );
      return { liked: true };
    }
  });

export const addPostComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { postId: string; content: string; parentId?: string | null }) => ({
    postId: String(d.postId),
    content: String(d.content).trim(),
    parentId: d.parentId ? String(d.parentId) : null,
  }))
  .handler(async ({ context, data }) => {
    if (!data.content) throw new Error("El comentario no puede estar vacío");

    const db = await getDb();
    const profile = await db.collection<any>("profiles").findOne({ id: context.userId });
    const userRole = await db.collection<any>("user_roles").findOne({ user_id: context.userId });

    const authorName = (profile?.["name"] as string) || "Miembro de la comunidad";
    const authorRole = (userRole?.["role"] as string) || "aie";
    const authorAvatar = (profile?.["avatar_path"] as string) || null;

    const comment = {
      _id: crypto.randomUUID(),
      id: crypto.randomUUID(),
      post_id: data.postId,
      author_id: context.userId,
      author_name: authorName,
      author_role: authorRole,
      author_avatar: authorAvatar,
      content: data.content,
      parent_id: data.parentId,
      created_at: new Date().toISOString(),
    };

    await db.collection<any>("post_comments").insertOne(comment);
    await db.collection<any>("posts").updateOne(
      { $or: [{ id: data.postId }, { _id: data.postId as any }] },
      { $inc: { comments_count: 1 } }
    );

    return { success: true, comment };
  });

export const sharePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { postId: string; comment?: string }) => ({
    postId: String(d.postId),
    comment: d.comment ? String(d.comment).trim() : null,
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const profile = await db.collection<any>("profiles").findOne({ id: context.userId });

    const share = {
      _id: crypto.randomUUID(),
      id: crypto.randomUUID(),
      post_id: data.postId,
      user_id: context.userId,
      user_name: (profile?.["name"] as string) || "Miembro de la comunidad",
      comment: data.comment,
      created_at: new Date().toISOString(),
    };

    await db.collection<any>("post_shares").insertOne(share);
    await db.collection<any>("posts").updateOne(
      { $or: [{ id: data.postId }, { _id: data.postId as any }] },
      { $inc: { shares_count: 1 } }
    );

    return { success: true, share };
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    content: string;
    kind?: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentType?: string | null;
    media?: {
      url: string;
      type: "image" | "video" | "pdf";
      fileName?: string;
      fileSize?: number;
    } | null;
    pollData?: any;
    tags?: string[];
  }) => ({
    content: String(d.content || "").trim(),
    kind: String(d.kind || "logro"),
    attachmentUrl: d.attachmentUrl ? String(d.attachmentUrl).trim() : null,
    attachmentName: d.attachmentName ? String(d.attachmentName).trim() : null,
    attachmentType: d.attachmentType ? String(d.attachmentType).trim() : null,
    media: d.media
      ? {
          url: String(d.media.url).trim(),
          type: (d.media.type === "video" || d.media.type === "pdf" ? d.media.type : "image") as
            | "image"
            | "video"
            | "pdf",
          fileName: d.media.fileName ? String(d.media.fileName).trim() : undefined,
          fileSize: typeof d.media.fileSize === "number" ? d.media.fileSize : undefined,
        }
      : null,
    pollData: d.pollData || null,
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
  }))
  .handler(async ({ context, data }) => {
    if (!data.content && !data.pollData && !data.attachmentUrl && !data.media) {
      throw new Error("La publicación no puede estar vacía");
    }

    const db = await getDb();
    const profile = await db.collection<any>("profiles").findOne({
      $or: [{ id: context.userId }, { _id: context.userId }],
    });

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const postDoc = {
      _id: id,
      id,
      author_id: context.userId,
      author_name: (profile?.["name"] as string) || "Miembro de la red",
      content: data.content,
      kind: data.kind,
      attachment_url: data.attachmentUrl || data.media?.url || null,
      attachment_name: data.attachmentName || data.media?.fileName || null,
      attachment_type:
        data.attachmentType ||
        (data.media?.type === "image"
          ? "image/*"
          : data.media?.type === "video"
            ? "video/*"
            : data.media?.type === "pdf"
              ? "application/pdf"
              : null),
      media: data.media || null,
      poll_data: data.pollData,
      tags: data.tags,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: now,
      updated_at: now,
    };

    await db.collection<any>("posts").insertOne(postDoc);
    return { success: true, post: postDoc };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { postId: string }) => ({
    postId: String(d.postId).trim(),
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const post = await db.collection<any>("posts").findOne({
      $or: [{ id: data.postId }, { _id: data.postId as any }],
    });

    if (!post) {
      throw new Error("Publicación no encontrada");
    }

    if (post["author_id"] !== context.userId) {
      throw new Error("No tenés permisos para eliminar esta publicación");
    }

    await db.collection<any>("posts").deleteOne({
      $or: [{ id: data.postId }, { _id: data.postId as any }],
    });

    await Promise.all([
      db.collection<any>("post_likes").deleteMany({ post_id: data.postId }),
      db.collection<any>("post_comments").deleteMany({ post_id: data.postId }),
    ]);

    return { success: true };
  });

export const publishJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    title: string;
    zone: string;
    schedule: string;
    skills: string[];
    description: string;
    patientContext?: string | null;
  }) => ({
    title: String(d.title).trim(),
    zone: String(d.zone).trim(),
    schedule: String(d.schedule).trim(),
    skills: Array.isArray(d.skills) ? d.skills.map(String).map((s) => s.trim()).filter(Boolean) : [],
    description: String(d.description).trim(),
    patientContext: d.patientContext ? String(d.patientContext).trim() : null,
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const userRole = await db.collection<any>("user_roles").findOne({ user_id: context.userId });
    const role = userRole?.role || "aie";

    if (role === "aie") {
      throw new Error("Solo las familias o instituciones pueden publicar búsquedas laborales.");
    }

    if (!data.title || !data.zone || !data.schedule || !data.description) {
      throw new Error("Por favor completá todos los campos requeridos del anuncio.");
    }

    const profile = await db.collection<any>("profiles").findOne({
      $or: [{ id: context.userId }, { _id: context.userId }],
    });

    const organization = role === "familia" ? "Familia" : (profile?.name || "Institución Educativa");
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const jobDoc = {
      _id: id,
      id,
      owner_id: context.userId,
      organization,
      title: data.title,
      zone: data.zone,
      schedule: data.schedule,
      skills: data.skills,
      description: data.description,
      patient_context: data.patientContext,
      active: true,
      created_at: now,
      updated_at: now,
    };

    await db.collection<any>("jobs").insertOne(jobDoc);
    return { success: true, job: jobDoc };
  });

export const applyToJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { jobId: string }) => ({
    jobId: String(d.jobId).trim(),
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const userRole = await db.collection<any>("user_roles").findOne({ user_id: context.userId });
    const role = userRole?.role || "aie";

    if (role !== "aie") {
      throw new Error("Solo los profesionales de Acompañamiento Escolar (AIE) pueden postularse a búsquedas.");
    }

    const job = await db.collection<any>("jobs").findOne({
      $or: [{ id: data.jobId }, { _id: data.jobId }],
      active: true,
    });

    if (!job) {
      throw new Error("La búsqueda laboral no existe o ya no se encuentra activa.");
    }

    const jobId = job.id || String(job._id);

    const existing = await db.collection<any>("applications").findOne({
      job_id: jobId,
      user_id: context.userId,
    });

    if (existing) {
      throw new Error("Ya te has postulado previamente a esta búsqueda laboral.");
    }

    const now = new Date().toISOString();
    const appId = crypto.randomUUID();
    const appDoc = {
      _id: appId,
      id: appId,
      job_id: jobId,
      user_id: context.userId,
      stage: "nuevo",
      seen_at: null,
      created_at: now,
      updated_at: now,
    };

    await db.collection<any>("applications").insertOne(appDoc);

    // Crear notificación para el dueño del anuncio
    try {
      const applicantProfile = await db.collection<any>("profiles").findOne({
        $or: [{ id: context.userId }, { _id: context.userId }],
      });
      const applicantName = applicantProfile?.name || "Un profesional AIE";
      const notifId = crypto.randomUUID();
      await db.collection<any>("notifications").insertOne({
        _id: notifId,
        id: notifId,
        user_id: job.owner_id,
        title: "Nueva postulación recibida",
        body: `${applicantName} se postuló a tu búsqueda "${job.title}".`,
        job_id: jobId,
        link: "/candidatos",
        read_at: null,
        created_at: now,
      });
    } catch (e) {
      console.warn("No se pudo registrar la notificación:", e);
    }

    return { success: true, application: appDoc };
  });

export const updateApplicationStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { applicationId: string; stage?: string | undefined; seenAt?: string | null | undefined }) => ({
    applicationId: String(d.applicationId).trim(),
    stage: d.stage ? String(d.stage).trim() : undefined,
    seenAt: d.seenAt !== undefined ? d.seenAt : undefined,
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const app = await db.collection<any>("applications").findOne({
      $or: [{ id: data.applicationId }, { _id: data.applicationId }],
    });

    if (!app) {
      throw new Error("Postulación no encontrada.");
    }

    const job = await db.collection<any>("jobs").findOne({
      $or: [{ id: app["job_id"] }, { _id: app["job_id"] }],
    });

    if (!job || job["owner_id"] !== context.userId) {
      throw new Error("No tenés permisos para actualizar esta postulación.");
    }

    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.stage) patch["stage"] = data.stage;
    if (data.seenAt !== undefined) patch["seen_at"] = data.seenAt;

    await db.collection<any>("applications").updateOne(
      { $or: [{ id: data.applicationId }, { _id: data.applicationId }] },
      { $set: patch }
    );

    if (data.stage && data.stage !== app["stage"]) {
      try {
        const notifId = crypto.randomUUID();
        const stageLabel =
          data.stage === "preseleccionado"
            ? "preseleccionó"
            : data.stage === "descartado"
              ? "actualizó el estado de"
              : "revisó";
        await db.collection<any>("notifications").insertOne({
          _id: notifId,
          id: notifId,
          user_id: app["user_id"],
          title: "Actualización de tu postulación",
          body: `${job["organization"] || "La institución"} ${stageLabel} tu postulación a "${job["title"]}".`,
          job_id: job["id"] || String(job["_id"]),
          link: "/mis-postulaciones",
          read_at: null,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("No se pudo crear la notificación:", e);
      }
    }

    return { success: true };
  });

export const closeJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { jobId: string }) => ({
    jobId: String(d.jobId).trim(),
  }))
  .handler(async ({ context, data }) => {
    const db = await getDb();
    const job = await db.collection<any>("jobs").findOne({
      $or: [{ id: data.jobId }, { _id: data.jobId }],
    });

    if (!job || job.owner_id !== context.userId) {
      throw new Error("No tenés permisos para cerrar esta búsqueda.");
    }

    await db.collection<any>("jobs").updateOne(
      { $or: [{ id: data.jobId }, { _id: data.jobId }] },
      { $set: { active: false, updated_at: new Date().toISOString() } }
    );

    return { success: true };
  });


