import { describe, it, expect } from "vitest";
import { matchOpportunity } from "./matching.js";
const opp = {
  studyLevels: ["Undergraduate"],
  fields: ["Computer science"],
  eligibleCountries: ["Kenya"],
  locations: ["Remote"],
  format: "REMOTE",
};
describe("explainable opportunity matching", () => {
  it("scores matching known profile details and explains factors", () => {
    const r = matchOpportunity(
      {
        studyLevel: "Undergraduate",
        fieldOfStudy: "Computer science",
        nationality: "Kenya",
        preferredFormats: ["remote"],
      },
      opp,
    );
    expect(r.score).toBe(100);
    expect(r.eligibility).toBe("confirmed");
    expect(r.factors).toHaveLength(4);
  });
  it("treats missing details as potential, not a conflict", () => {
    const r = matchOpportunity({}, opp);
    expect(r.eligibility).toBe("potential");
    expect(r.conflicts).toHaveLength(0);
    expect(r.missing.length).toBeGreaterThan(0);
  });
  it("reports a known mismatch as a conflict", () => {
    const r = matchOpportunity(
      { studyLevel: "Doctoral", nationality: "Canada" },
      opp,
    );
    expect(r.eligibility).toBe("conflict");
    expect(r.conflicts).toHaveLength(2);
  });
  it("does not penalize unspecified country eligibility", () => {
    const r = matchOpportunity(
      {
        studyLevel: "Undergraduate",
        fieldOfStudy: "Computer science",
        country: "Kenya",
      },
      { ...opp, eligibleCountries: [] },
    );
    expect(r.eligibility).toBe("potential");
    expect(r.conflicts).toHaveLength(0);
  });
  it("does not treat country of residence as nationality", () => {
    const r = matchOpportunity(
      {
        studyLevel: "Undergraduate",
        fieldOfStudy: "Computer science",
        country: "Kenya",
      },
      { ...opp, eligibleCountries: ["Canada"] },
    );
    expect(r.eligibility).toBe("potential");
    expect(r.conflicts).toHaveLength(0);
    expect(r.missing).toContain(
      "Add your nationality to check applicant-country eligibility",
    );
  });
  it("identifies expired opportunities as conflict", () => {
    const r = matchOpportunity({}, { ...opp, status: "EXPIRED" });
    expect(r.conflicts).toContain("This opportunity has expired");
  });
});
