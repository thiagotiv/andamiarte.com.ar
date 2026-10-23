import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Lock, Mail, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/network";

export const Route = createFileRoute("/privacidad")({
  head: () =>
    pageHead(
      "Política de Privacidad y Tratamiento de Datos",
      "Protección de datos personales conforme a la Ley Nacional 25.326, resguardo pedagógico y normativa de la AAIP en Andamiarte.",
    ),
  component: PrivacidadPage,
});

function PrivacidadPage() {
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
            <Shield size={13} /> Ley Nacional N° 25.326
          </span>
        </div>

        {/* Tarjeta marfil principal */}
        <article className="bg-white/85 backdrop-blur-sm border border-stone-200/60 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
          {/* Encabezado */}
          <header className="border-b border-stone-200/80 pb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              <FileCheck size={15} className="text-[#1d3d29]" />
              Conforme a la Ley Nacional N° 25.326 y Normativa de la AAIP
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d3d29] tracking-tight leading-tight">
              POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium">
              Última actualización: <strong>Octubre de 2026</strong> · República Argentina
            </p>
          </header>

          {/* Cláusulas */}
          <div className="space-y-8 text-stone-700 leading-relaxed text-sm md:text-base">
            {/* 1. COMPROMISO NORMATIVO (LEY 25.326) */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  1
                </span>
                COMPROMISO NORMATIVO (LEY 25.326)
              </h2>
              <p>
                Andamiarte procesa los datos personales de sus usuarios bajo los estándares de confidencialidad y licitud
                establecidos por la Ley Nacional N° 25.326 de Protección de los Datos Personales y su Decreto Reglamentario
                N° 1558/2001.
              </p>
            </section>

            {/* 2. TRATAMIENTO DE DATOS DE APOYO PEDAGÓGICO (ART. 2 LEY 25.326) */}
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  2
                </span>
                TRATAMIENTO DE DATOS DE APOYO PEDAGÓGICO (ART. 2 LEY 25.326)
              </h2>
              <p>La información referente a requerimientos de apoyo en el aula y adaptaciones curriculares:</p>
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-2 text-stone-700">
                <p>
                  <strong>a)</strong> Se recolecta exclusivamente con el consentimiento informado de la persona titular o
                  tutor responsable al momento de completar la ficha privada.
                </p>
                <p>
                  <strong>b)</strong> Es de carácter estrictamente privado, no forma parte del directorio público y se
                  encuentra excluida de los motores de búsqueda externos.
                </p>
                <p>
                  <strong>c)</strong> Solo se comparte con profesionales postulados o conectados que cuenten con la
                  autorización del titular.
                </p>
              </div>
            </section>

            {/* 3. FINALIDAD DEL REGISTRO */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  3
                </span>
                FINALIDAD DEL REGISTRO
              </h2>
              <p>
                Los datos recabados se emplean únicamente para autenticar accesos seguros, facilitar la vinculación
                profesional e interactuar en el espacio comunitario. Andamiarte no comercializa ni cede información personal
                a terceros.
              </p>
            </section>

            {/* 4. SEGURIDAD TÉCNICA */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  4
                </span>
                SEGURIDAD TÉCNICA
              </h2>
              <p>
                Los datos se almacenan en infraestructura segura (MongoDB Atlas) y los recursos multimedia o guías
                pedagógicas se resguardan en servidores dedicados (Cloudinary). Las sesiones se protegen mediante credenciales
                verificadas y tokens JWT.
              </p>
            </section>

            {/* 5. DERECHOS ARCO (ACCESO, RECTIFICACIÓN, ACTUALIZACIÓN Y SUPRESIÓN) */}
            <section className="space-y-2.5">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  5
                </span>
                DERECHOS ARCO (ACCESO, RECTIFICACIÓN, ACTUALIZACIÓN Y SUPRESIÓN)
              </h2>
              <p>
                El titular de los datos personales puede ejercer sin costo alguno sus derechos de acceso, rectificación o
                supresión de cuenta enviando una solicitud a{" "}
                <a
                  href="mailto:contacto@andamiarte.com.ar"
                  className="font-semibold text-[#1d3d29] underline hover:text-[#142b1d]"
                >
                  contacto@andamiarte.com.ar
                </a>{" "}
                (Ley N° 25.326).
              </p>
            </section>

            {/* 6. DISPOSICIÓN DE LA AAIP (ÓRGANO DE CONTROL) */}
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-[#1d3d29] flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d3d29]/10 text-[#1d3d29] text-xs font-black">
                  6
                </span>
                DISPOSICIÓN DE LA AAIP (ÓRGANO DE CONTROL)
              </h2>
              <blockquote className="border-l-4 border-[#1d3d29] pl-4 sm:pl-5 py-2.5 bg-stone-50 rounded-r-2xl italic text-xs sm:text-sm text-stone-700 leading-relaxed">
                &ldquo;La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N°
                25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en
                sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.&rdquo;
              </blockquote>
            </section>
          </div>

          {/* Pie de página de la tarjeta */}
          <footer className="pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-[#1d3d29]" />
              <span>Protección y Privacidad de Datos en Andamiarte</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail size={14} className="text-stone-400" />
              <span>Contacto de privacidad:</span>
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
