"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, CalendarClock, Timer, Search, X, Plus, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Skeleton from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

export interface AdminBooking {
  id: string;
  userId: string;
  workspaceId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  workspace: { id: string; name: string };
  user: { name: string; email: string };
}

type Period = "all" | "today" | "tomorrow" | "week" | "custom";
const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const nextDay = (date: Date, days = 1) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

function overlaps(booking: AdminBooking, start: Date, end: Date) {
  return new Date(booking.startTime) < end && new Date(booking.endTime) > start;
}

export default function BookingOverview({ bookings, loading, canCreate, onCreate, onEdit, onCancel }: {
  bookings: AdminBooking[];
  loading: boolean;
  canCreate: boolean;
  onCreate: () => void;
  onEdit: (booking: AdminBooking) => void;
  onCancel: (id: string) => Promise<boolean>;
}) {
  const { t, language } = useI18n();
  const [now, setNow] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);

  const locale = language === "es" ? "es-ES" : "en-GB";
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  const today = dayStart(now ?? new Date(0));
  const tomorrow = nextDay(today);
  const weekStart = nextDay(today, -((today.getDay() + 6) % 7));
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  if (period === "today") { rangeStart = today; rangeEnd = tomorrow; }
  if (period === "tomorrow") { rangeStart = tomorrow; rangeEnd = nextDay(tomorrow); }
  if (period === "week") { rangeStart = weekStart; rangeEnd = nextDay(weekStart, 7); }
  if (period === "custom") {
    rangeStart = from ? new Date(from + "T00:00:00") : null;
    rangeEnd = to ? nextDay(new Date(to + "T00:00:00")) : null;
  }
  const invalidRange = Boolean(period === "custom" && from && to && from > to);
  const normalized = query.trim().toLocaleLowerCase(locale);
  const filtered = invalidRange ? [] : bookings.filter((booking) =>
    (!normalized || [booking.user.name, booking.user.email, booking.workspace.name].some((value) => value.toLocaleLowerCase(locale).includes(normalized))) &&
    (!rangeStart || new Date(booking.endTime) > rangeStart) &&
    (!rangeEnd || new Date(booking.startTime) < rangeEnd));
  const todayBookings = bookings.filter((booking) => overlaps(booking, today, tomorrow));
  const metrics = [
    { label: "Reservas de hoy", icon: CalendarDays, value: todayBookings.length },
    { label: "En curso", icon: Clock3, value: bookings.filter((booking) => now && new Date(booking.startTime) <= now && new Date(booking.endTime) > now).length },
    { label: "Próximas", icon: CalendarClock, value: bookings.filter((booking) => now && new Date(booking.startTime) > now).length },
    { label: "Horas reservadas hoy", icon: Timer, value: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(todayBookings.reduce((hours, booking) => hours + (Math.min(+new Date(booking.endTime), +tomorrow) - Math.max(+new Date(booking.startTime), +today)) / 3_600_000, 0)) },
  ];
  const status = (booking: AdminBooking) => {
    if (!now) return <Badge>—</Badge>;
    if (new Date(booking.endTime) <= now) return <Badge>{t("Finalizada")}</Badge>;
    if (new Date(booking.startTime) <= now) return <Badge variant="success">{t("En curso")}</Badge>;
    return <Badge variant="accent">{t("Próxima")}</Badge>;
  };
  const schedule = (booking: AdminBooking) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const date = (value: Date) => value.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    const time = (value: Date) => value.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
    const relative = +dayStart(start) === +today ? t("Hoy") : +dayStart(start) === +tomorrow ? t("Mañana") : null;
    return <div>
      <p className="font-medium text-ink">{relative ? relative + " · " : ""}{date(start)}</p>
      <p className="mt-1 text-sm text-muted tabular-nums">{time(start)} – {+dayStart(start) !== +dayStart(end) ? date(end) + " · " : ""}{time(end)}</p>
      <p className="mt-1 text-xs text-muted">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format((+end - +start) / 3_600_000)} {t("horas")}</p>
    </div>;
  };
  const actions = (booking: AdminBooking) => <div className="flex gap-2 md:justify-end">
    <Button type="button" variant="secondary" onClick={() => onEdit(booking)} aria-label={t("Editar reserva") + ": " + booking.user.name} className="min-h-10"><Pencil size={14} aria-hidden="true" />{t("Editar")}</Button>
    <Button type="button" variant="ghost" onClick={() => { setCancelError(false); setSelected(booking); }} aria-label={t("Cancelar reserva") + ": " + booking.user.name} className="min-h-10 text-danger"><Trash2 size={14} aria-hidden="true" />{t("Cancelar")}</Button>
  </div>;
  const closeCancel = () => { if (!cancelling) setSelected(null); };

  return <section className="space-y-6">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {metrics.map(({ label, icon: Icon, value }) => <Card key={label} className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-2"><span className="text-sm text-muted">{t(label)}</span><span className="rounded-lg bg-accent-soft p-2"><Icon size={18} aria-hidden="true" /></span></div>
        {loading || !now ? <Skeleton className="h-8 w-16" /> : <p className="font-heading text-3xl font-semibold tabular-nums">{value}</p>}
      </Card>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="font-heading text-xl font-semibold">{t("Reservas confirmadas")}</h2><p className="mt-1 text-sm text-muted">{t("Supervisa y edita las franjas horarias reservadas.")}</p></div>
      <Button type="button" onClick={onCreate} disabled={loading || !canCreate} className="min-h-11"><Plus size={16} aria-hidden="true" />{t("Nueva reserva")}</Button>
    </div>
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div role="group" aria-label={t("Filtrar por fecha")} className="flex flex-wrap gap-2">
          {([["all", "Todas"], ["today", "Hoy"], ["tomorrow", "Mañana"], ["week", "Esta semana"], ["custom", "Rango personalizado"]] as const).map(([value, label]) =>
            <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${period === value ? "border-accent/30 bg-accent-soft text-ink" : "border-line text-muted hover:bg-background"}`}>{t(label)}</button>)}
        </div>
        <div className="relative lg:w-72 lg:shrink-0">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t("Buscar reservas")} placeholder={t("Buscar usuario o espacio...")} className="min-h-11 w-full rounded-xl border border-line bg-background py-2 pl-10 pr-11 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={t("Limpiar búsqueda")} className="absolute right-1 top-0.5 grid h-10 w-10 place-items-center rounded-lg hover:bg-line/40"><X size={16} /></button>}
        </div>
      </div>
      {period === "custom" && <div className="flex flex-wrap gap-3">
        <label className="text-sm">{t("Desde")}<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block min-h-11 rounded-lg border border-line bg-background px-3" /></label>
        <label className="text-sm">{t("Hasta")}<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="mt-1 block min-h-11 rounded-lg border border-line bg-background px-3" /></label>
        {invalidRange && <p role="alert" className="w-full text-sm text-danger">{t("La fecha final debe ser igual o posterior a la inicial.")}</p>}
      </div>}
      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
        <p role="status">{loading ? t("Cargando reservas...") : t("Mostrando {count} de {total} reservas").replace("{count}", String(filtered.length)).replace("{total}", String(bookings.length))}</p>
        <p>{t("Zona horaria")}: {now ? Intl.DateTimeFormat().resolvedOptions().timeZone : "—"}</p>
      </div>
    </div>
    {loading ? <div className="space-y-3" aria-label={t("Cargando reservas...")}><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> :
      filtered.length === 0 ? <Card className="p-10 text-center text-sm text-muted"><CalendarDays className="mx-auto mb-3" aria-hidden="true" /><p>{t(bookings.length ? "No hay reservas que coincidan con la búsqueda." : "No hay reservas confirmadas.")}</p></Card> : <>
        <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("Reservas confirmadas")}</caption>
            <thead className="border-b border-line bg-background text-xs text-muted"><tr>{["Usuario", "Espacio", "Fecha y horario", "Estado", "Total", "Acciones"].map((label) => <th key={label} scope="col" className={`px-5 py-4 font-medium ${label === "Acciones" ? "text-right" : ""}`}>{t(label)}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{filtered.map((booking) => <tr key={booking.id} className="hover:bg-background/70">
              <td className="px-5 py-5"><p className="font-semibold">{booking.user.name}</p><p className="mt-1 break-all text-xs text-muted">{booking.user.email}</p></td>
              <td className="px-5 py-5 font-medium">{booking.workspace.name}</td>
              <td className="whitespace-nowrap px-5 py-5">{schedule(booking)}</td>
              <td className="px-5 py-5">{status(booking)}</td>
              <td className="whitespace-nowrap px-5 py-5 font-semibold tabular-nums">{money.format(booking.totalPrice)}</td>
              <td className="px-5 py-5">{actions(booking)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden" aria-label={t("Reservas confirmadas")}>{filtered.map((booking) => <li key={booking.id} className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{booking.user.name}</h3>{status(booking)}</div>
          <p className="mt-1 break-all text-xs text-muted">{booking.user.email}</p>
          <p className="mt-4 text-sm font-semibold">{booking.workspace.name}</p>
          <div className="mt-2 text-sm">{schedule(booking)}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><span className="font-semibold">{money.format(booking.totalPrice)}</span>{actions(booking)}</div>
        </li>)}</ul>
      </>}
    <dialog ref={dialog} aria-labelledby="cancel-booking-title" onCancel={(event) => { event.preventDefault(); closeCancel(); }} onClose={() => { if (!cancelling) setSelected(null); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-ink/40 backdrop:backdrop-blur-xs">
      <h2 id="cancel-booking-title" className="font-heading text-xl font-semibold">{t("Cancelar reserva")}</h2>
      <p className="mt-2 text-sm text-muted">{t("Confirma los datos antes de cancelar. El horario quedará disponible.")}</p>
      {selected && <div className="my-5 space-y-2 rounded-xl bg-background p-4"><p className="font-semibold">{selected.user.name}</p><p className="break-all text-xs text-muted">{selected.user.email}</p><p className="text-sm">{selected.workspace.name}</p>{schedule(selected)}</div>}
      {cancelError && <p role="alert" className="mb-4 text-sm text-danger">{t("No se pudo cancelar la reserva")}</p>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" autoFocus disabled={cancelling} onClick={closeCancel} className="min-h-11">{t("Volver")}</Button>
        <Button type="button" variant="danger" disabled={cancelling} className="min-h-11" onClick={async () => {
          if (!selected || cancelling) return;
          setCancelling(true);
          setCancelError(false);
          try { if (await onCancel(selected.id)) setSelected(null); else setCancelError(true); }
          catch { setCancelError(true); }
          finally { setCancelling(false); }
        }}>{t(cancelling ? "Cancelando..." : "Cancelar reserva")}</Button>
      </div>
    </dialog>
  </section>;
}
