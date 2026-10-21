import { describe, expect, it } from "vitest";
import { validateProfileFile, profileFilePath } from "@/lib/profile-files";
describe("profile file rules", () => {
  it("accepts only images for avatar", () => {
    expect(validateProfileFile("avatar", { type: "image/png", size: 1000 })).toBeNull();
    expect(validateProfileFile("avatar", { type: "application/pdf", size: 1000 })).not.toBeNull();
  });
  it("accepts only PDF for CV", () => {
    expect(validateProfileFile("cv", { type: "application/pdf", size: 1000 })).toBeNull();
    expect(validateProfileFile("cv", { type: "image/png", size: 1000 })).not.toBeNull();
  });
  it("rejects files over 5 MB", () => {
    expect(validateProfileFile("cv", { type: "application/pdf", size: 5 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("stores files inside the user's folder", () => {
    expect(profileFilePath("u1", "cv", "mi cv.PDF", 5)).toBe("u1/cv_path-5.pdf");
  });
});
