import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  FileText,
  MapPin,
  Lock,
  Save,
  ArrowLeft,
  Users,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RouteError } from "@/components/site-shell";
import { accountOptions, pageHead } from "@/lib/network";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  parsePrivacySettings,
  type PrivacySettings,
  type FamilyNeedsVisibility,
} from "@/lib/privacy";

export const Route = createFileRoute("/_authenticated/configuracion-privacidad")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountOptions),
  head: () =>
    pageHead(
      "Privacidad y Configuración",
      "Controlá la visibilidad de tus datos personales, de contacto y necesidades pedagógicas.",
    ),
  component: PrivacySettingsView,
  errorComponent: RouteError,
  notFoundComponent: RouteError,
});

function PrivacySettingsView() {
  const { data } = useSuspenseQuery(accountOptions);
  const qc = useQueryClient();
  const profile = data.profile;
  const role = data.role;

  const currentSettings = parsePrivacySettings(profile?.privacy_settings);

  // Estados locales para AIE
  const [showPhone, setShowPhone] = useState(currentSettings.show_phone);
  const [showDni, setShowDni] = useState(currentSettings.show_dni);
  const [showExactLocation, setShowExactLocation] = useState(currentSettings.show_exact_location);
  const [publicProfileVisible, setPublicProfileVisible] = useState(
    profile?.public_profile && currentSettings.public_profile_visible,
  );
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [dni, setDni] = useState(profile?.dni ?? "");
  const [exactLocation, setExactLocation] = useState(profile?.exact_location ?? "");

  // Estados locales para Familia
  const initialFamilyVis: FamilyNeedsVisibility =
    data.family?.visibility === "network_only" || data.family?.visibility === "applied_professionals"
      ? data.family.visibility
      : currentSettings.family_needs_visibility;
  const [familyNeedsVisibility, setFamilyNeedsVisibility] =
    useState<FamilyNeedsVisibility>(initialFamilyVis);

  // Estados locales para Centro
  const [showContact, setShowContact] = useState(currentSettings.show_contact);

  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const updatedSettings: PrivacySettings = {
      show_phone: showPhone,
      show_dni: showDni,
      show_exact_location: showExactLocation,
      public_profile_visible: publicProfileVisible,
      family_needs_visibility: familyNeedsVisibility,
      show_contact: showContact,
    };

    // Actualizamos perfil
    const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
      privacy_settings: updatedSettings as unknown as Json,
    };

    if (role === "aie") {
      profileUpdate.public_profile = publicProfileVisible;
      profileUpdate.phone = phone.trim();
      profileUpdate.dni = dni.trim();
      profileUpdate.exact_location = exactLocation.trim();
    }

    const resProfile = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", profile.id);

    let resFamily = null;
    if (role === "familia") {
      resFamily = await supabase
        .from("family_needs")
        .update({ visibility: familyNeedsVisibility })
        .eq("user_id", profile.id);
    }

    if (resProfile.error || resFamily?.error) {
      toast.error(resProfile.error?.message ?? resFamily?.error?.message ?? "Error al guardar");
    } else {
      toast.success("Configuración de privacidad guardada con éxito");
      await qc.invalidateQueries({ queryKey: ["account"] });
      await qc.invalidateQueries({ queryKey: ["network"] });
    }

    setSaving(false);
  }

  return (
    <main className="page">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/perfil">
            <ArrowLeft size={16} /> Volver a mi perfil
          </Link>
        </Button>
      </div>

      <div className="page-title">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-primary">
            <Lock size={15} /> Centro de Seguridad y Control de Datos
          </div>
          <h1>Privacidad y Configuración Granular</h1>
          <p className="page-description">
            Definí con precisión qué información mostrás públicamente y a quién le permitís acceder a tus datos de contacto o fichas de acompañamiento.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Panel para AIE (Acompañantes) */}
        {role === "aie" && (
          <>
            <div className="surface p-6 rounded-xl border border-border shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {publicProfileVisible ? (
                      <Eye className="text-primary" size={20} />
                    ) : (
                      <EyeOff className="text-muted-foreground" size={20} />
                    )}
                    <h3 className="text-lg font-semibold text-foreground">
                      Aparecer en el Directorio Público de Profesionales
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Si desactivás esta opción, tu perfil no será visible en el buscador público de AIEs, manteniendo tu cuenta activa solo para postularte a búsquedas específicas.
                  </p>
                </div>
                <Switch
                  id="toggle-public-profile"
                  checked={publicProfileVisible}
                  onCheckedChange={setPublicProfileVisible}
                />
              </div>
            </div>

            <div className="surface p-6 rounded-xl border border-border shadow-sm space-y-6">
              <div className="border-b border-border pb-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={20} />
                  Visibilidad de Datos Personales en tu CV Interactivo
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Controlá qué datos sensibles pueden ver los centros y familias autorizadas.
                </p>
              </div>

              {/* Teléfono */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label htmlFor="toggle-phone" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Phone size={16} /> Mostrar teléfono de contacto
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Si lo ocultás, los interesados solo podrán comunicarse con vos mediante el Chat Privado interno de la plataforma.
                  </p>
                  <input
                    type="tel"
                    className="field mt-2 text-sm max-w-xs"
                    placeholder="Ej. +54 9 11 1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Switch
                  id="toggle-phone"
                  checked={showPhone}
                  onCheckedChange={setShowPhone}
                />
              </div>

              {/* DNI */}
              <div className="flex items-start justify-between gap-4 pt-4 border-t border-border/60">
                <div className="space-y-1">
                  <label htmlFor="toggle-dni" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText size={16} /> Mostrar DNI / Matrícula profesional
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Mostrado en el CV exportable y en tu ficha para verificación de antecedentes profesionales.
                  </p>
                  <input
                    type="text"
                    className="field mt-2 text-sm max-w-xs"
                    placeholder="Ej. DNI / Matrícula N°"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                  />
                </div>
                <Switch
                  id="toggle-dni"
                  checked={showDni}
                  onCheckedChange={setShowDni}
                />
              </div>

              {/* Ubicación Exacta */}
              <div className="flex items-start justify-between gap-4 pt-4 border-t border-border/60">
                <div className="space-y-1">
                  <label htmlFor="toggle-location" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin size={16} /> Mostrar barrio / ubicación exacta
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Si está desactivado, solo se mostrará tu zona general de cobertura (ej. &quot;CABA&quot;) sin detallar calles o dirección exacta.
                  </p>
                  <input
                    type="text"
                    className="field mt-2 text-sm max-w-xs"
                    placeholder="Ej. Palermo Hollywood, cerca de Plaza Italia"
                    value={exactLocation}
                    onChange={(e) => setExactLocation(e.target.value)}
                  />
                </div>
                <Switch
                  id="toggle-location"
                  checked={showExactLocation}
                  onCheckedChange={setShowExactLocation}
                />
              </div>
            </div>
          </>
        )}

        {/* Panel para Familia */}
        {role === "familia" && (
          <div className="surface p-6 rounded-xl border border-border shadow-sm space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="text-primary" size={20} />
                Privacidad de las Necesidades Pedagógicas del Niño/a
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                La información sobre apoyos y contexto escolar es sensible. Elegí quién puede acceder a la ficha técnica:
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  value: "private",
                  label: "Máxima Privacidad (Solo yo)",
                  desc: "Ningún usuario de la red puede ver la ficha de necesidades. Vos decidís qué compartir manualmente por chat privado.",
                },
                {
                  value: "network_only",
                  label: "Solo mi Red de Confianza",
                  desc: "Únicamente los profesionales que guardaste en tu red o con los que intercambiaste mensajes pueden ver el contexto escolar.",
                },
                {
                  value: "applied_professionals",
                  label: "Acompañantes en mis búsquedas activas",
                  desc: "Los profesionales postulados a tus búsquedas laborales publicadas podrán consultar los requerimientos pedagógicos para evaluar el puesto.",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    familyNeedsVisibility === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="family_needs_vis"
                    value={opt.value}
                    checked={familyNeedsVisibility === opt.value}
                    onChange={() => setFamilyNeedsVisibility(opt.value as FamilyNeedsVisibility)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="font-semibold text-sm text-foreground block">
                      {opt.label}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Panel para Centro */}
        {role === "centro" && (
          <div className="surface p-6 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="text-primary" size={20} />
                  <h3 className="text-lg font-semibold text-foreground">
                    Mostrar información de contacto en el perfil institucional
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Permite que los acompañantes vean tus canales oficiales de contacto (correo/teléfono) en tu página pública de centro además del chat interno.
                </p>
              </div>
              <Switch
                id="toggle-center-contact"
                checked={showContact}
                onCheckedChange={setShowContact}
              />
            </div>
          </div>
        )}

        {/* Botón de guardado */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="cta" size="lg" disabled={saving}>
            <Save size={18} />
            {saving ? "Guardando cambios…" : "Guardar configuración de privacidad"}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/perfil">Cancelar</Link>
          </Button>
        </div>

        <div className="p-4 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground flex items-center gap-2">
          <CheckCircle2 size={16} className="text-primary shrink-0" />
          <span>
            Tus preferencias se aplican en tiempo real en el Directorio, en el CV Interactivo y en todas las búsquedas laborales.
          </span>
        </div>
      </form>
    </main>
  );
}
