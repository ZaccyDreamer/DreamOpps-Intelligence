import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

let server: Server;
let baseUrl: string;
let closeDatabase: () => Promise<void>;
const databaseConfigured = Boolean(process.env.DATABASE_URL);

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  if (!databaseConfigured) delete process.env.DATABASE_URL;
  const module = await import("./server.js");
  const app = module.default;
  closeDatabase = module.closeDatabase;
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await closeDatabase();
});

describe("DreamOpps API readiness and errors", () => {
  it("reports database readiness honestly", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(databaseConfigured ? 200 : 503);
    expect(await response.json()).toMatchObject({
      status: databaseConfigured ? "ok" : "degraded",
      database: databaseConfigured ? "ok" : "unconfigured",
      service: "dreamopps-api",
    });
  });

  it("explains missing persistence or rejects an anonymous private request", async () => {
    const response = await fetch(`${baseUrl}/api/auth/me`);
    expect(response.status).toBe(databaseConfigured ? 401 : 503);
    expect(await response.json()).toMatchObject({
      error: {
        code: databaseConfigured ? "UNAUTHORIZED" : "DATABASE_UNAVAILABLE",
      },
    });
  });

  it("returns structured JSON for unknown API endpoints", async () => {
    const response = await fetch(`${baseUrl}/api/not-a-route`);
    expect(response.status).toBe(databaseConfigured ? 404 : 503);
    expect(await response.json()).toMatchObject({
      error: {
        code: databaseConfigured ? "NOT_FOUND" : "DATABASE_UNAVAILABLE",
      },
    });
  });
});
