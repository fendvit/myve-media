import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Chyba", description: "Hesla se neshodují.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Chyba", description: "Heslo musí mít alespoň 6 znaků.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Úspěch", description: "Heslo bylo úspěšně změněno." });
      navigate("/admin");
    }
  };

  if (!isRecovery) {
    return (
      <>
        <Seo title="Reset hesla — MYVE" description="Stránka pro nastavení nového hesla do administrace studia MYVE prostřednictvím odkazu z emailu." path="/reset-password" />
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-card p-8 rounded-3xl border border-border text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <h1 className="font-display text-2xl font-bold mb-4">
              <span className="text-gradient">MYVE</span> Reset hesla
            </h1>
            <p className="text-muted-foreground">
              Neplatný nebo expirovaný odkaz pro reset hesla. Zkuste to znovu z přihlašovací stránky.
            </p>
            <Button className="mt-6 rounded-xl" onClick={() => navigate("/admin")}>
              Zpět na přihlášení
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Nastavení nového hesla — MYVE" description="Zadejte nové heslo do administrace studia MYVE. Heslo musí mít alespoň 6 znaků." path="/reset-password" />
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <form onSubmit={handleReset} className="w-full max-w-sm space-y-4 bg-card p-8 rounded-3xl border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <h1 className="font-display text-2xl font-bold text-center mb-6">
            <span className="text-gradient">MYVE</span> Nové heslo
          </h1>
          <Input type="password" placeholder="Nové heslo" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl" />
          <Input type="password" placeholder="Potvrdit heslo" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="rounded-xl" />
          <Button type="submit" disabled={loading} className="w-full rounded-xl font-display" style={{ background: "var(--gradient-primary)" }}>
            <KeyRound className="w-4 h-4 mr-2" /> {loading ? "Ukládám..." : "Nastavit heslo"}
          </Button>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;
