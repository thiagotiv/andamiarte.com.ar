export type FamilyNeedsVisibility = "private" | "network_only" | "applied_professionals";

export type PrivacySettings = {
  // Configuración para AIE
  show_phone: boolean;
  show_dni: boolean;
  show_exact_location: boolean;
  public_profile_visible: boolean;
  // Configuración para Familias
  family_needs_visibility: FamilyNeedsVisibility;
  // Configuración para Centros
  show_contact: boolean;
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  show_phone: true,
  show_dni: false,
  show_exact_location: false,
  public_profile_visible: true,
  family_needs_visibility: "private",
  show_contact: true,
};

export function parsePrivacySettings(raw: unknown): PrivacySettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
  const obj = raw as Record<string, unknown>;
  const vis = obj["family_needs_visibility"];
  const familyNeedsVis: FamilyNeedsVisibility =
    vis === "network_only" || vis === "applied_professionals" ? vis : "private";

  return {
    show_phone: obj["show_phone"] !== false,
    show_dni: Boolean(obj["show_dni"]),
    show_exact_location: Boolean(obj["show_exact_location"]),
    public_profile_visible: obj["public_profile_visible"] !== false,
    family_needs_visibility: familyNeedsVis,
    show_contact: obj["show_contact"] !== false,
  };
}

export function canViewPhone(settings: PrivacySettings, isOwner: boolean): boolean {
  if (isOwner) return true;
  return settings.show_phone;
}

export function canViewDni(settings: PrivacySettings, isOwner: boolean): boolean {
  if (isOwner) return true;
  return settings.show_dni;
}

export function canViewExactLocation(settings: PrivacySettings, isOwner: boolean): boolean {
  if (isOwner) return true;
  return settings.show_exact_location;
}

export function isPublicProfileVisible(
  settings: PrivacySettings,
  isOwner: boolean,
  basePublicProfile: boolean = true,
): boolean {
  if (isOwner) return true;
  return basePublicProfile && settings.public_profile_visible;
}

export function canViewFamilyNeeds(
  visibility: FamilyNeedsVisibility | string | undefined,
  isOwner: boolean,
  relationship?: "connected" | "applied" | "none",
): boolean {
  if (isOwner) return true;
  const v = visibility ?? "private";
  if (v === "private") return false;
  if (v === "network_only") return relationship === "connected";
  if (v === "applied_professionals") return relationship === "connected" || relationship === "applied";
  return false;
}
