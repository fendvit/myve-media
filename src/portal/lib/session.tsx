import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { db, supabase } from "./db";
import type { PortalProfile, PortalRole } from "./types";

interface PortalSessionValue {
  loading: boolean;
  session: Session | null;
  role: PortalRole | null;
  clientId: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const PortalSessionContext = createContext<PortalSessionValue | null>(null);

export function PortalSessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);

  async function loadProfile(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await db
      .from("portal_profiles")
      .select("user_id, role, client_id")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile((data as PortalProfile) ?? null);
  }

  useEffect(() => {
    let active = true;

    // onAuthStateChange fires synchronously with the stored session on mount,
    // so this also covers the "already logged in" path.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      // Deferred: calling back into supabase inside this callback can deadlock
      // the auth lock in supabase-js v2.
      setTimeout(async () => {
        if (!active) return;
        await loadProfile(nextSession?.user?.id);
        if (active) setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<PortalSessionValue>(
    () => ({
      loading,
      session,
      role: profile?.role ?? null,
      clientId: profile?.client_id ?? null,
      refresh: () => loadProfile(session?.user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [loading, session, profile],
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
