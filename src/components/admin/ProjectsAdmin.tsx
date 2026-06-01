import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, GripVertical, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProjectForm, { ProjectFormData } from "./ProjectForm";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  category: string;
  slug: string | null;
  sort_order: number | null;
  [key: string]: any;
};

interface SortableProjectRowProps {
  project: ProjectRow;
  isOnHomepage: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableProjectRow({ project, isOnHomepage, onEdit, onDelete }: SortableProjectRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-xl border p-3 sm:p-4 space-y-2 transition-colors ${
        isOnHomepage ? "border-primary/50" : "border-border opacity-90"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
          aria-label="Přesunout projekt"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-sm sm:text-base truncate">
              {project.title}
            </h3>
            {isOnHomepage && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3" />
                Na hlavní stránce
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {project.category === "app" ? "Aplikace" : "Web"}
            </span>
            {project.slug && (
              <span className="text-xs text-muted-foreground">/{project.slug}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(project.id)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(project.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 pl-7">{project.description}</p>
      {project.tags && project.tags.length > 0 && (
        <p className="text-primary text-xs pl-7">{project.tags.join(", ")}</p>
      )}
    </div>
  );
}

function ProjectsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderedProjects, setOrderedProjects] = useState<ProjectRow[]>([]);

  const { data: projects } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("sort_order");
      if (error) throw error;
      return data as ProjectRow[];
    },
  });

  // Sync local order with fetched data
  useEffect(() => {
    if (projects) setOrderedProjects(projects);
  }, [projects]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["all-projects"] });
  };

  const addMutation = useMutation({
    mutationFn: async (form: ProjectFormData) => {
      const { error } = await supabase.from("projects").insert({
        title: form.title,
        description: form.description || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        result_text: form.result_text || null,
        image_url: form.image_url || null,
        category: form.category,
        external_url: form.external_url || null,
        detailed_description: form.detailed_description || null,
        screenshots: form.screenshots.length > 0 ? form.screenshots : [],
        steps: form.steps.length > 0 ? JSON.parse(JSON.stringify(form.steps)) : [],
        slug: form.slug,
        sort_order: orderedProjects.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setShowAddForm(false);
      toast({ title: "Projekt přidán" });
    },
    onError: (e: any) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ProjectFormData }) => {
      const { error } = await supabase.from("projects").update({
        title: form.title,
        description: form.description || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        result_text: form.result_text || null,
        image_url: form.image_url || null,
        category: form.category,
        external_url: form.external_url || null,
        detailed_description: form.detailed_description || null,
        screenshots: form.screenshots.length > 0 ? form.screenshots : [],
        steps: form.steps.length > 0 ? JSON.parse(JSON.stringify(form.steps)) : [],
        slug: form.slug,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast({ title: "Projekt upraven" });
    },
    onError: (e: any) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Projekt smazán" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ordered: ProjectRow[]) => {
      // Batch update: each project gets its new index as sort_order
      await Promise.all(
        ordered.map((p, i) =>
          supabase.from("projects").update({ sort_order: i }).eq("id", p.id)
        )
      );
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Pořadí uloženo" });
    },
    onError: (e: any) => {
      toast({ title: "Chyba při ukládání pořadí", description: e.message, variant: "destructive" });
      invalidate(); // refetch to revert
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedProjects.findIndex((p) => p.id === active.id);
    const newIndex = orderedProjects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedProjects, oldIndex, newIndex);
    setOrderedProjects(newOrder); // instant feedback
    reorderMutation.mutate(newOrder);
  };

  const getEditData = (project: any): ProjectFormData => ({
    title: project.title || "",
    description: project.description || "",
    tags: project.tags ? project.tags.join(", ") : "",
    result_text: project.result_text || "",
    image_url: project.image_url || "",
    category: project.category || "web",
    external_url: project.external_url || "",
    detailed_description: project.detailed_description || "",
    screenshots: Array.isArray(project.screenshots) ? project.screenshots : [],
    steps: Array.isArray(project.steps)
      ? (project.steps as any[]).map((s: any) => ({ title: s.title || "", description: s.description || "" }))
      : [],
    slug: project.slug || "",
  });

  return (
    <div className="space-y-8">
      {/* Add form */}
      {showAddForm ? (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5" /> Přidat projekt
          </h2>
          <ProjectForm
            onSubmit={(data) => addMutation.mutate(data)}
            onCancel={() => setShowAddForm(false)}
            isPending={addMutation.isPending}
            submitLabel="Přidat projekt"
          />
        </div>
      ) : (
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Přidat projekt
        </Button>
      )}

      {/* Reorder hint */}
      {orderedProjects.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-foreground/80">
            <span className="font-semibold">Přetáhněte projekty</span> pomocí ikony{" "}
            <GripVertical className="inline w-3.5 h-3.5 -mt-0.5" /> pro změnu pořadí. První{" "}
            <span className="font-semibold text-primary">4 projekty</span> se zobrazí na hlavní stránce.
          </p>
        </div>
      )}

      {/* Project list with drag-and-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedProjects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {orderedProjects.map((project, index) =>
              editingId === project.id ? (
                <div key={project.id} className="bg-card rounded-2xl border border-primary/30 p-6">
                  <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
                    <Pencil className="w-5 h-5" /> Upravit: {project.title}
                  </h2>
                  <ProjectForm
                    initialData={getEditData(project)}
                    onSubmit={(data) => updateMutation.mutate({ id: project.id, form: data })}
                    onCancel={() => setEditingId(null)}
                    isPending={updateMutation.isPending}
                    submitLabel="Uložit změny"
                  />
                </div>
              ) : (
                <SortableProjectRow
                  key={project.id}
                  project={project}
                  isOnHomepage={index < 4}
                  onEdit={setEditingId}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default ProjectsAdmin;
