import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

afterEach(cleanup);

describe("DreamOpps web app", () => {
  it("introduces the product and opportunity discovery", () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(screen.getByText(/Your next opportunity/i)).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: /Explore opportunities/i }).length,
    ).toBeGreaterThan(0);
  }, 15_000);

  it("does not treat a cached browser value as an authenticated session", async () => {
    localStorage.setItem(
      "dreamopps:user",
      JSON.stringify({ id: "old", email: "stale@example.test", role: "ADMIN" }),
    );
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(screen.getAllByRole("link", { name: "Log in" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "My space" })).toBeNull();
    localStorage.removeItem("dreamopps:user");
  });
});
