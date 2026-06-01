import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, X, Save } from "lucide-react";
import ImageUpload from "./ImageUpload";
import RichTextEditor from "./RichTextEditor";

interface Step {
  title: string;
  description: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  tags: string;
  result_text: string;
  image_url: string;
  category: string;
  external_url: string;
  detailed_description: string;
  screenshots: string[];
  steps: Step[];
  slug: string;
}

interface ProjectFormProps {
  initialData?: ProjectFormData;
  onSubmit: (data: ProjectFormData) => void;
  onCancel?: () => void;
  isPending?: boolean;
  submitLabel: string;
}

const emptyForm: ProjectFormData = {
  title: "",
  description: "",
  tags: "",
  result_text: "",
  image_url: "",
  category: "web",
  external_url: "",
  detailed_description: "",
  screenshots: [],
  steps: [],
  slug: "",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const ProjectForm = ({ initialData, onSubmit, onCancel, isPending, submitLabel }: ProjectFormProps) => {
  const [form, setForm] = useState<ProjectFormData>(initialData || emptyForm);

  const handleTitleChange = (title: string) => {
    const newSlug = !initialData ? generateSlug(title) : form.slug;
    setForm({ ...form, title, slug: newSlug });
  };

  const addStep = () => {
    setForm({ ...form, steps: [...form.steps, { title: "", description: "" }] });
  };

  const updateStep = (index: number, field: keyof Step, value: string) => {
    const newSteps = [...form.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setForm({ ...form, steps: newSteps });
  };

  const removeStep = (index: number) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const addScreenshot = (url: string) => {
    if (url) setForm({ ...form, screenshots: [...form.screenshots, url] });
  };

  const removeScreenshot = (index: number) => {
    setForm({ ...form, screenshots: form.screenshots.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Název projektu"
        value={form.title}
        onChange={(e) => handleTitleChange(e.target.value)}
      />

      <Input
        placeholder="URL slug (automaticky z názvu)"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
      />

      <Textarea
        placeholder="Krátký popis projektu"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Detailní popis projektu (zobrazí se na stránce projektu)
        </label>
        <RichTextEditor
          value={form.detailed_description}
          onChange={(html) => setForm({ ...form, detailed_description: html })}
        />
      </div>

      <Input
        placeholder="Tagy (oddělené čárkou)"
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
      />

      <Textarea
        placeholder="Výsledky (každý na nový řádek, např.&#10;+120% návštěvnosti&#10;+50% konverzí)"
        value={form.result_text}
        onChange={(e) => setForm({ ...form, result_text: e.target.value })}
        rows={3}
      />

      <Input
        placeholder="Odkaz na web / aplikaci"
        value={form.external_url}
        onChange={(e) => setForm({ ...form, external_url: e.target.value })}
      />

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Kategorie:</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="web">Web</option>
          <option value="app">Aplikace</option>
        </select>
      </div>

      {/* Main image */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">Hlavní obrázek</label>
        <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
      </div>

      {/* Screenshots */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Galerie screenshotů ({form.screenshots.length})
        </label>
        {form.screenshots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {form.screenshots.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-full aspect-video object-cover rounded-lg border border-border" />
                <button
                  onClick={() => removeScreenshot(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageUpload value="" onChange={addScreenshot} />
      </div>

      {/* Steps */}
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          Kroky / postup ({form.steps.length})
        </label>
        {form.steps.map((step, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-1">
              {i + 1}
            </span>
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Název kroku"
                value={step.title}
                onChange={(e) => updateStep(i, "title", e.target.value)}
              />
              <Textarea
                placeholder="Popis kroku"
                value={step.description}
                onChange={(e) => updateStep(i, "description", e.target.value)}
                rows={2}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeStep(i)} className="mt-1 flex-shrink-0">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addStep} className="mt-1">
          <Plus className="w-3 h-3 mr-1" /> Přidat krok
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          onClick={() => onSubmit(form)}
          disabled={!form.title || !form.slug || isPending}
        >
          <Save className="w-4 h-4 mr-2" /> {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Zrušit
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectForm;
