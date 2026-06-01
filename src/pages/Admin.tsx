import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, LogOut } from "lucide-react";
import ProjectsAdmin from "@/components/admin/ProjectsAdmin";
import TestimonialsAdmin from "@/components/admin/TestimonialsAdmin";
import PartnersAdmin from "@/components/admin/PartnersAdmin";
import Seo from "@/components/Seo";

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const [forgotMode, setForgotMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: "Chyba", description: error.message, variant: "destructive" });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Odesláno", description: "Odkaz pro reset hesla byl odeslán na váš email." });
      setForgotMode(false);
    }
  };

  if (!session) {
    if (forgotMode) {
      return (
        <>
          <Seo title="Reset hesla — MYVE Admin" description="Resetujte si heslo do administrace studia MYVE. Zadejte svůj email a obdržíte odkaz pro nastavení nového hesla." path="/admin" />
          <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <form onSubmit={handleForgotPassword} className="w-full max-w-sm space-y-4 bg-card p-8 rounded-3xl border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
              <h1 className="font-display text-2xl font-bold text-center mb-2">
                <span className="text-gradient">MYVE</span> Reset hesla
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-4">Zadejte email a pošleme vám odkaz pro reset hesla.</p>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
              <Button type="submit" className="w-full rounded-xl font-display" style={{ background: "var(--gradient-primary)" }}>
                Odeslat odkaz
              </Button>
              <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Zpět na přihlášení
              </button>
            </form>
          </div>
        </>
      );
    }

    return (
      <>
        <Seo title="Přihlášení — MYVE Admin" description="Přihlašovací stránka do administrace studia MYVE. Přístup mají pouze pověření správci obsahu." path="/admin" />
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 bg-card p-8 rounded-3xl border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
            <h1 className="font-display text-2xl font-bold text-center mb-6">
              <span className="text-gradient">MYVE</span> Admin
            </h1>
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
            <Input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl" />
            <Button type="submit" className="w-full rounded-xl font-display" style={{ background: "var(--gradient-primary)" }}>
              <LogIn className="w-4 h-4 mr-2" /> Přihlásit se
            </Button>
            <button type="button" onClick={() => setForgotMode(true)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Zapomenuté heslo?
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
    <Seo title="Administrace — MYVE" description="Interní administrační rozhraní studia MYVE pro správu portfolia, referencí a partnerů." path="/admin" />
    <div className="min-h-screen bg-background px-3 py-4 sm:p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6 gap-3">
          <h1 className="font-display text-xl sm:text-3xl font-bold truncate">
            <span className="text-gradient">MYVE</span> Admin
          </h1>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()} className="flex-shrink-0 rounded-xl">
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Odhlásit se</span>
          </Button>
        </div>

        <Tabs defaultValue="projects">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="projects" className="rounded-lg">Portfolio</TabsTrigger>
            <TabsTrigger value="testimonials" className="rounded-lg">Reference</TabsTrigger>
            <TabsTrigger value="partners" className="rounded-lg">Partneři</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectsAdmin />
          </TabsContent>
          <TabsContent value="testimonials">
            <TestimonialsAdmin />
          </TabsContent>
          <TabsContent value="partners">
            <PartnersAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
};

export default Admin;
