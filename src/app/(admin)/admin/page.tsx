'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RotateCcw, Trash2, CalendarDays, LayoutGrid, Users, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import Skeleton from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useI18n } from '@/lib/i18n';

type WorkspaceType = 'DESK' | 'MEETING_ROOM' | 'BOOTH';
type Section = 'bookings' | 'workspaces';

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

interface AdminWorkspace {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  capacity: number;
  pricePerHour: number;
  imageUrl: string;
  isActive: boolean;
}

interface AdminBooking {
  id: string;
  userId: string;
  workspaceId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  workspace: { id: string; name: string };
  user: { name: string; email: string };
}

interface BookingFormState {
  userId: string;
  workspaceId: string;
  startTime: string;
  endTime: string;
}

interface WorkspaceFormState {
  name: string;
  description: string;
  type: WorkspaceType;
  capacity: string;
  pricePerHour: string;
  imageUrl: string;
}

const workspaceTypeLabels: Record<WorkspaceType, string> = {
  DESK: 'Escritorio',
  MEETING_ROOM: 'Sala de reuniones',
  BOOTH: 'Cabina',
};

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-1 focus:ring-accent';
const labelClass = 'mb-1.5 block text-xs font-medium text-ink';

function toLocalDateTimeValue(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function defaultLocalDateTime(daysFromNow: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return toLocalDateTimeValue(date.toISOString());
}

function getErrorMessage(data: unknown, fallback: string) {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'string'
  ) {
    return data.error;
  }
  return fallback;
}

async function fetchAdminData() {
  const [bookingResponse, workspaceResponse, userResponse] = await Promise.all([
    fetch('/api/admin/bookings'),
    fetch('/api/admin/workspaces'),
    fetch('/api/admin/users'),
  ]);
  const responses = [bookingResponse, workspaceResponse, userResponse];
  const responseData = await Promise.all(responses.map((response) => response.json()));
  const failedIndex = responses.findIndex((response) => !response.ok);
  if (failedIndex !== -1) {
    throw new Error(getErrorMessage(responseData[failedIndex], 'Error al cargar el panel'));
  }

  return {
    bookings: responseData[0] as AdminBooking[],
    workspaces: responseData[1] as AdminWorkspace[],
    users: responseData[2] as AdminUser[],
  };
}

