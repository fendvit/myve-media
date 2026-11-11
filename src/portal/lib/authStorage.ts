import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/**
 * Where the login lives, so a client signs in once and never again.
 *
 * Web: localStorage, as before. Installed app: Capacitor Preferences
 * (SharedPreferences on Android, UserDefaults on iOS). A WebView's
 * localStorage is not durable storage — iOS in particular may purge it when
 * the phone runs low on space — and when it went, the client was logged out.
 *
 * Existing installs still have their session in localStorage. The first read
 * after the update moves it into Preferences, so nobody is logged out by the
 * switch itself.
 */

export interface TextStore {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/** localStorage that never throws (private mode, quota, disabled storage). */
export const webStore: TextStore = {
  getItem: async (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* the session then lasts only until the tab closes */
    }
  },
  removeItem: async (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to clean up */
    }
  },
};

const preferencesStore: TextStore = {
  getItem: async (key) => (await Preferences.get({ key })).value,
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
  },
};

/**
 * Durable store first, legacy store as a one-time fallback that is migrated on
 * read. Writes and removals go to both, so a stale legacy copy can never
 * resurrect a session after sign-out.
 */
export function migratingStore(durable: TextStore, legacy: TextStore): TextStore {
  return {
    getItem: async (key) => {
      const value = await durable.getItem(key);
      if (value !== null) return value;
      const old = await legacy.getItem(key);
      if (old !== null) {
        await durable.setItem(key, old);
        await legacy.removeItem(key);
      }
      return old;
    },
    setItem: async (key, value) => {
      await durable.setItem(key, value);
      await legacy.removeItem(key);
    },
    removeItem: async (key) => {
      await durable.removeItem(key);
      await legacy.removeItem(key);
    },
  };
}

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const authStorage: TextStore = isNative()
  ? migratingStore(preferencesStore, webStore)
  : webStore;

/** User id of the stored session if it still holds a refresh token, else null. */
export async function storedSessionUserId(store: TextStore, key: string): Promise<string | null> {
  const text = await store.getItem(key);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as { refresh_token?: unknown; user?: { id?: unknown } };
    if (typeof parsed.refresh_token !== "string" || !parsed.refresh_token) return null;
    return typeof parsed.user?.id === "string" ? parsed.user.id : null;
  } catch {
    return null;
  }
}
