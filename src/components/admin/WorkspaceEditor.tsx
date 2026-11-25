"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Armchair, Users, Mic, Upload, ImagePlus } from "lucide-react";
import Image from "next/image";
import AdminDialog from "./AdminDialog";
import Button from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { workspaceSchema, workspaceImages, workspaceLabels, type AdminWorkspace, type WorkspaceType, type WorkspaceInput } from "@/lib/workspace-schema";

type Draft = Omit<WorkspaceInput, "capacity" | "pricePerHour"> & { capacity: string; pricePerHour: string };
type Errors = Partial<Record<keyof Draft, string[]>>;
const input = "mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent aria-invalid:border-danger";
const icons = { DESK: Armchair, MEETING_ROOM: Users, BOOTH: Mic };
const hints = { DESK: "Trabajo individual y flexible", MEETING_ROOM: "Reuniones y trabajo en equipo", BOOTH: "Llamadas y concentración" };
function makeDraft(space: AdminWorkspace | null): Draft {
  return space ? { name: space.name, description: space.description, type: space.type, capacity: String(space.capacity), pricePerHour: String(space.pricePerHour), imageUrl: space.imageUrl } :
    { name: "", description: "", type: "DESK", capacity: "1", pricePerHour: "15", imageUrl: workspaceImages("DESK")[0] };
}