export default function AdminPanelPage() {
  const { t, language } = useI18n();
  const [section, setSection] = useState<Section>('bookings');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [bookingForm, setBookingForm] = useState<BookingFormState | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormState | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const data = await fetchAdminData();
      setBookings(data.bookings);
      setWorkspaces(data.workspaces);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el panel de administración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchAdminData()
      .then((data) => {
        if (!active) return;
        setBookings(data.bookings);
        setWorkspaces(data.workspaces);
        setUsers(data.users);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error al cargar el panel');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return bookings;
    return bookings.filter(
      (booking) =>
        booking.workspace.name.toLowerCase().includes(normalizedQuery) ||
        booking.user.email.toLowerCase().includes(normalizedQuery) ||
        booking.user.name.toLowerCase().includes(normalizedQuery)
    );
  }, [bookings, query]);

  const openNewBookingForm = () => {
    setFormError('');
    setEditingBookingId(null);
    setBookingForm({
      userId: users[0]?.id ?? '',
      workspaceId: workspaces.find((workspace) => workspace.isActive)?.id ?? '',
      startTime: defaultLocalDateTime(1, 10),
      endTime: defaultLocalDateTime(1, 12),
    });
  };

  const openEditBookingForm = (booking: AdminBooking) => {
    setFormError('');
    setEditingBookingId(booking.id);
    setBookingForm({
      userId: booking.userId,
      workspaceId: booking.workspaceId,
      startTime: toLocalDateTimeValue(booking.startTime),
      endTime: toLocalDateTimeValue(booking.endTime),
    });
  };

  const openNewWorkspaceForm = () => {
    setFormError('');
    setEditingWorkspaceId(null);
    setWorkspaceForm({
      name: '',
      description: '',
      type: 'DESK',
      capacity: '1',
      pricePerHour: '15',
      imageUrl: '/images/desk-1.svg',
    });
  };

  const openEditWorkspaceForm = (workspace: AdminWorkspace) => {
    setFormError('');
    setEditingWorkspaceId(workspace.id);
    setWorkspaceForm({
      name: workspace.name,
      description: workspace.description,
      type: workspace.type,
      capacity: String(workspace.capacity),
      pricePerHour: String(workspace.pricePerHour),
      imageUrl: workspace.imageUrl,
    });
  };

  const saveBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!bookingForm) return;
    setFormError('');
    setSaving(true);

    try {
      const payload = {
        userId: bookingForm.userId,
        workspaceId: bookingForm.workspaceId,
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
      };
      const url = editingBookingId ? `/api/admin/bookings/${editingBookingId}` : '/api/admin/bookings';
      const method = editingBookingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, t('No se pudo guardar la reserva')));
      }

      setNotice(editingBookingId ? t('Reserva actualizada.') : t('Reserva creada.'));
      setBookingForm(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('No se pudo guardar la reserva'));
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm(t('¿Estás seguro de que deseas cancelar esta reserva?'))) return;
    setBusyId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, t('No se pudo cancelar la reserva')));
      }

      setNotice(t('Reserva cancelada.'));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('No se pudo cancelar la reserva'));
    } finally {
      setBusyId(null);
    }
  };

  const saveWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspaceForm) return;
    setFormError('');
    setSaving(true);

    try {
      const payload = {
        name: workspaceForm.name,
        description: workspaceForm.description,
        type: workspaceForm.type,
        capacity: Number(workspaceForm.capacity),
        pricePerHour: Number(workspaceForm.pricePerHour),
        imageUrl: workspaceForm.imageUrl,
      };
      const url = editingWorkspaceId ? `/api/admin/workspaces/${editingWorkspaceId}` : '/api/admin/workspaces';
      const method = editingWorkspaceId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, t('No se pudo guardar el espacio')));
      }

      setNotice(editingWorkspaceId ? t('Espacio actualizado.') : t('Espacio creado.'));
      setWorkspaceForm(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('No se pudo guardar el espacio'));
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkspace = async (workspace: AdminWorkspace) => {
    const actionLabel = workspace.isActive ? t('archivar') : t('reactivar');
    if (!confirm(t(`¿Quieres archivar “{name}”?`).replace('{name}', workspace.name).replace('archivar', actionLabel))) {
      return;
    }

    setBusyId(workspace.id);
    setError('');

    try {
      const response = await fetch(`/api/admin/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !workspace.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        const fallback = workspace.isActive
          ? t('No se pudo archivar el espacio')
          : t('No se pudo reactivar el espacio');
        throw new Error(getErrorMessage(data, fallback));
      }

      setNotice(workspace.isActive ? t('Espacio archivado.') : t('Espacio reactivado.'));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('No se pudo archivar el espacio'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabecera del Panel */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-line">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">
            {t('PANEL DE CONTROL')}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('Administración')}
          </h1>
          <p className="mt-2 text-xs text-muted">
            {t('Gestiona reservas, usuarios y espacios de trabajo.')}
          </p>
        </div>

        {/* Pestañas de sección */}
        <div className="flex rounded-2xl border border-line bg-surface p-1 shadow-xs">
          <Button
            type="button"
            variant={section === 'bookings' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSection('bookings')}
          >
            {t('Reservas')}
          </Button>
          <Button
            type="button"
            variant={section === 'workspaces' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSection('workspaces')}
          >
            {t('Espacios')}
          </Button>
        </div>
      </header>

      {/* Métricas clave en tarjetas */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Total Reservas</span>
            <CalendarDays size={16} className="text-accent" />
          </div>
          <div className="font-heading text-2xl font-semibold text-ink">
            {bookings.length}
          </div>
        </Card>

        <Card className="p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Espacios Activos</span>
            <CheckCircle2 size={16} className="text-success" />
          </div>
          <div className="font-heading text-2xl font-semibold text-ink">
            {workspaces.filter((w) => w.isActive).length}
          </div>
        </Card>

        <Card className="p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Espacios Totales</span>
            <LayoutGrid size={16} className="text-muted" />
          </div>
          <div className="font-heading text-2xl font-semibold text-ink">
            {workspaces.length}
          </div>
        </Card>

        <Card className="p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Usuarios Registrados</span>
            <Users size={16} className="text-muted" />
          </div>
          <div className="font-heading text-2xl font-semibold text-ink">
            {users.length}
          </div>
        </Card>
      </section>

      {/* Mensajes de error y estado */}
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-2xl border border-danger/30 bg-danger-soft p-4 text-xs font-medium text-danger">
          <span>{t(error)}</span>
          <button type="button" className="text-xs underline font-semibold" onClick={() => setError('')}>
            {t('Cerrar')}
          </button>
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-center justify-between rounded-2xl border border-success/30 bg-success-soft p-4 text-xs font-medium text-success">
          <span>{t(notice)}</span>
          <button type="button" className="text-xs underline font-semibold" onClick={() => setNotice('')}>
            {t('Cerrar')}
          </button>
        </div>
      )}

      {/* SECCIÓN 1: RESERVAS */}
      {section === 'bookings' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">{t('Reservas confirmadas')}</h2>
              <p className="text-xs text-muted">Supervisa y edita las franjas horarias reservadas.</p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={openNewBookingForm}
              disabled={users.length === 0 || !workspaces.some((workspace) => workspace.isActive)}
            >
              <Plus size={15} />
              <span>{t('Nueva reserva')}</span>
            </Button>
          </div>

          {/* Barra de búsqueda y contador */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-ink">
              <span>Reservas</span>
              <Badge variant="accent">
                {String(bookings.length).padStart(2, '0')}
              </Badge>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Buscar usuario o espacio...')}
              aria-label={t('Buscar reservas')}
              className={`${inputClass} sm:w-72`}
            />
          </div>

          {/* Tabla de reservas con componentes reutilizables */}
          <Table>
            <TableHeader>
              <tr>
                <TableHead>{t('USUARIO')}</TableHead>
                <TableHead>{t('ESPACIO')}</TableHead>
                <TableHead>{t('INICIO')}</TableHead>
                <TableHead>{t('FIN')}</TableHead>
                <TableHead>{t('TOTAL')}</TableHead>
                <TableHead className="text-right">{t('ACCIONES')}</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading && (
                <tr>
                  <TableCell colSpan={6} className="py-8">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </tr>
              )}
              {!loading && filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <p className="font-semibold text-ink">{booking.user.name}</p>
                    <p className="text-[11px] text-muted">{booking.user.email}</p>
                  </TableCell>
                  <TableCell className="font-medium text-ink">{booking.workspace.name}</TableCell>
                  <TableCell className="text-muted">
                    {new Date(booking.startTime).toLocaleString(language)}
                  </TableCell>
                  <TableCell className="text-muted">
                    {new Date(booking.endTime).toLocaleString(language)}
                  </TableCell>
                  <TableCell className="font-semibold text-ink">
                    {booking.totalPrice.toLocaleString()} €
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditBookingForm(booking)}
                      >
                        <Pencil size={13} />
                        <span>{t('Editar')}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => void cancelBooking(booking.id)}
                        disabled={busyId === booking.id}
                      >
                        {busyId === booking.id ? t('Cancelando...') : t('Cancelar')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filteredBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-muted">
                    {bookings.length === 0
                      ? t('No hay reservas confirmadas.')
                      : t('No hay reservas que coincidan con la búsqueda.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      )}

      {/* SECCIÓN 2: ESPACIOS */}
      {section === 'workspaces' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">{t('Espacios de trabajo')}</h2>
              <p className="text-xs text-muted">
                {t('Los espacios archivados conservan su historial de reservas.')}
              </p>
            </div>
            <Button type="button" variant="primary" onClick={openNewWorkspaceForm}>
              <Plus size={15} />
              <span>{t('Nuevo espacio')}</span>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <Card key={workspace.id} className="flex flex-col justify-between rounded-3xl p-6 shadow-xs">
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <Badge variant={workspace.isActive ? 'success' : 'neutral'}>
                        {workspace.isActive ? t('Activo') : t('Archivado')}
                      </Badge>
                      <h3 className="mt-2 font-heading text-base font-semibold text-ink">{workspace.name}</h3>
                    </div>
                    <Badge variant="accent">
                      {t(workspaceTypeLabels[workspace.type])}
                    </Badge>
                  </div>

                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted">
                    {workspace.description}
                  </p>

                  <div className="mb-6 flex items-center justify-between text-xs text-muted pt-3 border-t border-line">
                    <span>{workspace.capacity} {t(workspace.capacity === 1 ? 'persona' : 'personas')}</span>
                    <span className="font-semibold text-ink">{workspace.pricePerHour.toLocaleString()} € / hora</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-line">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openEditWorkspaceForm(workspace)}
                    className="flex-1 py-2 text-xs"
                  >
                    <Pencil size={13} />
                    <span>{t('Editar')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={workspace.isActive ? 'danger' : 'secondary'}
                    onClick={() => void toggleWorkspace(workspace)}
                    disabled={busyId === workspace.id}
                    className="flex-1 py-2 text-xs"
                  >
                    {workspace.isActive ? <Trash2 size={13} /> : <RotateCcw size={13} />}
                    <span>{workspace.isActive ? t('Archivar') : t('Reactivar')}</span>
                  </Button>
                </div>
              </Card>
            ))}
            {workspaces.length === 0 && (
              <Card className="col-span-full py-16 text-center text-xs text-muted">
                {t('No hay espacios. Crea el primero para que aparezca en el catálogo.')}
              </Card>
            )}
          </div>
        </section>
      )}

      {/* MODAL 1: FORMULARIO DE RESERVA */}
      <Modal
        isOpen={Boolean(bookingForm)}
        onClose={() => setBookingForm(null)}
        title={editingBookingId ? t('Editar reserva') : t('Crear reserva')}
        description="Ingresa el usuario, espacio y franja horaria permitida."
      >
        {bookingForm && (
          <form onSubmit={saveBooking} className="grid gap-4 sm:grid-cols-2">
            {formError && (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs text-danger sm:col-span-2 font-medium">
                {t(formError)}
              </p>
            )}

            <label className="sm:col-span-2">
              <span className={labelClass}>{t('Usuario')}</span>
              <select
                required
                value={bookingForm.userId}
                onChange={(event) => setBookingForm({ ...bookingForm, userId: event.target.value })}
                className={inputClass}
              >
                <option value="">{t('Selecciona un usuario')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} — {user.email}</option>
                ))}
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className={labelClass}>{t('Espacio')}</span>
              <select
                required
                value={bookingForm.workspaceId}
                onChange={(event) => setBookingForm({ ...bookingForm, workspaceId: event.target.value })}
                className={inputClass}
              >
                <option value="">{t('Selecciona un espacio')}</option>
                {workspaces.filter((workspace) => workspace.isActive).map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>{t('Inicio')}</span>
              <input
                required
                type="datetime-local"
                value={bookingForm.startTime}
                onChange={(event) => setBookingForm({ ...bookingForm, startTime: event.target.value })}
                className={inputClass}
              />
            </label>

            <label>
              <span className={labelClass}>{t('Fin')}</span>
              <input
                required
                type="datetime-local"
                value={bookingForm.endTime}
                onChange={(event) => setBookingForm({ ...bookingForm, endTime: event.target.value })}
                className={inputClass}
              />
            </label>

            <p className="text-[11px] leading-relaxed text-muted sm:col-span-2">
              {t('Las reservas deben durar entre 1 y 4 horas, dentro del horario 07:00–21:00 y con hasta 30 días de anticipación. Se validan los solapamientos y el límite de reservas del usuario.')}
            </p>

            <div className="flex justify-end gap-3 sm:col-span-2 pt-4 border-t border-line">
              <Button type="button" variant="secondary" onClick={() => setBookingForm(null)}>
                {t('Cancelar')}
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? t('Guardando...') : editingBookingId ? t('Guardar cambios') : t('Crear reserva')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: FORMULARIO DE ESPACIO */}
      <Modal
        isOpen={Boolean(workspaceForm)}
        onClose={() => setWorkspaceForm(null)}
        title={editingWorkspaceId ? t('Editar espacio') : t('Crear espacio')}
        description="Configura la capacidad, tarifa por hora y recursos del espacio."
      >
        {workspaceForm && (
          <form onSubmit={saveWorkspace} className="grid gap-4 sm:grid-cols-2">
            {formError && (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs text-danger sm:col-span-2 font-medium">
                {t(formError)}
              </p>
            )}

            <label className="sm:col-span-2">
              <span className={labelClass}>{t('Nombre')}</span>
              <input
                required
                value={workspaceForm.name}
                onChange={(event) => setWorkspaceForm({ ...workspaceForm, name: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="sm:col-span-2">
              <span className={labelClass}>{t('Descripción')}</span>
              <textarea
                required
                rows={3}
                value={workspaceForm.description}
                onChange={(event) => setWorkspaceForm({ ...workspaceForm, description: event.target.value })}
                className={inputClass}
              />
            </label>

            <label>
              <span className={labelClass}>{t('Tipo')}</span>
              <select
                value={workspaceForm.type}
                onChange={(event) => setWorkspaceForm({ ...workspaceForm, type: event.target.value as WorkspaceType })}
                className={inputClass}
              >
                {Object.entries(workspaceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{t(label)}</option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>{t('Capacidad')}</span>
              <input
                required
                min="1"
                type="number"
                value={workspaceForm.capacity}
                onChange={(event) => setWorkspaceForm({ ...workspaceForm, capacity: event.target.value })}
                className={inputClass}
              />
            </label>

            <label>
              <span className={labelClass}>{t('Precio por hora (€)')}</span>
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={workspaceForm.pricePerHour}
                onChange={(event) => setWorkspaceForm({ ...workspaceForm, pricePerHour: event.target.value })}
                className={inputClass}
              />
            </label>

            <label>
              <span className={labelClass}>{t('Ruta de imagen')}</span>
              <input
                required
                value={workspaceForm.imageUrl}
                onChange={(event) => setWorkspaceForm({ ...workspaceForm, imageUrl: event.target.value })}
                placeholder="/images/desk-1.svg"
                className={inputClass}
              />
            </label>

            <div className="flex justify-end gap-3 sm:col-span-2 pt-4 border-t border-line">
              <Button type="button" variant="secondary" onClick={() => setWorkspaceForm(null)}>
                {t('Cancelar')}
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? t('Guardando...') : editingWorkspaceId ? t('Guardar cambios') : t('Crear espacio')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
