export const categories = [
  "Scholarship",
  "Internship",
  "Graduate job",
  "Fellowship",
  "Competition",
  "Grant",
] as const;
export type Category = (typeof categories)[number];
export type Opportunity = {
  id: string;
  slug: string;
  title: string;
  provider: string;
  category: Category;
  location: string;
  format: "Remote" | "Hybrid" | "In person";
  funding: string;
  deadline: string;
  deadlineTimezone?: string;
  level: string[];
  field: string[];
  description: string;
  source: string;
  checkedAt: string;
  status: "published" | "expired" | "archived";
  demo?: boolean;
  applicationUrl?: string;
  verificationStatus?: string;
  sourceCredibility?: string;
};
export type MatchResult = {
  score: number;
  eligibility: "confirmed" | "potential" | "conflict";
  factors: string[];
  missing: string[];
  conflicts: string[];
  nextAction: string;
};
