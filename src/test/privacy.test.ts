import { describe, it, expect } from "vitest";
import {
  parsePrivacySettings,
  DEFAULT_PRIVACY_SETTINGS,
  canViewPhone,
  canViewDni,
  canViewExactLocation,
  isPublicProfileVisible,
  canViewFamilyNeeds,
} from "@/lib/privacy";

describe("Privacy Settings & Motor de Privacidad Granular", () => {
  it("defaults to safe standard values on null/undefined input", () => {
    expect(parsePrivacySettings(null)).toEqual(DEFAULT_PRIVACY_SETTINGS);
    expect(parsePrivacySettings(undefined)).toEqual(DEFAULT_PRIVACY_SETTINGS);
    expect(parsePrivacySettings([])).toEqual(DEFAULT_PRIVACY_SETTINGS);
  });

  it("correctly parses configured privacy settings", () => {
    const custom = {
      show_phone: false,
      show_dni: true,
      show_exact_location: true,
      public_profile_visible: false,
      family_needs_visibility: "applied_professionals",
      show_contact: false,
    };
    const parsed = parsePrivacySettings(custom);
    expect(parsed.show_phone).toBe(false);
    expect(parsed.show_dni).toBe(true);
    expect(parsed.show_exact_location).toBe(true);
    expect(parsed.public_profile_visible).toBe(false);
    expect(parsed.family_needs_visibility).toBe("applied_professionals");
    expect(parsed.show_contact).toBe(false);
  });

  it("enforces AIE contact details visibility rules", () => {
    const strictSettings = {
      show_phone: false,
      show_dni: false,
      show_exact_location: false,
      public_profile_visible: true,
      family_needs_visibility: "private" as const,
      show_contact: false,
    };

    // Outside visitors should not see hidden fields
    expect(canViewPhone(strictSettings, false)).toBe(false);
    expect(canViewDni(strictSettings, false)).toBe(false);
    expect(canViewExactLocation(strictSettings, false)).toBe(false);

    // Profile owner can always view their own information
    expect(canViewPhone(strictSettings, true)).toBe(true);
    expect(canViewDni(strictSettings, true)).toBe(true);
    expect(canViewExactLocation(strictSettings, true)).toBe(true);
  });

  it("enforces public directory visibility", () => {
    const hiddenSettings = {
      ...DEFAULT_PRIVACY_SETTINGS,
      public_profile_visible: false,
    };

    expect(isPublicProfileVisible(hiddenSettings, false, true)).toBe(false);
    expect(isPublicProfileVisible(hiddenSettings, true, true)).toBe(true); // Owner can preview
  });

  it("enforces family pedagogical needs visibility constraints", () => {
    // Private by default
    expect(canViewFamilyNeeds("private", false, "none")).toBe(false);
    expect(canViewFamilyNeeds("private", false, "connected")).toBe(false);
    expect(canViewFamilyNeeds("private", false, "applied")).toBe(false);
    expect(canViewFamilyNeeds("private", true, "none")).toBe(true);

    // Network only
    expect(canViewFamilyNeeds("network_only", false, "none")).toBe(false);
    expect(canViewFamilyNeeds("network_only", false, "connected")).toBe(true);
    expect(canViewFamilyNeeds("network_only", false, "applied")).toBe(false);

    // Applied professionals
    expect(canViewFamilyNeeds("applied_professionals", false, "none")).toBe(false);
    expect(canViewFamilyNeeds("applied_professionals", false, "applied")).toBe(true);
    expect(canViewFamilyNeeds("applied_professionals", false, "connected")).toBe(true);
  });
});