export default function WorkspaceEditor({ workspace, onClose, onSaved }: {
  workspace: AdminWorkspace | null; onClose: () => void; onSaved: (space: AdminWorkspace) => void;
}) {
  const { t, language } = useI18n();
  const [draft, setDraft] = useState(() => makeDraft(workspace));
  const [baseline, setBaseline] = useState(() => JSON.stringify(makeDraft(workspace)));
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [failedImage, setFailedImage] = useState("");
  const [discard, setDiscard] = useState(false);
  const [keepSettings, setKeepSettings] = useState(true);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const uploadCache = useRef<{ file: File; url: string } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const dirty = Boolean(file) || JSON.stringify(draft) !== baseline;
  const currency = new Intl.NumberFormat(language === "es" ? "es-ES" : "en-GB", { style: "currency", currency: "EUR" });

  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
  }, [filePreview]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice("");
  };
  const selectPhoto = (photo?: File) => {
    if (!photo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 5 * 1024 * 1024 || photo.size === 0) {
      setErrors((current) => ({ ...current, imageUrl: ["Usa JPG, PNG o WebP de hasta 5 MB."] })); return;
    }
    setFile(photo); setFilePreview(URL.createObjectURL(photo)); setErrors((current) => ({ ...current, imageUrl: undefined })); setError("");
  };
  const requestClose = () => { if (busy.current) return; if (dirty) setDiscard(true); else onClose(); };
  const fieldError = (key: keyof Draft) => errors[key] ? <p id={`workspace-${key}-error`} className="mt-1.5 text-xs text-danger">{errors[key]?.map(t).join(" ")}</p> : null;
  const invalidProps = (key: keyof Draft) => ({ "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `workspace-${key}-error` : undefined });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    const another = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "another";
    setError(""); setNotice("");
    const parsed = workspaceSchema.safeParse({ ...draft, capacity: Number(draft.capacity), pricePerHour: Number(draft.pricePerHour), imageUrl: file ? "/pending-photo.webp" : draft.imageUrl });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setError(t("Revisa los campos señalados."));
      return;
    }
    busy.current = true; setSaving(true);
    try {
      let imageUrl = parsed.data.imageUrl;
      if (file) {
        if (uploadCache.current?.file === file) imageUrl = uploadCache.current.url;
        else {
          const response = await fetch("/api/admin/workspace-images", { method: "POST", headers: { "Content-Type": file.type }, body: file });
          const result = await response.json();
          if (!response.ok) { setErrors({ imageUrl: [result.error || "No se pudo subir la foto."] }); throw new Error(result.error || "No se pudo subir la foto."); }
          imageUrl = result.imageUrl;
          uploadCache.current = { file, url: imageUrl };
        }
      }
      const response = await fetch(workspace ? `/api/admin/workspaces/${workspace.id}` : "/api/admin/workspaces", {
        method: workspace ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...parsed.data, imageUrl }),
      });
      const result = await response.json();
      if (!response.ok) { setErrors(result.fieldErrors || {}); throw new Error(result.error || "No se pudo guardar el espacio"); }
      onSaved(result as AdminWorkspace);
      if (another && !workspace) {
        const next = makeDraft(null);
        if (keepSettings) { next.type = draft.type; next.capacity = draft.capacity; next.pricePerHour = draft.pricePerHour; next.imageUrl = workspaceImages(draft.type)[0]; }
        setBaseline(JSON.stringify(next));
        setDraft(next); setFile(null); setFilePreview(""); setErrors({}); uploadCache.current = null;
        setNotice(t("Espacio creado. Puedes añadir el siguiente.")); nameRef.current?.focus();
      } else onClose();
    } catch (err) { setError(err instanceof Error ? t(err.message) : t("No se pudo guardar el espacio")); }
    finally { busy.current = false; setSaving(false); }
  };
  const candidate = file ? filePreview : draft.imageUrl;
  const previewUrl = candidate && (candidate.startsWith("blob:") || workspaceSchema.shape.imageUrl.safeParse(candidate).success) ? candidate : workspaceImages(draft.type)[0];
  const shownImage = failedImage === previewUrl ? workspaceImages(draft.type)[0] : previewUrl;

  return <AdminDialog wide title={t(workspace ? "Editar espacio" : "Crear espacio")} onClose={requestClose} locked={saving}>
    <form onSubmit={submit} noValidate aria-busy={saving}>
      {error && <p role="alert" className="mb-5 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl bg-success-soft p-3 text-sm text-success">{notice}</p>}
      <div className="grid gap-7 lg:grid-cols-[1.35fr_1fr]">
        <fieldset disabled={saving} className="min-w-0 space-y-6">
          <section className="space-y-4">
            <h3 className="font-heading text-lg font-semibold">{t("Información del espacio")}</h3>
            <label className="block text-sm font-medium">{t("Nombre")}<input ref={nameRef} autoFocus value={draft.name} maxLength={120} placeholder={t("Ej.: Sala Horizonte")} onChange={(event) => update("name", event.target.value)} className={input} {...invalidProps("name")} />{fieldError("name")}</label>
            <label className="block text-sm font-medium">{t("Descripción")}<textarea rows={3} maxLength={2000} value={draft.description} placeholder={t("Describe el ambiente, el equipamiento y para qué actividades es ideal.")} onChange={(event) => update("description", event.target.value)} className={input} {...invalidProps("description")} />{fieldError("description")}</label>
            <fieldset><legend className="mb-2 text-sm font-medium">{t("Tipo de espacio")}</legend><div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(workspaceLabels) as WorkspaceType[]).map((type) => { const Icon = icons[type]; return <label key={type} className={`cursor-pointer rounded-xl border p-3 has-focus-visible:ring-2 has-focus-visible:ring-accent ${draft.type === type ? "border-accent bg-accent-soft" : "border-line"}`}>
                <input className="sr-only" type="radio" name="workspace-type" value={type} checked={draft.type === type} onChange={() => {
                  const generic = draft.imageUrl.startsWith("/images/");
                  update("type", type);
                  if (generic && !file) update("imageUrl", workspaceImages(type)[0]);
                }} /><Icon size={20} aria-hidden="true" /><span className="mt-2 block text-sm font-semibold">{t(workspaceLabels[type])}</span><span className="mt-1 block text-xs text-muted">{t(hints[type])}</span>
              </label>; })}
            </div>{fieldError("type")}</fieldset>
          </section>
          <section><h3 className="mb-4 font-heading text-lg font-semibold">{t("Capacidad y tarifa")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">{t("Capacidad")}<input type="number" min="1" max="10000" step="1" value={draft.capacity} onChange={(event) => update("capacity", event.target.value)} className={input} {...invalidProps("capacity")} /><span className="mt-1 block text-xs text-muted">{t("Número máximo de personas")}</span>{fieldError("capacity")}</label>
              <label className="text-sm font-medium">{t("Precio por hora (€)")}<input type="number" min="0.01" max="100000" step="0.01" value={draft.pricePerHour} onChange={(event) => update("pricePerHour", event.target.value)} className={input} {...invalidProps("pricePerHour")} /><span className="mt-1 block text-xs text-muted">{t("Ej.: 15,00 € por hora")}</span>{fieldError("pricePerHour")}</label>
            </div>
          </section>
          <section><h3 className="mb-2 font-heading text-lg font-semibold">{t("Imagen del espacio")}</h3><p className="mb-3 text-xs text-muted">{t("Elige una ilustración o sube tu propia foto.")}</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("Ilustraciones disponibles")}>
              {workspaceImages(draft.type).map((url, index) => <button key={url} type="button" aria-pressed={!file && draft.imageUrl === url} aria-label={t("Ilustración {number}").replace("{number}", String(index + 1))} className={`overflow-hidden rounded-xl border-2 ${!file && draft.imageUrl === url ? "border-accent" : "border-line"}`} onClick={() => { setFile(null); update("imageUrl", url); }}>
                <Image src={url} alt="" width={160} height={110} className="aspect-[3/2] w-full object-cover" />
              </button>)}
            </div>
            <label onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!saving) selectPhoto(event.dataTransfer.files[0]); }}
              className={`mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 text-center focus-within:ring-2 focus-within:ring-accent ${dragging ? "border-accent bg-accent-soft" : "border-line bg-background"}`}>
              <Upload size={22} aria-hidden="true" /><span className="text-sm font-medium">{file ? file.name : t("Arrastra una foto o selecciónala")}</span><span className="text-xs text-muted">{t("JPG, PNG o WebP · Máximo 5 MB")}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { selectPhoto(event.target.files?.[0]); event.target.value = ""; }} aria-label={t("Subir foto")} {...invalidProps("imageUrl")} />
            </label>{fieldError("imageUrl")}
            <details className="mt-3 text-xs text-muted"><summary className="cursor-pointer">{t("Usar una ruta o URL existente")}</summary><label className="mt-2 block">{t("Ruta de imagen")}<input value={draft.imageUrl} onChange={(event) => { setFile(null); update("imageUrl", event.target.value); }} className={input} {...invalidProps("imageUrl")} /></label></details>
          </section>
        </fieldset>
        <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted"><ImagePlus size={17} aria-hidden="true" />{t("Vista previa")}</p>
          <div className="overflow-hidden rounded-2xl border border-line bg-background">
            <Image src={shownImage} alt={draft.name || t("Vista previa")} unoptimized width={600} height={400} className="aspect-[3/2] w-full object-cover" onError={() => setFailedImage(previewUrl)} />
            <div className="space-y-3 p-5"><span className="text-xs text-muted">{t(workspaceLabels[draft.type])}</span><h3 className="break-words font-heading text-xl font-semibold">{draft.name || t("Nombre del espacio")}</h3><p className="whitespace-pre-wrap break-words text-sm text-muted">{draft.description || t("La descripción aparecerá aquí.")}</p><div className="flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-sm"><span>{draft.capacity || "—"} {t("personas")}</span><strong>{Number.isFinite(Number(draft.pricePerHour)) ? currency.format(Number(draft.pricePerHour)) : "—"} {t("/ hora")}</strong></div></div>
          </div>
          {failedImage === previewUrl && <p role="status" className="mt-2 text-xs text-warning">{t("No se pudo cargar la imagen. Se muestra una ilustración alternativa.")}</p>}
        </aside>
      </div>
      <footer className="sticky -bottom-7 mt-6 border-t border-line bg-surface py-4">
        {!workspace && <label className="mb-4 flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={keepSettings} disabled={saving} onChange={(event) => setKeepSettings(event.target.checked)} />{t("Conservar tipo, capacidad y tarifa al añadir otro")}</label>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={requestClose} disabled={saving} className="order-1 min-h-11">{t("Cancelar")}</Button>
          <Button type="submit" name="action" value="save" disabled={saving} className="order-3 min-h-11">{t(saving ? "Guardando..." : workspace ? "Guardar cambios" : "Crear espacio")}</Button>
          {!workspace && <Button type="submit" name="action" value="another" variant="secondary" disabled={saving} className="order-2 min-h-11">{t("Crear y añadir otro")}</Button>}
        </div>
      </footer>
    </form>
    {discard && <AdminDialog title={t("¿Descartar los cambios?")} onClose={() => setDiscard(false)}>
      <p className="text-sm text-muted">{t("Tienes cambios sin guardar en este espacio.")}</p>
      <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" autoFocus onClick={() => setDiscard(false)}>{t("Seguir editando")}</Button><Button type="button" variant="danger" onClick={onClose}>{t("Descartar cambios")}</Button></div>
    </AdminDialog>}
  </AdminDialog>;
}
