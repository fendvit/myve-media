import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Home, Loader2, MessageCircle, Phone } from "lucide-react";
import CodeGate from "./components/CodeGate";
import Chat from "./components/Chat";
import PortalShell, { type NavItem } from "./components/PortalShell";
import AdminClient from "./pages/AdminClient";
import AdminHome from "./pages/AdminHome";
import ClientContact from "./pages/ClientContact";
import ClientHome from "./pages/ClientHome";
import { db } from "./lib/db";
import { PortalSessionProvider, usePortalSession } from "./lib/session";
import type { PortalClient } from "./lib/types";

const CLIENT_NAV: NavItem[] = [
  { to: "/", label: "Projekt", icon: Home, end: true },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/kontakt", label: "Kontakt", icon: Phone },
];

function FullScreenLoader() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function ClientLayout({ clientName }: { clientName: string }) {
  const { pathname } = useLocation();
  return (
    <PortalShell
      title="MYVE"
      subtitle={clientName}
      nav={CLIENT_NAV}
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
      <Route element={<ClientLayout clientName={name} />}>
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
  // The client detail screen hosts the chat, which manages its own scrolling.
  const isDetail = /^\/admin\/[^/]+$/.test(pathname);
  return (
    <PortalShell title="MYVE" subtitle="Správa portálu" nav={[]} fullBleed={isDetail}>
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

export default function PortalApp() {
  return (
    <PortalSessionProvider>
      <BrowserRouter>
        <PortalRouter />
      </BrowserRouter>
    </PortalSessionProvider>
  );
}
