import { describe, expect, it } from "vitest";
import { migratingStore, storedSessionUserId, type TextStore } from "@/portal/lib/authStorage";

// The login must survive app updates and phones without signal: a client
// signs in once and never again.

function memory(initial: Record<string, string> = {}): TextStore & { map: Map<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: async (k) => map.get(k) ?? null,
    setItem: async (k, v) => void map.set(k, v),
    removeItem: async (k) => void map.delete(k),
  };
}

const KEY = "sb-test-auth-token";
const session = (id: string) => JSON.stringify({ access_token: "a", refresh_token: "r", user: { id } });

describe("migratingStore", () => {
  it("moves an existing localStorage login into durable storage on first read", async () => {
    const durable = memory();
    const legacy = memory({ [KEY]: session("u1") });
    const store = migratingStore(durable, legacy);
    expect(await store.getItem(KEY)).toBe(session("u1"));
    expect(durable.map.get(KEY)).toBe(session("u1"));
    expect(legacy.map.has(KEY)).toBe(false);
  });

  it("prefers durable storage", async () => {
    const store = migratingStore(memory({ [KEY]: session("new") }), memory({ [KEY]: session("old") }));
    expect(await store.getItem(KEY)).toBe(session("new"));
  });

  it("sign-out clears both, so an old copy cannot bring the session back", async () => {
    const durable = memory({ [KEY]: session("u1") });
    const legacy = memory({ [KEY]: session("u1") });
    const store = migratingStore(durable, legacy);
    await store.removeItem(KEY);
    expect(await store.getItem(KEY)).toBeNull();
  });
});

describe("storedSessionUserId", () => {
  it("reads the user of a stored login with a refresh token", async () => {
    expect(await storedSessionUserId(memory({ [KEY]: session("u1") }), KEY)).toBe("u1");
  });

  it("ignores a missing refresh token or broken JSON", async () => {
    expect(await storedSessionUserId(memory({ [KEY]: JSON.stringify({ user: { id: "u1" } }) }), KEY)).toBeNull();
    expect(await storedSessionUserId(memory({ [KEY]: "{broken" }), KEY)).toBeNull();
    expect(await storedSessionUserId(memory(), KEY)).toBeNull();
  });
});
