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
import { Home, Loader2, MessageCircle, Phone, Users } from "lucide-react";
import CodeGate from "./components/CodeGate";
import Chat from "./components/Chat";
import PortalShell, { type NavItem } from "./components/PortalShell";
import AdminClient from "./pages/AdminClient";
import AdminHome from "./pages/AdminHome";
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

// A single entry, but it keeps the desktop sidebar from being an empty column
// and gives the client detail screen a way back that isn't the browser button.
const ADMIN_NAV: Omit<NavItem, "badge">[] = [
  { to: "/admin", label: "Klienti", icon: Users, end: true },
];

function FullScreenLoader() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function ClientLayout({ clientName, clientId }: { clientName: string; clientId: string }) {
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

function ClientRoutes({ clientId }: { clientId: string }) {
  const [name, setName] = useState("");

  useEffect(() => {
    let active = true;
    db.from("portal_clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setName((data as Pick<PortalClient, "name">)?.name ?? "");
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  return (
    <Routes>
      <Route element={<ClientLayout clientName={name} clientId={clientId} />}>
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
  const isDetail = /^\/admin\/[^/]+$/.test(pathname);

  // One badge for the whole roster — which client it is shows in the list.
  const nav: NavItem[] = ADMIN_NAV.map((item) => ({ ...item, badge: totalMessages }));

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
