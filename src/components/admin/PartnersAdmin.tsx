import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, GripVertical, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function PartnersAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", logo_url: "", project_id: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", logo_url: "", project_id: "" });

  const { data: logos } = useQuery({
    queryKey: ["admin-partner-logos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_logos")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["admin-projects-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("partner_logos").insert({
        name: form.name,
        logo_url: form.logo_url,
        project_id: form.project_id || null,
        sort_order: (logos?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-logos"] });
      queryClient.invalidateQueries({ queryKey: ["partner-logos"] });
      setForm({ name: "", logo_url: "", project_id: "" });
      toast({ title: "Logo přidáno" });
    },
    onError: (e: any) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; logo_url: string; project_id: string | null } }) => {
      const { error } = await supabase.from("partner_logos").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-logos"] });
      queryClient.invalidateQueries({ queryKey: ["partner-logos"] });
      setEditingId(null);
      toast({ title: "Logo aktualizováno" });
    },
    onError: (e: any) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_logos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-logos"] });
      queryClient.invalidateQueries({ queryKey: ["partner-logos"] });
      toast({ title: "Logo smazáno" });
    },
  });

  const startEdit = (logo: any) => {
    setEditingId(logo.id);
    setEditForm({
      name: logo.name,
      logo_url: logo.logo_url,
      project_id: logo.project_id || "",
    });
  };

  const getProjectTitle = (projectId: string | null) => {
    if (!projectId || !projects) return null;
    return projects.find((p) => p.id === projectId)?.title || null;
  };

  const ProjectSelect = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (val: string) => void;
  }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Propojit s projektem (volitelné)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Žádný projekt</SelectItem>
        {projects?.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Přidat logo partnera
        </h2>
        <Input
          placeholder="Název firmy"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <ImageUpload
          value={form.logo_url}
          onChange={(url) => setForm({ ...form, logo_url: url })}
        />
        <ProjectSelect
          value={form.project_id}
          onChange={(val) => setForm({ ...form, project_id: val === "none" ? "" : val })}
        />
        <Button
          onClick={() => addMutation.mutate()}
          disabled={!form.name || !form.logo_url || addMutation.isPending}
        >
          Přidat logo
        </Button>
      </div>

      <div className="space-y-4">
        {logos?.map((logo) => (
          <div key={logo.id} className="bg-card rounded-xl border border-border p-3 sm:p-4">
            {editingId === logo.id ? (
              <div className="space-y-3">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Název"
                />
                <ImageUpload
                  value={editForm.logo_url}
                  onChange={(url) => setEditForm({ ...editForm, logo_url: url })}
                />
                <ProjectSelect
                  value={editForm.project_id}
                  onChange={(val) => setEditForm({ ...editForm, project_id: val === "none" ? "" : val })}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: logo.id,
                        data: {
                          ...editForm,
                          project_id: editForm.project_id || null,
                        },
                      })
                    }
                    disabled={updateMutation.isPending}
                  >
                    Uložit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Zrušit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {logo.logo_url && (
                    <img
                      src={logo.logo_url}
                      alt={logo.name}
                      className="h-8 w-auto object-contain flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-display font-medium text-sm truncate">{logo.name}</span>
                    {getProjectTitle(logo.project_id) && (
                      <span className="text-xs text-muted-foreground truncate">
                        → {getProjectTitle(logo.project_id)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(logo)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(logo.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PartnersAdmin;
