import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function TestimonialsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ author_name: "", author_role: "", content: "" });

  const { data: testimonials } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").insert({
        author_name: form.author_name,
        author_role: form.author_role || null,
        content: form.content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      setForm({ author_name: "", author_role: "", content: "" });
      toast({ title: "Reference přidána" });
    },
    onError: (e: any) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast({ title: "Reference smazána" });
    },
  });

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Přidat referenci
        </h2>
        <Input placeholder="Jméno autora" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
        <Input placeholder="Role (volitelné)" value={form.author_role} onChange={(e) => setForm({ ...form, author_role: e.target.value })} />
        <Textarea placeholder="Text reference" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <Button onClick={() => addMutation.mutate()} disabled={!form.author_name || !form.content || addMutation.isPending}>
          Přidat referenci
        </Button>
      </div>

      <div className="space-y-4">
        {testimonials?.map((t) => (
          <div key={t.id} className="bg-card rounded-xl border border-border p-3 sm:p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-sm sm:text-base">{t.author_name}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3">{t.content}</p>
            </div>
            <Button variant="destructive" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => deleteMutation.mutate(t.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestimonialsAdmin;
