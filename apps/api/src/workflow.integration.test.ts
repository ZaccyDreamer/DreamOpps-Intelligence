import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration("student and administrator workflows", () => {
  let server: Server;
  let baseUrl: string;
  let prisma: PrismaClient;
  let email: string;
  let slug: string;
  let opportunityId: string;
  let closeServerDatabase: () => Promise<void>;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
    });
    const module = await import("./server.js");
    const app = module.default;
    closeServerDatabase = module.closeDatabase;
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;

    const suffix = randomUUID();
    email = `workflow-${suffix}@example.test`;
    slug = `workflow-${suffix}`;
    const opportunity = await prisma.opportunity.create({
      data: {
        slug,
        title: "DreamOpps integration test opportunity",
        provider: "Fictional test provider",
        description:
          "A test-only opportunity record that is removed after the integration workflow.",
        category: "Scholarship",
        eligibleCountries: ["Kenya"],
        locations: ["Remote"],
        studyLevels: ["Undergraduate"],
        fields: ["Computer science"],
        applicationUrl: "https://example.test/apply",
        status: "PUBLISHED",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    opportunityId = opportunity.id;
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      if (opportunityId)
        await prisma.opportunity.deleteMany({ where: { id: opportunityId } });
      if (email) await prisma.user.deleteMany({ where: { email } });
      await prisma.$disconnect();
    }
    if (server)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    if (closeServerDatabase) await closeServerDatabase();
  });

  it("supports browse, account, profile, matching, save, tracker, and admin review", async () => {
    const badRegistration = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "invalid", name: "A", password: "short" }),
    });
    expect(badRegistration.status).toBe(400);

    const listingResponse = await fetch(
      `${baseUrl}/api/opportunities?q=integration&category=Scholarship&limit=1`,
    );
    expect(listingResponse.status).toBe(200);
    expect((await listingResponse.json()).items[0].slug).toBe(slug);
    const detailResponse = await fetch(`${baseUrl}/api/opportunities/${slug}`);
    expect((await detailResponse.json()).item.id).toBe(opportunityId);

    const anonymous = await fetch(`${baseUrl}/api/saved`);
    expect(anonymous.status).toBe(401);

    const registration = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email,
        password: "test-password-2026",
      }),
    });
    expect(registration.status).toBe(201);
    const student = (await registration.json()).user;
    expect(student.role).toBe("STUDENT");
    const studentCookie = registration.headers.get("set-cookie")?.split(";")[0];
    expect(studentCookie).toBeTruthy();
    const studentHeaders = { cookie: studentCookie! };

    const currentUser = await fetch(`${baseUrl}/api/auth/me`, {
      headers: studentHeaders,
    });
    expect((await currentUser.json()).user.id).toBe(student.id);
    const adminDenied = await fetch(`${baseUrl}/api/admin/opportunities`, {
      headers: studentHeaders,
    });
    expect(adminDenied.status).toBe(403);

    const profileResponse = await fetch(`${baseUrl}/api/profile`, {
      method: "PUT",
      headers: { ...studentHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        studyLevel: "Undergraduate",
        fieldOfStudy: "Computer science",
        country: "Kenya",
        nationality: "Kenya",
      }),
    });
    expect(profileResponse.status).toBe(200);
    const matchResponse = await fetch(
      `${baseUrl}/api/opportunities/${opportunityId}/match`,
      { headers: studentHeaders },
    );
    expect((await matchResponse.json()).match.eligibility).toBe("confirmed");

    const saveResponse = await fetch(`${baseUrl}/api/saved/${opportunityId}`, {
      method: "PUT",
      headers: studentHeaders,
    });
    expect(saveResponse.status).toBe(201);
    expect(
      (
        await (
          await fetch(`${baseUrl}/api/saved`, { headers: studentHeaders })
        ).json()
      ).items,
    ).toHaveLength(1);

    const application = await fetch(`${baseUrl}/api/applications`, {
      method: "POST",
      headers: { ...studentHeaders, "content-type": "application/json" },
      body: JSON.stringify({ opportunityId, status: "INTERESTED" }),
    });
    const applicationItem = (await application.json()).item;
    expect(application.status).toBe(201);
    const applicationUpdate = await fetch(
      `${baseUrl}/api/applications/${applicationItem.id}`,
      {
        method: "PATCH",
        headers: { ...studentHeaders, "content-type": "application/json" },
        body: JSON.stringify({ status: "APPLIED" }),
      },
    );
    expect((await applicationUpdate.json()).item.status).toBe("APPLIED");

    await prisma.user.update({
      where: { id: student.id },
      data: { role: "ADMIN" },
    });
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "test-password-2026" }),
    });
    expect(adminLogin.status).toBe(200);
    const adminCookie = adminLogin.headers.get("set-cookie")?.split(";")[0];
    const adminHeaders = { cookie: adminCookie! };
    const unsafeUrl = await fetch(`${baseUrl}/api/admin/opportunities`, {
      method: "POST",
      headers: { ...adminHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Unsafe URL test record",
        provider: "Test provider",
        slug: `unsafe-${randomUUID()}`,
        description: "This record tests rejection of executable application links.",
        category: "Scholarship",
        applicationUrl: "javascript:alert(1)",
      }),
    });
    expect(unsafeUrl.status).toBe(400);
    const editedOpportunity = await fetch(
      `${baseUrl}/api/admin/opportunities/${opportunityId}`,
      {
        method: "PUT",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({ provider: "Updated fictional provider" }),
      },
    );
    expect((await editedOpportunity.json()).item.provider).toBe(
      "Updated fictional provider",
    );
    const reviewQueue = await fetch(`${baseUrl}/api/admin/opportunities`, {
      headers: adminHeaders,
    });
    expect(reviewQueue.status).toBe(200);

    const verifyWithoutSource = await fetch(
      `${baseUrl}/api/admin/opportunities/${opportunityId}/status`,
      {
        method: "PATCH",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          verificationStatus: "VERIFIED",
          details: "Reviewed the page",
        }),
      },
    );
    expect(verifyWithoutSource.status).toBe(409);
    const sourceRecorded = await fetch(
      `${baseUrl}/api/admin/opportunities/${opportunityId}/source`,
      {
        method: "POST",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({
          url: "https://example.test/official-opportunity",
          name: "Test source",
          authorized: false,
        }),
      },
    );
    expect(sourceRecorded.status).toBe(201);
    const verifyWithoutNotes = await fetch(
      `${baseUrl}/api/admin/opportunities/${opportunityId}/status`,
      {
        method: "PATCH",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          verificationStatus: "VERIFIED",
        }),
      },
    );
    expect(verifyWithoutNotes.status).toBe(409);
    const verified = await fetch(
      `${baseUrl}/api/admin/opportunities/${opportunityId}/status`,
      {
        method: "PATCH",
        headers: { ...adminHeaders, "content-type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          verificationStatus: "VERIFIED",
          details: "Reviewed source eligibility and closing date",
        }),
      },
    );
    expect(verified.status).toBe(200);

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: adminHeaders,
    });
    expect(logout.status).toBe(204);
    const afterLogout = await fetch(`${baseUrl}/api/auth/me`, {
      headers: adminHeaders,
    });
    expect(afterLogout.status).toBe(401);

    const loginAgain = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "test-password-2026" }),
    });
    const deletionCookie = loginAgain.headers.get("set-cookie")?.split(";")[0];
    expect(loginAgain.status).toBe(200);
    const deletion = await fetch(`${baseUrl}/api/account`, {
      method: "DELETE",
      headers: { cookie: deletionCookie! },
    });
    expect(deletion.status).toBe(204);
  }, 30_000);
});
