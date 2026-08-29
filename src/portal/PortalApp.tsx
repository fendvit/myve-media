import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Home, Loader2, MessageCircle, Phone, Sparkles, Users } from "lucide-react";
import CodeGate from "./components/CodeGate";
import Chat from "./components/Chat";
import PortalShell, { type NavItem } from "./components/PortalShell";
import AdminClient from "./pages/AdminClient";
import AdminHome from "./pages/AdminHome";
import AdminMcp from "./pages/AdminMcp";
import ClientContact from "./pages/ClientContact";
import ClientHome from "./pages/ClientHome";
import { db } from "./lib/db";
import { PortalSessionProvider, usePortalSession } from "./lib/session";
import { PortalThemeProvider } from "./lib/theme";
import { PortalUnreadProvider, usePortalUnread } from "./lib/unread";
import { onNotificationTap } from "./lib/push-native";
import type { PortalClient } from "./lib/types";

const CLIENT_NAV: Omit<NavItem, "badge">[] = [
  { to: "/", label: "Projekt", icon: Home, end: true },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/kontakt", label: "Kontakt", icon: Phone },
];

const ADMIN_NAV: Omit<NavItem, "badge">[] = [
  { to: "/admin", label: "Klienti", icon: Users, end: true },
  { to: "/admin/mcp", label: "Claude", icon: Sparkles },
];

function FullScreenLoader() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function ClientLayout({
  clientName,
  clientLogo,
  clientId,
}: {
  clientName: string;
  clientLogo: string | null;
  clientId: string;
}) {
  const { pathname } = useLocation();
  const { byClient } = usePortalUnread();
  const unread = byClient.get(clientId);

  const nav: NavItem[] = CLIENT_NAV.map((item) => ({
    ...item,
    badge:
      item.to === "/chat"
        ? unread?.unread_messages ?? 0
        : item.to === "/"
          ? unread?.unread_updates ?? 0
          : 0,
  }));

  return (
    <PortalShell
      title="MYVE"
      subtitle={clientName}
      logoUrl={clientLogo}
      nav={nav}
      fullBleed={pathname === "/chat"}
    >
      <Outlet />
    </PortalShell>
  );
}

function ClientChatRoute({ clientId }: { clientId: string }) {
  return <Chat clientId={clientId} as="client" />;
}

/**
 * Shown when the profile still points at a client the session can no longer
 * read — in practice, one that was archived while they were signed in.
 */
function AccessEnded() {
  const { signOut } = usePortalSession();

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <p className="font-display font-semibold">Přístup do portálu byl ukončen</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Pokud je to omylem, ozvěte se nám a hned to napravíme.
      </p>
      <button
        type="button"
        onClick={signOut}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        Odhlásit se
      </button>
    </div>
  );
}

function ClientRoutes({ clientId }: { clientId: string }) {
  // "revoked" and not just an empty name: archiving a client makes their own row
  // invisible to them (portal_my_client_id returns null for an archived client),
  // and so does every project and message. Without this the portal would still
  // open and simply look empty, which reads as a bug rather than as an ending.
  const [brand, setBrand] = useState<{
    status: "loading" | "ok" | "revoked";
    name: string;
    logo: string | null;
  }>({ status: "loading", name: "", logo: null });

  useEffect(() => {
    let active = true;
    db.from("portal_clients")
      .select("name, logo_url")
      .eq("id", clientId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        const row = data as Pick<PortalClient, "name" | "logo_url"> | null;
        // A failed request is not the same as a row that isn't there; only the
        // latter means access is gone. Offline should not read as "ended".
        if (!row) {
          setBrand({ status: error ? "loading" : "revoked", name: "", logo: null });
          return;
        }
        setBrand({ status: "ok", name: row.name, logo: row.logo_url });
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  if (brand.status === "revoked") return <AccessEnded />;

  return (
    <Routes>
      <Route
        element={
          <ClientLayout clientName={brand.name} clientLogo={brand.logo} clientId={clientId} />
        }
      >
        <Route index element={<ClientHome />} />
        <Route path="chat" element={<ClientChatRoute clientId={clientId} />} />
        <Route path="kontakt" element={<ClientContact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function AdminLayout() {
  const { pathname } = useLocation();
  const { totalMessages } = usePortalUnread();
  // The client detail screen hosts the chat, which manages its own scrolling.
  // /admin/mcp sits at the same depth but is an ordinary scrolling page.
  const isDetail = /^\/admin\/[^/]+$/.test(pathname) && pathname !== "/admin/mcp";

  // One badge for the whole roster — which client it is shows in the list. It
  // belongs to the client tab only; unread chat says nothing about MCP tokens.
  const nav: NavItem[] = ADMIN_NAV.map((item) => ({
    ...item,
    badge: item.to === "/admin" ? totalMessages : 0,
  }));

  return (
    <PortalShell title="MYVE" subtitle="Správa portálu" nav={nav} fullBleed={isDetail}>
      <Outlet />
    </PortalShell>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminHome />} />
        {/* Ahead of :clientId for readability; react-router ranks the static
            segment higher regardless of order, so "mcp" is never read as an id. */}
        <Route path="/admin/mcp" element={<AdminMcp />} />
        <Route path="/admin/:clientId" element={<AdminClient />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

function PortalRouter() {
  const { loading, session, role, clientId, profileError, refresh, signOut } =
    usePortalSession();

  if (loading) return <FullScreenLoader />;
  if (!session) return <CodeGate />;

  if (role === "admin") return <AdminRoutes />;
  if (role === "client" && clientId) return <ClientRoutes clientId={clientId} />;

  // Authenticated but unmapped — either an auth user created before this schema,
  // or the profile lookup failed. Those need different messages: the first is
  // "ask us for access", the second is "something broke, try again".
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <p className="font-display font-semibold">
        {profileError ? "Nepodařilo se načíst přístup" : "Účet zatím nemá přiřazený přístup"}
      </p>
      <p className="text-sm text-muted-foreground max-w-xs">
        {profileError ?? "Ozvěte se nám a přístup doplníme."}
      </p>

      {profileError && (
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-xl px-4 py-2 text-sm font-display text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          Zkusit znovu
        </button>
      )}

      <button
        type="button"
        onClick={signOut}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        Odhlásit se
      </button>
    </div>
  );
}

/**
 * Opens the screen a tapped notification refers to. Lives inside the router
 * because it needs useNavigate, and is inert on the web build — there the
 * service worker handles the click instead.
 */
function NativeNotificationRouting() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;

    void onNotificationTap((path) => navigate(path)).then((off) => {
      // The effect can be torn down before the listener finishes attaching.
      if (cancelled) off();
      else dispose = off;
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [navigate]);

  return null;
}

export default function PortalApp() {
  return (
    <PortalThemeProvider>
      <PortalSessionProvider>
        {/* Inside the session provider: the counts are per signed-in user. */}
        <PortalUnreadProvider>
          <BrowserRouter>
            <NativeNotificationRouting />
            <PortalRouter />
          </BrowserRouter>
        </PortalUnreadProvider>
      </PortalSessionProvider>
    </PortalThemeProvider>
  );
}
