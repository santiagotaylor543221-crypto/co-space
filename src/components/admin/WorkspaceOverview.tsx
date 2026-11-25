"use client";

import { useRef, useState } from "react";
import { Plus, Search, X, Users, Pencil, Archive, RotateCcw, LayoutGrid, CheckCircle2, Armchair } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Skeleton from "@/components/ui/skeleton";
import WorkspaceImage from "@/components/workspace/workspace-image";
import { useI18n } from "@/lib/i18n";
import { workspaceLabels, type AdminWorkspace, type WorkspaceType } from "@/lib/workspace-schema";
import AdminDialog from "./AdminDialog";
import WorkspaceEditor from "./WorkspaceEditor";

export default function WorkspaceOverview({ workspaces, loading, onChanged }: {
  workspaces: AdminWorkspace[]; loading: boolean; onChanged: (workspace: AdminWorkspace) => void;
}) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("active");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("name");
  const [editor, setEditor] = useState<{ workspace: AdminWorkspace | null; key: number } | null>(null);
  const [selected, setSelected] = useState<AdminWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const locale = language === "es" ? "es-ES" : "en-GB";
  const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  const normalized = query.trim().toLocaleLowerCase(locale);
  const filtered = workspaces.filter((space) =>
    (state === "all" || space.isActive === (state === "active")) &&
    (type === "all" || space.type === type) &&
    (!normalized || (space.name + " " + space.description).toLocaleLowerCase(locale).includes(normalized)))
    .sort((a, b) => {
      if (sort === "capacity") return b.capacity - a.capacity || a.name.localeCompare(b.name, locale);
      if (sort === "price-low") return a.pricePerHour - b.pricePerHour || a.name.localeCompare(b.name, locale);
      if (sort === "price-high") return b.pricePerHour - a.pricePerHour || a.name.localeCompare(b.name, locale);
      return a.name.localeCompare(b.name, locale);
    });
  const active = workspaces.filter((space) => space.isActive);
  const metrics = [
    { label: "Espacios totales", value: workspaces.length, icon: LayoutGrid },
    { label: "Activos", value: active.length, icon: CheckCircle2 },
    { label: "Archivados", value: workspaces.length - active.length, icon: Archive },
    { label: "Capacidad activa", value: active.reduce((sum, space) => sum + space.capacity, 0), icon: Users },
  ];
  const reset = () => { setQuery(""); setState("all"); setType("all"); };
  const openEditor = (workspace: AdminWorkspace | null) => setEditor({ workspace, key: Date.now() });
  const toggle = async () => {
    if (!selected || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/workspaces/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !selected.isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar el espacio");
      onChanged(result);
      setNotice(t(selected.isActive ? "Espacio archivado." : "Espacio reactivado."));
      setSelected(null);
    } catch (err) { setError(err instanceof Error ? t(err.message) : t("No se pudo actualizar el espacio")); }
    finally { setBusy(false); busyRef.current = false; }
  };
  const control = "min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";
  return <section className="space-y-6">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => <Card key={label} className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-2"><span className="text-sm text-muted">{t(label)}</span><span className="rounded-xl bg-accent-soft p-2"><Icon size={18} aria-hidden="true" /></span></div>
        {loading ? <Skeleton className="h-8 w-16" /> : <p className="font-heading text-3xl font-semibold tabular-nums">{value}</p>}
      </Card>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="font-heading text-xl font-semibold">{t("Espacios de trabajo")}</h2><p className="mt-1 text-sm text-muted">{t("Los espacios archivados conservan su historial de reservas.")}</p></div>
      <Button type="button" disabled={loading} onClick={() => openEditor(null)} className="min-h-11"><Plus size={17} aria-hidden="true" />{t("Nuevo espacio")}</Button>
    </div>
    {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-success-soft p-4 text-sm text-success">{notice}<button type="button" onClick={() => setNotice("")} aria-label={t("Cerrar")} className="p-2"><X size={16} /></button></div>}
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <label className="text-xs font-medium text-muted">{t("Buscar espacios")}<span className="relative mt-1.5 block">
          <Search className="pointer-events-none absolute left-3 top-3 text-muted" size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Nombre o descripción...")} className={control + " w-full pl-10 pr-11"} />
          {query && <button type="button" aria-label={t("Limpiar búsqueda")} onClick={() => setQuery("")} className="absolute right-1 top-0.5 grid h-10 w-10 place-items-center"><X size={16} /></button>}
        </span></label>
        <label className="text-xs font-medium text-muted">{t("Estado")}<select value={state} onChange={(event) => setState(event.target.value)} className={control + " mt-1.5 w-full"}><option value="active">{t("Activos")}</option><option value="archived">{t("Archivados")}</option><option value="all">{t("Todos")}</option></select></label>
        <label className="text-xs font-medium text-muted">{t("Tipo")}<select value={type} onChange={(event) => setType(event.target.value)} className={control + " mt-1.5 w-full"}><option value="all">{t("Todos los tipos")}</option>{(Object.keys(workspaceLabels) as WorkspaceType[]).map((key) => <option key={key} value={key}>{t(workspaceLabels[key])}</option>)}</select></label>
        <label className="text-xs font-medium text-muted">{t("Ordenar por")}<select value={sort} onChange={(event) => setSort(event.target.value)} className={control + " mt-1.5 w-full"}><option value="name">{t("Nombre: A–Z")}</option><option value="capacity">{t("Mayor capacidad")}</option><option value="price-low">{t("Menor precio")}</option><option value="price-high">{t("Mayor precio")}</option></select></label>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
        <p role="status">{loading ? t("Cargando espacios...") : t("Mostrando {count} de {total} espacios").replace("{count}", String(filtered.length)).replace("{total}", String(workspaces.length))}</p>
        {(query || state !== "all" || type !== "all") && <button type="button" onClick={reset} className="min-h-10 font-medium text-ink underline underline-offset-4">{t("Limpiar filtros")}</button>}
      </div>
    </div>
    {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label={t("Cargando espacios...")}>{[1, 2, 3].map((number) => <Card key={number} className="overflow-hidden"><Skeleton className="aspect-[3/2] w-full" /><div className="space-y-3 p-5"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-16 w-full" /></div></Card>)}</div> :
      filtered.length === 0 ? <Card className="py-14 text-center"><LayoutGrid size={28} className="mx-auto mb-4 text-muted" aria-hidden="true" /><h3 className="font-heading text-lg font-semibold">{t(workspaces.length ? "No hay espacios con estos filtros." : "Crea tu primer espacio")}</h3><p className="mx-auto mt-2 max-w-md px-4 text-sm text-muted">{t(workspaces.length ? "Prueba con otro nombre, tipo o estado." : "Añade una imagen, capacidad y tarifa para empezar.")}</p><Button type="button" className="mt-5 min-h-11" variant="secondary" onClick={workspaces.length ? reset : () => openEditor(null)}>{t(workspaces.length ? "Limpiar filtros" : "Crear espacio")}</Button></Card> :
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((space) => <li key={space.id} className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-surface ${space.isActive ? "border-line" : "border-dashed border-line bg-background"}`}>
          <div className={space.isActive ? "" : "opacity-60 grayscale"}><WorkspaceImage imageUrl={space.imageUrl} type={space.type} alt={space.name} className="aspect-[3/2] w-full object-cover" /></div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{t(workspaceLabels[space.type])}</span><Badge variant={space.isActive ? "success" : "neutral"}>{t(space.isActive ? "Activo" : "Archivado")}</Badge></div>
            <h3 className="mt-3 break-words font-heading text-xl font-semibold">{space.name}</h3>
            <p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-muted">{space.description}</p>
            {!space.isActive && <p className="mt-3 text-xs text-muted">{t("No disponible para nuevas reservas")}</p>}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-sm"><span className="flex items-center gap-2 text-muted"><Users size={16} aria-hidden="true" />{space.capacity} {t(space.capacity === 1 ? "persona" : "personas")}</span><strong>{currency.format(space.pricePerHour)} <span className="text-xs font-normal text-muted">{t("/ hora")}</span></strong></div>
            <div className="mt-4 flex gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" onClick={() => openEditor(space)} aria-label={t("Editar espacio") + ": " + space.name} className="min-h-11 flex-1"><Pencil size={15} aria-hidden="true" />{t("Editar")}</Button><Button type="button" variant="ghost" onClick={() => { setError(""); setSelected(space); }} className="min-h-11 flex-1">{space.isActive ? <Archive size={15} aria-hidden="true" /> : <RotateCcw size={15} aria-hidden="true" />}{t(space.isActive ? "Archivar" : "Reactivar")}</Button></div>
          </div>
        </li>)}</ul>}
    {editor && <WorkspaceEditor key={editor.key} workspace={editor.workspace} onClose={() => setEditor(null)} onSaved={(space) => {
      onChanged(space);
      setNotice(t(editor.workspace ? "Espacio actualizado." : "Espacio creado."));
      // Keep a newly created or edited space visible even if current filters excluded it.
      setQuery(""); setState(space.isActive ? "active" : "archived"); setType("all");
    }} />}
    {selected && <AdminDialog title={t(selected.isActive ? "Archivar espacio" : "Reactivar espacio")} onClose={() => { if (!busyRef.current) setSelected(null); }} locked={busy}>
      <p className="break-words font-heading text-lg font-semibold">{selected.name}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t(selected.isActive ? "El espacio dejará de aceptar nuevas reservas. Las reservas existentes y su historial se conservarán; no se cancelarán automáticamente." : "El espacio volverá a aparecer en el catálogo y permitirá nuevas reservas.")}</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex justify-end gap-2"><Button type="button" autoFocus variant="secondary" disabled={busy} onClick={() => setSelected(null)} className="min-h-11">{t("Volver")}</Button><Button type="button" variant={selected.isActive ? "danger" : "primary"} disabled={busy} onClick={() => void toggle()} className="min-h-11">{t(busy ? "Guardando..." : selected.isActive ? "Archivar" : "Reactivar")}</Button></div>
    </AdminDialog>}
    <p className="flex items-center gap-2 text-xs text-muted"><Armchair size={15} aria-hidden="true" />{t("La capacidad activa suma las plazas de todos los espacios activos.")}</p>
  </section>;
}
