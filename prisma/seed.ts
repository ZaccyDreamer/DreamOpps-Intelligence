import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const connectionString = process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("DATABASE_URL must be set before seeding.");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const samples = [
  {
    slug: "demo-future-makers-scholarship",
    title: "DEMO — Future Makers Scholarship",
    provider: "Fictional Northstar Foundation",
    category: "Scholarship",
    description:
      "FICTIONAL demonstration record. This is not a real scholarship and has no live application. Included only to demonstrate DreamOpps opportunity details, eligibility and matching.",
    eligibleCountries: ["Global"],
    locations: ["Global · 42 countries"],
    studyLevels: ["Undergraduate", "Postgraduate"],
    fields: ["Technology", "Business", "Design"],
    fundingAmount: 12000,
    fundingCurrency: "USD",
    fundingType: "Demonstration amount only",
    format: "HYBRID" as const,
    applicationUrl: "https://example.invalid/demo-scholarship",
    deadline: new Date("2026-11-30T23:59:00Z"),
    deadlineTimezone: "UTC",
    status: "PUBLISHED" as const,
    demo: true,
  },
  {
    slug: "demo-climate-data-internship",
    title: "DEMO — Climate Data Research Internship",
    provider: "Fictional Open Earth Lab",
    category: "Internship",
    description:
      "FICTIONAL demonstration record. This is not a real internship and has no live application. Included only to demonstrate remote opportunity presentation.",
    eligibleCountries: ["Global"],
    locations: ["Remote · worldwide"],
    studyLevels: ["Undergraduate", "Postgraduate"],
    fields: ["Environment", "Data science"],
    fundingType: "Demonstration stipend only",
    format: "REMOTE" as const,
    applicationUrl: "https://example.invalid/demo-internship",
    deadline: new Date("2026-12-12T23:59:00Z"),
    deadlineTimezone: "UTC",
    status: "PUBLISHED" as const,
    demo: true,
  },
  {
    slug: "demo-global-health-fellows",
    title: "DEMO — Global Health Equity Fellows",
    provider: "Fictional Public Health Futures",
    category: "Fellowship",
    description:
      "FICTIONAL demonstration record. This is not a real fellowship and has no live application.",
    eligibleCountries: ["Kenya", "Ghana", "Rwanda"],
    locations: ["Kenya", "Ghana", "Rwanda"],
    studyLevels: ["Postgraduate"],
    fields: ["Public health", "Policy"],
    fundingType: "Demonstration only",
    format: "IN_PERSON" as const,
    applicationUrl: "https://example.invalid/demo-fellowship",
    deadline: new Date("2027-01-08T23:59:00Z"),
    deadlineTimezone: "UTC",
    status: "PUBLISHED" as const,
    demo: true,
  },
];
for (const item of samples) {
  const { deadline, ...data } = item;
  const opportunity = await prisma.opportunity.upsert({
    where: { slug: item.slug },
    create: {
      ...data,
      deadline,
      sourceCredibility: "UNKNOWN",
      verificationStatus: "UNCHECKED",
    },
    update: { ...data, deadline },
  });
  await prisma.opportunitySource.upsert({
    where: {
      opportunityId_url: {
        opportunityId: opportunity.id,
        url: "https://example.invalid/demo-source",
      },
    },
    create: {
      opportunityId: opportunity.id,
      url: "https://example.invalid/demo-source",
      name: "Fictional demonstration source",
      authorized: false,
    },
    update: {},
  });
}
console.log(
  `Seeded ${samples.length} clearly labelled fictional demonstration opportunities.`,
);
await prisma.$disconnect();
