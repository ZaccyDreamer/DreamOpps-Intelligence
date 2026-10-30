export type MatchProfile = {
  studyLevel?: string | null;
  fieldOfStudy?: string | null;
  country?: string | null;
  nationality?: string | null;
  interests?: string[];
  preferredCategories?: string[];
  preferredLocations?: string[];
  preferredFormats?: string[];
};

export type MatchOpportunity = {
  category?: string;
  studyLevels: string[];
  fields: string[];
  eligibleCountries: string[];
  locations: string[];
  format?: string | null;
  eligibility?: unknown;
  status?: string;
  deadline?: Date | null;
};

export function matchOpportunity(
  profile: MatchProfile,
  opportunity: MatchOpportunity,
) {
  let score = 35;
  const factors: string[] = [];
  const missing: string[] = [];
  const conflicts: string[] = [];

  const level = profile.studyLevel?.toLowerCase();
  if (level) {
    if (!opportunity.studyLevels.length) {
      missing.push("Study level criteria are not stated");
    } else if (
      opportunity.studyLevels.some((value) => value.toLowerCase() === level)
    ) {
      score += 20;
      factors.push("Your study level is listed as eligible");
    } else {
      conflicts.push("Your study level is not listed among eligible levels");
    }
  } else {
    missing.push("Add your study level to check this requirement");
  }

  const field = profile.fieldOfStudy?.toLowerCase();
  if (field) {
    if (
      !opportunity.fields.length ||
      opportunity.fields.some((value) => value.toLowerCase() === "any field")
    ) {
      score += 10;
      factors.push("No field restriction is listed");
    } else if (
      opportunity.fields.some(
        (value) =>
          value.toLowerCase().includes(field) ||
          field.includes(value.toLowerCase()),
      )
    ) {
      score += 20;
      factors.push("Your field of study aligns");
    } else {
      conflicts.push("Your field of study does not match listed fields");
    }
  } else {
    missing.push("Add your field of study to check relevance");
  }

  // Residence and nationality are separate profile details. Do not infer one
  // from the other when evaluating applicant-country eligibility.
  const nationality = profile.nationality?.toLowerCase();
  if (!opportunity.eligibleCountries.length) {
    missing.push("Applicant country criteria are not stated");
  } else if (!nationality) {
    missing.push("Add your nationality to check applicant-country eligibility");
  } else if (
    opportunity.eligibleCountries.some((value) =>
      ["global", "worldwide", "all countries"].includes(value.toLowerCase())
        ? true
        : value.toLowerCase() === nationality,
    )
  ) {
    score += 20;
    factors.push("Your nationality appears within the stated eligibility");
  } else {
    conflicts.push("Your nationality is not listed among eligible countries");
  }

  if (
    profile.preferredCategories?.some(
      (value) => value.toLowerCase() === opportunity.category?.toLowerCase(),
    )
  ) {
    score += 10;
    factors.push("Opportunity type matches your preference");
  }
  if (
    profile.preferredFormats?.length &&
    opportunity.format &&
    profile.preferredFormats.some(
      (value) => value.toLowerCase() === opportunity.format?.toLowerCase(),
    )
  ) {
    score += 10;
    factors.push("Format matches your preference");
  }
  if (
    profile.preferredLocations?.some((preferred) =>
      opportunity.locations.some((location) =>
        location.toLowerCase().includes(preferred.toLowerCase()),
      ),
    )
  ) {
    score += 10;
    factors.push("Location matches your preference");
  }
  if (
    profile.interests?.some((interest) =>
      opportunity.fields.some((value) =>
        value.toLowerCase().includes(interest.toLowerCase()),
      ),
    )
  ) {
    score += 10;
    factors.push("Related to your interests");
  }
  if (
    opportunity.eligibility &&
    typeof opportunity.eligibility === "object" &&
    Object.keys(opportunity.eligibility).length
  ) {
    missing.push("Academic or additional criteria need manual review");
  }
  if (
    opportunity.status === "EXPIRED" ||
    (opportunity.deadline && opportunity.deadline < new Date())
  ) {
    conflicts.push("This opportunity has expired");
  }

  const eligibility = conflicts.length
    ? "conflict"
    : missing.length
      ? "potential"
      : "confirmed";
  const nextAction = conflicts.length
    ? "Review the conflicting criteria and confirm them with the provider."
    : missing.length
      ? "Complete the missing profile details, then check the official source."
      : "Check the official source and required documents before applying.";

  return {
    score: Math.min(100, score),
    eligibility,
    factors,
    missing,
    conflicts,
    nextAction,
  } as const;
}
