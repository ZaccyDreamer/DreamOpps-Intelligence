import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Pool } from "pg";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { matchOpportunity } from "./matching.js";

const scrypt = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key as Buffer)),
    ),
  );
async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt$32768$8$1$${salt.toString("hex")}$${(await scrypt(password, salt)).toString("hex")}`;
}
async function verifyPassword(encoded: string, password: string) {
  const [algorithm, n, r, p, saltHex, hashHex] = encoded.split("$");
  if (
    algorithm !== "scrypt" ||
    n !== "32768" ||
    r !== "8" ||
    p !== "1" ||
    !saltHex ||
    !hashHex
  )
    return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== 64) return false;
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(expected, actual);
}

const app = express();
const port = Number(process.env.API_PORT || 4000);
const production = process.env.NODE_ENV === "production";
const origin = process.env.WEB_ORIGIN || "http://localhost:5173";
if (production && !process.env.DATABASE_URL)
  throw new Error("DATABASE_URL must be configured in production.");
if (
  production &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
)
  throw new Error(
    "SESSION_SECRET must be configured with at least 32 characters in production.",
  );
const dbPool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {},
);
const prisma = new PrismaClient({
  adapter: new PrismaPg(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {},
  ),
});
function presentOpportunity(item: any) {
  return {
    ...item,
    location: item.locations?.join(" · ") || "Location not specified",
    format:
      item.format === "IN_PERSON"
        ? "In person"
        : item.format === "HYBRID"
          ? "Hybrid"
          : "Remote",
    funding: item.fundingAmount
      ? `${item.fundingCurrency || ""} ${item.fundingAmount} · ${item.fundingType || ""}`.trim()
      : item.fundingType || "Not specified",
    deadline: item.deadline?.toISOString() || "",
    level: item.studyLevels || [],
    field: item.fields || [],
    source: item.sources?.[0]?.url || "No source recorded",
    checkedAt:
      item.lastSourceCheckAt?.toISOString().slice(0, 10) || "Not checked",
    demo: item.demo,
    status: item.status?.toLowerCase(),
  };
}
declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: "STUDENT" | "ADMIN";
  }
}
app.disable("x-powered-by");
app.set("trust proxy", production ? 1 : false);
app.use(helmet());
app.use(
  cors({
    origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("origin") &&
    req.get("origin") !== origin
  )
    return res.status(403).json({
      error: {
        code: "ORIGIN_REJECTED",
        message: "Request origin is not allowed.",
      },
    });
  next();
});
if (process.env.DATABASE_URL) {
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({
        pool: dbPool,
        createTableIfMissing: true,
        tableName: "http_sessions",
      }),
      name: "dreamopps.sid",
      secret:
        process.env.SESSION_SECRET || "development-only-secret-change-me-now",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.COOKIE_SECURE === "true" || production,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );
} else
  app.use(
    session({
      name: "dreamopps.sid",
      secret:
        process.env.SESSION_SECRET || "development-only-secret-change-me-now",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "strict",
        secure: production,
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  );
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Try again later.",
    },
  },
});
app.use("/api", (req, res, next) => {
  if (!process.env.DATABASE_URL && req.path !== "/health")
    return res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message:
          "The API database is not configured. Public demonstration browsing remains available.",
      },
    });
  next();
});
const routeParam = (req: Request, key: string): string => {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
};
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId)
    return res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Sign in required." } });
  next();
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId)
    return res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Sign in required." } });
  if (req.session.role !== "ADMIN")
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "Administrator access required." },
    });
  next();
}
function validate<T extends z.ZodTypeAny>(
  schema: T,
  source: "body" | "query" = "body",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success)
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the highlighted information.",
          issues: parsed.error.flatten(),
        },
      });
    (req as any)[source] = parsed.data;
    next();
  };
}
const registerSchema = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((x) => x.toLowerCase()),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(2).max(100),
});
const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((x) => x.toLowerCase()),
  password: z.string().min(1).max(128),
});
const profileSchema = z.object({
  studyLevel: z.string().max(60).nullable().optional(),
  fieldOfStudy: z.string().max(120).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  nationality: z.string().max(100).nullable().optional(),
  preferredCategories: z.array(z.string().max(60)).max(20).optional(),
  preferredLocations: z.array(z.string().max(100)).max(20).optional(),
  preferredFormats: z.array(z.string().max(30)).max(5).optional(),
  interests: z.array(z.string().max(80)).max(30).optional(),
  academicRequirements: z.record(z.string(), z.unknown()).optional(),
});
const webUrlSchema = z.string().url().refine(
  (value) => ["http:", "https:"].includes(new URL(value).protocol),
  "Use an HTTP or HTTPS URL.",
);
const opportunitySchema = z.object({
  title: z.string().min(3).max(200),
  provider: z.string().min(2).max(160),
  slug: z
    .string()
    .min(3)
    .max(220)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(20000),
  category: z.string().min(2).max(60),
  eligibleCountries: z.array(z.string().max(100)).max(300).default([]),
  locations: z.array(z.string().max(100)).max(50).default([]),
  studyLevels: z.array(z.string().max(60)).max(20).default([]),
  fields: z.array(z.string().max(80)).max(100).default([]),
  eligibility: z.record(z.string(), z.unknown()).optional(),
  requiredDocuments: z.array(z.string().max(150)).max(100).default([]),
  fundingAmount: z.number().nonnegative().optional(),
  fundingCurrency: z.string().length(3).optional(),
  fundingType: z.string().max(100).optional(),
  format: z.enum(["REMOTE", "HYBRID", "IN_PERSON"]).optional(),
  applicationUrl: webUrlSchema,
  deadline: z.string().datetime().nullable().optional(),
  deadlineTimezone: z.string().max(80).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"]).optional(),
  sourceCredibility: z.enum(["UNKNOWN", "COMMUNITY", "OFFICIAL"]).optional(),
  verificationStatus: z
    .enum(["UNCHECKED", "IN_REVIEW", "VERIFIED", "NEEDS_ATTENTION"])
    .optional(),
  demo: z.boolean().optional(),
});
app.get("/api/health", async (_req, res) => {
  let db: "ok" | "unconfigured" | "error" = "unconfigured";
  if (process.env.DATABASE_URL)
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } catch {
      db = "error";
    }
  res.status(db === "ok" ? 200 : 503).json({
    status: db === "ok" ? "ok" : "degraded",
    database: db,
    service: "dreamopps-api",
  });
});
app.post(
  "/api/auth/register",
  authLimit,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      const hash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          name,
          profile: { create: {} },
          preferences: { create: {} },
        },
        select: { id: true, email: true, name: true, role: true },
      });
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = user.id;
        req.session.role = "STUDENT";
        res.status(201).json({ user });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      )
        return res.status(409).json({
          error: {
            code: "EMAIL_EXISTS",
            message: "An account already uses this email.",
          },
        });
      next(e);
    }
  },
);
app.post(
  "/api/auth/login",
  authLimit,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: req.body.email },
      });
      if (
        !user ||
        !(await verifyPassword(user.passwordHash, req.body.password))
      )
        return res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email or password is incorrect.",
          },
        });
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = user.id;
        req.session.role = user.role;
        res.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });
      });
    } catch (e) {
      next(e);
    }
  },
);
app.post("/api/auth/logout", requireAuth, (req, res, next) =>
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("dreamopps.sid", {
      httpOnly: true,
      sameSite: "strict",
      secure: production,
    });
    res.status(204).end();
  }),
);
app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profile: true,
        preferences: true,
      },
    });
    if (!user) {
      req.session.destroy(() => {});
      return res
        .status(401)
        .json({ error: { code: "UNAUTHORIZED", message: "Session expired." } });
    }
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
app.get("/api/opportunities", async (req, res, next) => {
  try {
    const q = z
      .object({
        q: z.string().max(200).optional(),
        category: z.string().max(60).optional(),
        country: z.string().max(100).optional(),
        format: z.enum(["REMOTE", "HYBRID", "IN_PERSON"]).optional(),
        studyLevel: z.string().max(60).optional(),
        field: z.string().max(80).optional(),
        deadline: z.enum(["open", "expired", "any"]).default("open"),
        sort: z.enum(["deadline", "title", "newest"]).default("deadline"),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12),
      })
      .parse(req.query);
    const conditions: Prisma.OpportunityWhereInput[] = [
      {
        status: { in: q.deadline === "expired" ? ["EXPIRED"] : ["PUBLISHED"] },
      },
    ];
    if (q.deadline === "open")
      conditions.push({
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      });
    if (q.category)
      conditions.push({
        category: { equals: q.category, mode: "insensitive" },
      });
    if (q.format) conditions.push({ format: q.format });
    if (q.country)
      conditions.push({
        OR: [
          { eligibleCountries: { has: q.country } },
          { locations: { has: q.country } },
        ],
      });
    if (q.studyLevel) conditions.push({ studyLevels: { has: q.studyLevel } });
    if (q.field) conditions.push({ fields: { has: q.field } });
    if (q.q)
      conditions.push({
        OR: [
          { title: { contains: q.q, mode: "insensitive" } },
          { provider: { contains: q.q, mode: "insensitive" } },
          { description: { contains: q.q, mode: "insensitive" } },
        ],
      });
    const where: Prisma.OpportunityWhereInput = { AND: conditions };
    const [items, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy:
          q.sort === "title"
            ? { title: "asc" }
            : q.sort === "newest"
              ? { publishedAt: "desc" }
              : [{ deadline: "asc" }],
        include: { sources: true },
      }),
      prisma.opportunity.count({ where }),
    ]);
    res.json({
      items: items.map(presentOpportunity),
      total,
      page: q.page,
      limit: q.limit,
      pages: Math.ceil(total / q.limit),
    });
  } catch (e) {
    next(e);
  }
});
app.get("/api/opportunities/:slug", async (req, res, next) => {
  try {
    const item = await prisma.opportunity.findUnique({
      where: { slug: routeParam(req, "slug") },
      include: {
        sources: true,
        events: { orderBy: { checkedAt: "desc" }, take: 10 },
      },
    });
    if (!item || !["PUBLISHED", "EXPIRED"].includes(item.status))
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    res.json({ item: presentOpportunity(item) });
  } catch (e) {
    next(e);
  }
});
app.get("/api/profile", requireAuth, async (req, res, next) => {
  try {
    res.json({
      profile: await prisma.studentProfile.findUnique({
        where: { userId: req.session.userId },
      }),
    });
  } catch (e) {
    next(e);
  }
});
app.put(
  "/api/profile",
  requireAuth,
  validate(profileSchema),
  async (req, res, next) => {
    try {
      const profile = await prisma.studentProfile.upsert({
        where: { userId: req.session.userId! },
        create: { userId: req.session.userId!, ...req.body },
        update: req.body,
      });
      res.json({ profile });
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/opportunities/:id/match", requireAuth, async (req, res, next) => {
  try {
    const [profile, opportunity] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: req.session.userId },
      }),
      prisma.opportunity.findUnique({ where: { id: routeParam(req, "id") } }),
    ]);
    if (!opportunity)
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    const result = matchOpportunity(profile || {}, opportunity);
    res.json({ match: result });
  } catch (e) {
    next(e);
  }
});
app.get("/api/saved", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.savedOpportunity.findMany({
      where: { userId: req.session.userId },
      include: { opportunity: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
app.put("/api/saved/:opportunityId", requireAuth, async (req, res, next) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: routeParam(req, "opportunityId") },
      select: { id: true, status: true },
    });
    if (!opportunity || opportunity.status === "ARCHIVED")
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    const item = await prisma.savedOpportunity.upsert({
      where: {
        userId_opportunityId: {
          userId: req.session.userId!,
          opportunityId: opportunity.id,
        },
      },
      create: { userId: req.session.userId!, opportunityId: opportunity.id },
      update: {},
    });
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});
app.delete("/api/saved/:opportunityId", requireAuth, async (req, res, next) => {
  try {
    await prisma.savedOpportunity.deleteMany({
      where: {
        userId: req.session.userId,
        opportunityId: routeParam(req, "opportunityId"),
      },
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
const statuses = [
  "INTERESTED",
  "PREPARING",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "NOT_PROCEEDING",
] as const;
app.get("/api/applications", requireAuth, async (req, res, next) => {
  try {
    res.json({
      items: await prisma.application.findMany({
        where: { userId: req.session.userId },
        include: { opportunity: true },
        orderBy: { updatedAt: "desc" },
      }),
    });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/applications",
  requireAuth,
  validate(
    z.object({
      opportunityId: z.string().min(1),
      status: z.enum(statuses).default("INTERESTED"),
    }),
  ),
  async (req, res, next) => {
    try {
      const item = await prisma.application.upsert({
        where: {
          userId_opportunityId: {
            userId: req.session.userId!,
            opportunityId: req.body.opportunityId,
          },
        },
        create: {
          userId: req.session.userId!,
          ...req.body,
          appliedAt: req.body.status === "APPLIED" ? new Date() : undefined,
        },
        update: {
          status: req.body.status,
          appliedAt: req.body.status === "APPLIED" ? new Date() : undefined,
        },
      });
      res.status(201).json({ item });
    } catch (e) {
      next(e);
    }
  },
);
app.patch(
  "/api/applications/:id",
  requireAuth,
  validate(
    z.object({
      status: z.enum(statuses),
      notes: z.string().max(2000).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const result = await prisma.application.updateMany({
        where: { id: routeParam(req, "id"), userId: req.session.userId },
        data: {
          ...req.body,
          appliedAt: req.body.status === "APPLIED" ? new Date() : undefined,
        },
      });
      if (!result.count)
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "Application not found." },
        });
      res.json({
        item: await prisma.application.findUnique({
          where: { id: routeParam(req, "id") },
        }),
      });
    } catch (e) {
      next(e);
    }
  },
);
app.delete("/api/applications/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await prisma.application.deleteMany({
      where: { id: routeParam(req, "id"), userId: req.session.userId },
    });
    if (!result.count)
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Application not found." },
      });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
app.get("/api/recommendations", requireAuth, async (req, res, next) => {
  try {
    const [profile, items] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: req.session.userId },
      }),
      prisma.opportunity.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        },
        take: 100,
        include: { sources: true },
      }),
    ]);
    const matches = items
      .map((item) => ({
        item: presentOpportunity(item),
        match: matchOpportunity(profile || {}, item),
      }))
      .sort((a, b) => b.match.score - a.match.score);
    res.json({ items: matches });
  } catch (e) {
    next(e);
  }
});
app.get(
  "/api/notifications/preferences",
  requireAuth,
  async (req, res, next) => {
    try {
      res.json({
        preferences: await prisma.notificationPreference.findUnique({
          where: { userId: req.session.userId },
        }),
      });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/notifications/preferences",
  requireAuth,
  validate(
    z.object({
      deadlineReminders: z.boolean().optional(),
      recommendationUpdates: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      timezone: z.string().max(80).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const preferences = await prisma.notificationPreference.upsert({
        where: { userId: req.session.userId! },
        create: { userId: req.session.userId!, ...req.body },
        update: req.body,
      });
      res.json({ preferences });
    } catch (e) {
      next(e);
    }
  },
);
app.delete("/api/account", requireAuth, async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.session.userId } });
    req.session.destroy(() => {});
    res.clearCookie("dreamopps.sid");
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
app.get("/api/admin/opportunities", requireAdmin, async (_req, res, next) => {
  try {
    res.json({
      items: await prisma.opportunity.findMany({
        where: { status: { in: ["DRAFT", "PUBLISHED"] } },
        include: { sources: true, events: { orderBy: { checkedAt: "desc" } } },
        orderBy: { updatedAt: "desc" },
      }),
    });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/admin/opportunities",
  requireAdmin,
  validate(opportunitySchema),
  async (req, res, next) => {
    try {
      const { deadline, ...data } = req.body;
      const item = await prisma.opportunity.create({
        data: {
          ...data,
          deadline: deadline ? new Date(deadline) : undefined,
          sourceCredibility: "UNKNOWN",
          verificationStatus: "UNCHECKED",
        },
      });
      res.status(201).json({ item });
    } catch (e) {
      next(e);
    }
  },
);
app.put(
  "/api/admin/opportunities/:id",
  requireAdmin,
  validate(opportunitySchema.partial()),
  async (req, res, next) => {
    try {
      const { deadline, ...data } = req.body;
      const item = await prisma.opportunity.update({
        where: { id: routeParam(req, "id") },
        data: {
          ...data,
          ...(deadline === undefined
            ? {}
            : { deadline: deadline ? new Date(deadline) : null }),
        },
      });
      res.json({ item });
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  "/api/admin/opportunities/:id/source",
  requireAdmin,
  validate(
    z.object({
      url: webUrlSchema,
      name: z.string().max(160).optional(),
      authorized: z.boolean().default(false),
    }),
  ),
  async (req, res, next) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const source = await tx.opportunitySource.upsert({
          where: {
            opportunityId_url: {
              opportunityId: routeParam(req, "id"),
              url: req.body.url,
            },
          },
          create: {
            opportunityId: routeParam(req, "id"),
            ...req.body,
            lastAttemptAt: new Date(),
          },
          update: {
            ...req.body,
            lastAttemptAt: new Date(),
            failureReason: null,
          },
        });
        const event = await tx.verificationEvent.create({
          data: {
            opportunityId: routeParam(req, "id"),
            actorUserId: req.session.userId,
            action: "SOURCE_CHECK_RECORDED",
            details: { url: req.body.url, authorized: req.body.authorized },
          },
        });
        await tx.opportunity.update({
          where: { id: routeParam(req, "id") },
          data: {
            lastSourceCheckAt: new Date(),
            verificationStatus: "IN_REVIEW",
          },
        });
        return { source, event };
      });
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },
);
app.patch(
  "/api/admin/opportunities/:id/status",
  requireAdmin,
  validate(
    z.object({
      status: z.enum(["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"]),
      verificationStatus: z
        .enum(["UNCHECKED", "IN_REVIEW", "VERIFIED", "NEEDS_ATTENTION"])
        .optional(),
      sourceCredibility: z
        .enum(["UNKNOWN", "COMMUNITY", "OFFICIAL"])
        .optional(),
      details: z.string().max(2000).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      if (req.body.verificationStatus === "VERIFIED") {
        const source = await prisma.opportunitySource.findFirst({
          where: {
            opportunityId: routeParam(req, "id"),
            lastAttemptAt: { not: null },
          },
          select: { id: true },
        });
        if (!source || !req.body.details?.trim())
          return res.status(409).json({
            error: {
              code: "VERIFICATION_EVIDENCE_REQUIRED",
              message:
                "Record a source URL and specific review notes before marking this listing verified.",
            },
          });
      }
      const result = await prisma.$transaction(async (tx) => {
        const data: Prisma.OpportunityUpdateInput = {
          status: req.body.status,
          ...(req.body.verificationStatus
            ? { verificationStatus: req.body.verificationStatus }
            : {}),
          ...(req.body.sourceCredibility
            ? { sourceCredibility: req.body.sourceCredibility }
            : {}),
        };
        if (data.status === "PUBLISHED") data["publishedAt"] = new Date();
        const item = await tx.opportunity.update({
          where: { id: routeParam(req, "id") },
          data,
        });
        const event = await tx.verificationEvent.create({
          data: {
            opportunityId: item.id,
            actorUserId: req.session.userId,
            action: "STATUS_UPDATED",
            details: {
              status: req.body.status,
              verificationStatus: req.body.verificationStatus,
              details: req.body.details,
            },
          },
        });
        return { item, event };
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);
app.get(
  "/api/admin/opportunities/:id/history",
  requireAdmin,
  async (req, res, next) => {
    try {
      res.json({
        items: await prisma.verificationEvent.findMany({
          where: { opportunityId: routeParam(req, "id") },
          orderBy: { checkedAt: "desc" },
        }),
      });
    } catch (e) {
      next(e);
    }
  },
);
app.use("/api", (_req, res) =>
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "API endpoint not found." },
  }),
);
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(
    "API error:",
    err instanceof Error ? err.message : "unknown error",
  );
  if (err instanceof z.ZodError)
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request." },
    });
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025")
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Record not found." } });
    if (err.code === "P2002")
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "A record with those details already exists.",
        },
      });
  }
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
  });
});
export default app;
export async function closeDatabase() {
  await Promise.all([prisma.$disconnect(), dbPool.end()]);
}
if (process.env.NODE_ENV !== "test")
  app.listen(port, "0.0.0.0", () =>
    console.log(`DreamOpps API listening on ${port}`),
  );
