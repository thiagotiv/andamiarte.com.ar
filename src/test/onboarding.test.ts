import { describe, expect, it } from "vitest";
import {
  composeFamilyNeeds,
  emptyFamilyNeeds,
  isProfileBaseComplete,
  onboardingSteps,
  type ProfileBase,
} from "@/lib/onboarding";

const aie: ProfileBase = {
  name: "Ana Pérez",
  zone: "CABA",
  bio: "Acompaño en primer grado.",
  billing: "Monotributista",
  skills: ["Pictogramas"],
  experience_years: 2,
  institution_kind: "",
  contact: "",
};

describe("isProfileBaseComplete", () => {
  it("exige nombre y zona en todos los roles", () => {
    expect(isProfileBaseComplete("aie", { ...aie, zone: "" }, emptyFamilyNeeds())).toBe(false);
    expect(isProfileBaseComplete("aie", aie, emptyFamilyNeeds())).toBe(true);
  });
  it("para AIE pide bio, facturación y al menos una habilidad", () => {
    expect(isProfileBaseComplete("aie", { ...aie, skills: [] }, emptyFamilyNeeds())).toBe(false);
    expect(isProfileBaseComplete("aie", { ...aie, billing: "" }, emptyFamilyNeeds())).toBe(false);
  });
  it("para centro pide tipo, descripción y contacto", () => {
    const centro: ProfileBase = {
      ...aie,
      name: "Escuela del Sol",
      billing: "",
      skills: [],
      institution_kind: "Escuela",
      contact: "secretaria@escuela.edu.ar",
    };
    expect(isProfileBaseComplete("centro", centro, emptyFamilyNeeds())).toBe(true);
    expect(isProfileBaseComplete("centro", { ...centro, contact: "" }, emptyFamilyNeeds())).toBe(false);
  });
  it("para familia usa la ficha privada, no el CV público", () => {
    const familia: ProfileBase = { ...aie, billing: "", skills: [], bio: "" };
    const needs = { child_age: "8", schooling: "Nivel Primario", supports: "TEA", schedule: "Turno mañana" };
    expect(isProfileBaseComplete("familia", familia, needs)).toBe(true);
    expect(isProfileBaseComplete("familia", familia, emptyFamilyNeeds())).toBe(false);
  });
  it("no considera completo un perfil sin rol o sin ficha", () => {
    expect(isProfileBaseComplete(undefined, aie, emptyFamilyNeeds())).toBe(false);
    expect(isProfileBaseComplete("aie", null, emptyFamilyNeeds())).toBe(false);
  });
});

describe("composeFamilyNeeds", () => {
  it("arma un resumen legible para la columna needs", () => {
    expect(
      composeFamilyNeeds({
        child_age: "7",
        schooling: "Nivel Primario",
        supports: "Apoyo en aula",
        schedule: "Turno tarde",
      }),
    ).toBe("Edad: 7\nEscolaridad: Nivel Primario\nApoyos: Apoyo en aula\nTurnos: Turno tarde");
  });
  it("omite líneas vacías", () => {
    expect(composeFamilyNeeds({ ...emptyFamilyNeeds(), child_age: "5" })).toBe("Edad: 5");
  });
});

describe("onboardingSteps", () => {
  it("devuelve cuatro pasos distintos por rol", () => {
    expect(onboardingSteps("aie")).toHaveLength(4);
    expect(onboardingSteps("centro")[0]?.id).toBe("institucion");
    expect(onboardingSteps("familia")[1]?.id).toBe("escolaridad");
  });
});
