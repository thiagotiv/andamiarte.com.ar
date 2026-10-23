import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Scale, ShieldCheck, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/network";

export const Route = createFileRoute("/terminos")({
  head: () =>
    pageHead(
      "Términos y Condiciones de Uso",
      "Conocé las condiciones legales de uso, deslinde prestacional (Ley 24.901) y resguardo escolar (Ley 26.061) de Andamiarte en Argentina.",
    ),
  component: TerminosPage,
});

function TerminosPage() {
  return (
    <main className="w-full min-h-screen bg-[#fbf5ee] py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-6 py-6 md:py-10 space-y-6">
        {/* Navegación de regreso */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-xs font-semibold text-stone-600 hover:text-[#1d3d29] hover:bg-white/60 rounded-xl"
          >
            <Link to="/">
              <ArrowLeft size={15} /> Volver al inicio
            </Link>
          </Button>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d3d29] bg-emerald-100/70 border border-emerald-300/60 px-3 py-1 rounded-full">
            <Scale size={13} /> Marco Regulatorio Argentino
          </span>
        </div>

        {/* Tarjeta marfil principal */}
        <article className="bg-white/85 backdrop-blur-sm border border-stone-200/60 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
          {/* Encabezado */}
          <header className="border-b border-stone-200/80 pb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              <FileText size={15} className="text-[#1d3d29]" />
              Documento Legal Oficial
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d3d29] tracking-tight leading-tight">
              TÉRMINOS Y CONDICIONES DE USO DE ANDAMIARTE
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium">
              Última actualización: <strong>Octubre de 2026</strong> · República Argentina
            </p>
          </header>

          {/* Cláusulas */}
          <div className="space-y-8 text-stone-700 leading-relaxed text-sm md:text-base">
            {/* 1. ACEPTACIÓN DE LOS TÉRMINOS */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  1
                </span>
                ACEPTACIÓN DE LOS TÉRMINOS
              </h2>
              <p>
                El acceso y uso de la plataforma digital Andamiarte (en adelante, la &ldquo;Plataforma&rdquo;) otorga la
                condición de Usuario (Acompañante de Integración Escolar / Acompañante Terapéutico, Familia o Centro
                Educativo) e implica la aceptación plena de las presentes cláusulas de uso.
              </p>
            </section>

            {/* 2. OBJETO DE LA PLATAFORMA */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  2
                </span>
                OBJETO DE LA PLATAFORMA
              </h2>
              <p>
                Andamiarte es un canal digital independiente de vinculación comunitaria y profesional. Su objetivo
                exclusivo es brindar un espacio de encuentro y articulación entre profesionales de apoyo a la inclusión
                escolar (AIE, APND, AT), centros educativos y terapéuticos, y familias de estudiantes que requieren apoyos
                específicos para su trayectoria pedagógica en la República Argentina.
              </p>
            </section>

            {/* 3. DELIMITACIÓN PRESTACIONAL Y DE SALUD (LEY 24.901) */}
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  3
                </span>
                DELIMITACIÓN PRESTACIONAL Y DE SALUD (LEY 24.901)
              </h2>
              <p>Andamiarte deja constancia expresa de que:</p>
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-2 text-stone-700">
                <p>
                  <strong>a)</strong> <strong>NO es un centro asistencial, médico, terapéutico</strong> ni categorizado en
                  el marco de la Ley N° 24.901 de Prestaciones Básicas.
                </p>
                <p>
                  <strong>b)</strong> <strong>NO brinda servicios de salud</strong>, diagnósticos ni atención clínica directa.
                </p>
                <p>
                  <strong>c)</strong> <strong>NO es obra social, prepaga</strong> ni agente financiador del sistema de
                  salud.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 italic">
                La tramitación de módulos de apoyo escolar, autorizaciones, presupuestos y facturación ante entidades de
                cobertura corresponde exclusivamente a los profesionales, las familias y las obras sociales o prepagas
                pertinentes.
              </p>
            </section>

            {/* 4. CONDICIÓN PROFESIONAL Y FISCAL (ARCA / MONOTRIBUTO) */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  4
                </span>
                CONDICIÓN PROFESIONAL Y FISCAL (ARCA / MONOTRIBUTO)
              </h2>
              <p>
                Los profesionales registrados ejercen su labor de manera autónoma e independiente. Andamiarte no actúa
                como empleador ni intermediario laboral. Cada profesional es el único responsable de contar con sus
                certificados de formación, seguros pertinentes y de emitir sus comprobantes fiscales ante la Agencia de
                Recaudación y Control Aduanero (ARCA).
              </p>
            </section>

            {/* 5. PRIVACIDAD Y RESGUARDO EN EL ÁMBITO ESCOLAR (LEY 26.061) */}
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  5
                </span>
                PRIVACIDAD Y RESGUARDO EN EL ÁMBITO ESCOLAR (LEY 26.061)
              </h2>
              <p>
                En conformidad con el marco de protección integral de los derechos de estudiantes y alumnos (Ley N°
                26.061):
              </p>
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-2 text-stone-700">
                <p>
                  <strong>a)</strong> Queda estrictamente prohibido difundir en el feed comunitario datos personales,
                  legajos educativos, material identificable o diagnósticos de estudiantes.
                </p>
                <p>
                  <strong>b)</strong> La información sobre necesidades pedagógicas y apoyos escolares ingresada por las
                  familias es estrictamente confidencial y solo accesible de forma privada por los profesionales que la
                  familia autorice.
                </p>
                <p>
                  <strong>c)</strong> Andamiarte eliminará de inmediato cualquier publicación que incumpla estas directivas
                  de resguardo y privacidad escolar.
                </p>
              </div>
            </section>

            {/* 6. CONVIVENCIA EN LA COMUNIDAD */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  6
                </span>
                CONVIVENCIA EN LA COMUNIDAD
              </h2>
              <p>
                El espacio comunitario (/comunidad) se destina al intercambio didáctico, publicaciones profesionales y
                recursos pedagógicos. No se admite contenido difamatorio, discriminatorio ni publicidad no vinculada a la
                inclusión educativa.
              </p>
            </section>

            {/* 7. JURISDICCIÓN Y COMPETENCIA */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  7
                </span>
                JURISDICCIÓN Y COMPETENCIA
              </h2>
              <p>
                Los presentes Términos se rigen por la legislación de la República Argentina. Cualquier divergencia será
                sometida a los Tribunales Ordinarios en lo Comercial de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>
          </div>

          {/* Pie de página de la tarjeta */}
          <footer className="pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1d3d29]" />
              <span>Red de Inclusión Escolar Andamiarte</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail size={14} className="text-stone-400" />
              <span>Consultas legales:</span>
              <a
                href="mailto:contacto@andamiarte.com.ar"
                className="font-semibold text-[#1d3d29] hover:underline"
              >
                contacto@andamiarte.com.ar
              </a>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
