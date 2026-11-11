import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { db, supabase } from "./db";
import { AUTH_STORAGE_KEY } from "@/integrations/supabase/client";
import { authStorage, isNative, storedSessionUserId } from "./authStorage";
import type { PortalProfile, PortalRole } from "./types";

interface PortalSessionValue {
  loading: boolean;
  session: Session | null;
  role: PortalRole | null;
  clientId: string | null;
  /** Set when the profile lookup itself failed, as opposed to finding no row. */
  profileError: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const PortalSessionContext = createContext<PortalSessionValue | null>(null);

/**
 * Last known profile, so a phone with no signal does not land on the login
 * screen. The access token lives an hour; opened later without signal, it
 * cannot refresh, getSession() returns no session and the app used to show
 * login although the stored login was still on the device and would work
 * again with signal. Only the role and client id are kept, never a token.
 */
const PROFILE_KEY = "myve.portal.lastProfile";

async function rememberProfile(profile: PortalProfile | null) {
  if (profile) await authStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => undefined);
}

async function rememberedProfile(): Promise<PortalProfile | null> {
  const userId = await storedSessionUserId(authStorage, AUTH_STORAGE_KEY);
  if (!userId) return null;
  try {
    const saved = JSON.parse((await authStorage.getItem(PROFILE_KEY)) ?? "null") as PortalProfile | null;
    return saved && saved.user_id === userId ? saved : null;
  } catch {
    return null;
  }
}

/** The stored session as-is (token possibly expired) — enough to render the shell offline. */
async function storedSession(): Promise<Session | null> {
  try {
    return JSON.parse((await authStorage.getItem(AUTH_STORAGE_KEY)) ?? "null") as Session | null;
  } catch {
    return null;
  }
}

export function PortalSessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  async function loadProfile(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await db
      .from("portal_profiles")
      .select("user_id, role, client_id")
      .eq("user_id", userId)
      .maybeSingle();

    // Distinguish "no row" from "the query failed": treating a failed lookup as
    // "no access" strands a legitimate admin on the fallback screen with no clue
    // why. Keep the last known profile and surface the error instead.
    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileError(null);
    setProfile((data as PortalProfile) ?? null);
    await rememberProfile((data as PortalProfile) ?? null);
  }

  useEffect(() => {
    let active = true;
    let waitingForSignal = false;

    // The initial check. A refresh that failed on the network leaves the
    // stored login in place (supabase-js only drops it on a real rejection),
    // so with a remembered profile we show the app and check again online.
    const check = async () => {
      waitingForSignal = false;
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session && error) {
        const [offlineSession, offlineProfile] = await Promise.all([storedSession(), rememberedProfile()]);
        if (!active) return;
        if (offlineSession && offlineProfile) {
          setSession(offlineSession);
          setProfile(offlineProfile);
          waitingForSignal = true;
          setLoading(false);
          return;
        }
      }
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      if (active) setLoading(false);
    };

    const onSignal = () => {
      if (waitingForSignal) void check();
    };
    window.addEventListener("online", onSignal);

    // Installed app: the WebView's refresh timer does not run in the
    // background, so stop it there and refresh right away on return
    // (Supabase's advice for mobile apps).
    let removeAppListener: (() => void) | null = null;
    if (isNative()) {
      void import("@capacitor/app").then(({ App }) =>
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            void supabase.auth.startAutoRefresh();
            onSignal();
          } else {
            void supabase.auth.stopAutoRefresh();
          }
        }).then((listener) => {
          if (active) removeAppListener = () => void listener.remove();
          else void listener.remove();
        }),
      );
    }

    // Later changes (sign-in, refresh, sign-out). INITIAL_SESSION is left to
    // check() above: offline it arrives as null and would show the login.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active || event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT") void authStorage.removeItem(PROFILE_KEY);
      waitingForSignal = false;
      setSession(nextSession);
      // Deferred: calling back into supabase inside this callback can deadlock
      // the auth lock in supabase-js v2.
      setTimeout(async () => {
        if (!active) return;
        await loadProfile(nextSession?.user?.id);
        if (active) setLoading(false);
      }, 0);
    });

    void check();

    return () => {
      active = false;
      window.removeEventListener("online", onSignal);
      removeAppListener?.();
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<PortalSessionValue>(
    () => ({
      loading,
      session,
      role: profile?.role ?? null,
      clientId: profile?.client_id ?? null,
      profileError,
      // Reads the session from the auth client rather than from `session` state.
      // Callers invoke this immediately after signing in, at which point the
      // state variable is still the pre-login value (null) — the closure would
      // capture that and look up a profile for `undefined`, wiping the profile
      // that onAuthStateChange is concurrently setting. Whichever write landed
      // last decided whether you got in.
      refresh: async () => {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        await loadProfile(data.session?.user?.id);
      },
      signOut: async () => {
        await authStorage.removeItem(PROFILE_KEY);
        await supabase.auth.signOut();
        setProfile(null);
        setProfileError(null);
      },
    }),
    [loading, session, profile, profileError],
  );

  return (
    <PortalSessionContext.Provider value={value}>{children}</PortalSessionContext.Provider>
  );
}

export function usePortalSession(): PortalSessionValue {
  const context = useContext(PortalSessionContext);
  if (!context) {
    throw new Error("usePortalSession must be used inside <PortalSessionProvider>");
  }
  return context;
}
