'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';

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
  'w-full rounded-lg border border-white/10 bg-[#111113] px-3 py-2.5 text-xs text-white outline-none transition focus:border-white/30';
const labelClass = 'mb-1.5 block text-[10px] font-medium text-zinc-400';

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

  const saveBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingForm) return;

    setSaving(true);
    setNotice('');
    try {
      const response = await fetch(
        editingBookingId ? `/api/admin/bookings/${editingBookingId}` : '/api/admin/bookings',
        {
          method: editingBookingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...bookingForm,
            startTime: new Date(bookingForm.startTime).toISOString(),
            endTime: new Date(bookingForm.endTime).toISOString(),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, 'No se pudo guardar la reserva'));

      setNotice(editingBookingId ? 'Reserva actualizada.' : 'Reserva creada.');
      setBookingForm(null);
      setEditingBookingId(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la reserva');
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return;

    setBusyId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, 'No se pudo cancelar la reserva'));
      setBookings((current) => current.filter((booking) => booking.id !== bookingId));
      setNotice('Reserva cancelada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la reserva');
    } finally {
      setBusyId(null);
    }
  };

  const openNewWorkspaceForm = () => {
    setFormError('');
    setEditingWorkspaceId(null);
    setWorkspaceForm({
      name: '',
      description: '',
      type: 'DESK',
      capacity: '1',
      pricePerHour: '',
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

  const saveWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceForm) return;

    setSaving(true);
    setNotice('');
    try {
      const response = await fetch(
        editingWorkspaceId
          ? `/api/admin/workspaces/${editingWorkspaceId}`
          : '/api/admin/workspaces',
        {
          method: editingWorkspaceId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...workspaceForm,
            capacity: Number(workspaceForm.capacity),
            pricePerHour: Number(workspaceForm.pricePerHour),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, 'No se pudo guardar el espacio'));

      setNotice(editingWorkspaceId ? 'Espacio actualizado.' : 'Espacio creado.');
      setWorkspaceForm(null);
      setEditingWorkspaceId(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el espacio');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkspace = async (workspace: AdminWorkspace) => {
    const action = workspace.isActive ? 'archivar' : 'reactivar';
    if (workspace.isActive && !confirm(`¿Quieres archivar “${workspace.name}”?`)) return;

    setBusyId(workspace.id);
    try {
      const response = await fetch(`/api/admin/workspaces/${workspace.id}`, {
        method: workspace.isActive ? 'DELETE' : 'PATCH',
        ...(workspace.isActive
          ? {}
          : {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: true }),
            }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data, `No se pudo ${action} el espacio`));

      setWorkspaces((current) =>
        current.map((item) => (item.id === workspace.id ? data as AdminWorkspace : item))
      );
      setNotice(workspace.isActive ? 'Espacio archivado.' : 'Espacio reactivado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : `No se pudo ${action} el espacio`);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-400">Cargando datos del sistema...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-10 md:py-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-6 bg-gray-600" />
            <span className="text-[10px] tracking-[0.25em] text-gray-500">PANEL DE CONTROL</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Administración
          </h1>
          <p className="mt-2 text-xs text-gray-500">
            Gestiona reservas, usuarios y espacios de trabajo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={section === 'bookings' ? 'primary' : 'secondary'}
            className="px-4 py-2.5"
            onClick={() => setSection('bookings')}
          >
            Reservas
          </Button>
          <Button
            type="button"
            variant={section === 'workspaces' ? 'primary' : 'secondary'}
            className="px-4 py-2.5"
            onClick={() => setSection('workspaces')}
          >
            Espacios
          </Button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => setError('')}>
            Cerrar
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          {notice}
        </p>
      )}

      {section === 'bookings' ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Reservas confirmadas</h2>
            <Button
              type="button"
              onClick={openNewBookingForm}
              disabled={users.length === 0 || !workspaces.some((workspace) => workspace.isActive)}
              className="px-4 py-2.5"
            >
              <Plus size={14} />
              Nueva reserva
            </Button>
          </div>

          <Card className="overflow-hidden bg-[#0e0e10]">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-200">
                Reservas
                <span className="rounded bg-white/5 px-2 py-1 text-[10px] text-gray-400">
                  {String(bookings.length).padStart(2, '0')}
                </span>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar usuario o espacio..."
                aria-label="Buscar reservas"
                className={`${inputClass} sm:w-64`}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="text-[9px] tracking-[0.2em] text-gray-600">
                    <th className="px-5 py-3 font-medium">USUARIO</th>
                    <th className="px-5 py-3 font-medium">ESPACIO</th>
                    <th className="px-5 py-3 font-medium">INICIO</th>
                    <th className="px-5 py-3 font-medium">FIN</th>
                    <th className="px-5 py-3 font-medium">TOTAL</th>
                    <th className="px-5 py-3 text-right font-medium">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-white">{booking.user.name}</p>
                        <p className="text-[10px] text-gray-600">{booking.user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-300">{booking.workspace.name}</td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(booking.startTime).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(booking.endTime).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-300">
                        {booking.totalPrice.toLocaleString()} €
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => openEditBookingForm(booking)}
                            className="px-3 py-2 text-[10px]"
                          >
                            <Pencil size={12} />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => void cancelBooking(booking.id)}
                            disabled={busyId === booking.id}
                            className="px-2 py-2 text-[10px]"
                          >
                            {busyId === booking.id ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-xs text-gray-600">
                        {bookings.length === 0
                          ? 'No hay reservas confirmadas.'
                          : 'No hay reservas que coincidan con la búsqueda.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ) : (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Espacios de trabajo</h2>
              <p className="mt-1 text-[10px] text-gray-500">
                Los espacios archivados conservan su historial de reservas.
              </p>
            </div>
            <Button type="button" onClick={openNewWorkspaceForm} className="px-4 py-2.5">
              <Plus size={14} />
              Nuevo espacio
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <Card key={workspace.id} className="flex flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <span className={`text-[9px] uppercase tracking-widest ${workspace.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {workspace.isActive ? 'Activo' : 'Archivado'}
                    </span>
                    <h3 className="mt-1 text-sm font-semibold text-white">{workspace.name}</h3>
                  </div>
                  <span className="rounded border border-white/10 px-2 py-1 text-[9px] text-zinc-400">
                    {workspaceTypeLabels[workspace.type]}
                  </span>
                </div>
                <p className="mb-4 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-zinc-500">
                  {workspace.description}
                </p>
                <div className="mb-5 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{workspace.capacity} {workspace.capacity === 1 ? 'persona' : 'personas'}</span>
                  <span>{workspace.pricePerHour.toLocaleString()} € / hora</span>
                </div>
                <div className="mt-auto flex gap-2 border-t border-white/5 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openEditWorkspaceForm(workspace)}
                    className="flex-1 py-2"
                  >
                    <Pencil size={12} />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant={workspace.isActive ? 'danger' : 'secondary'}
                    onClick={() => void toggleWorkspace(workspace)}
                    disabled={busyId === workspace.id}
                    className="flex-1 py-2"
                  >
                    {workspace.isActive ? <Trash2 size={12} /> : <RotateCcw size={12} />}
                    {workspace.isActive ? 'Archivar' : 'Reactivar'}
                  </Button>
                </div>
              </Card>
            ))}
            {workspaces.length === 0 && (
              <Card className="col-span-full py-16 text-center text-xs text-zinc-500">
                No hay espacios. Crea el primero para que aparezca en el catálogo.
              </Card>
            )}
          </div>
        </section>
      )}

      {bookingForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <Card className="my-auto w-full max-w-xl rounded-2xl bg-[#111113] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editingBookingId ? 'Editar reserva' : 'Crear reserva'}
              </h2>
              <button type="button" aria-label="Cerrar formulario" onClick={() => setBookingForm(null)}>
                <X size={18} className="text-zinc-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={saveBooking} className="grid gap-4 sm:grid-cols-2">
              {formError && (
                <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 sm:col-span-2">
                  {formError}
                </p>
              )}
              <label className="sm:col-span-2">
                <span className={labelClass}>Usuario</span>
                <select
                  required
                  value={bookingForm.userId}
                  onChange={(event) => setBookingForm({ ...bookingForm, userId: event.target.value })}
                  className={inputClass}
                >
                  <option value="">Selecciona un usuario</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} — {user.email}</option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>Espacio</span>
                <select
                  required
                  value={bookingForm.workspaceId}
                  onChange={(event) => setBookingForm({ ...bookingForm, workspaceId: event.target.value })}
                  className={inputClass}
                >
                  <option value="">Selecciona un espacio</option>
                  {workspaces.filter((workspace) => workspace.isActive).map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Inicio</span>
                <input
                  required
                  type="datetime-local"
                  value={bookingForm.startTime}
                  onChange={(event) => setBookingForm({ ...bookingForm, startTime: event.target.value })}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </label>
              <label>
                <span className={labelClass}>Fin</span>
                <input
                  required
                  type="datetime-local"
                  value={bookingForm.endTime}
                  onChange={(event) => setBookingForm({ ...bookingForm, endTime: event.target.value })}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </label>
              <p className="text-[10px] leading-relaxed text-zinc-500 sm:col-span-2">
                Las reservas deben durar entre 1 y 4 horas, dentro del horario 07:00–21:00 y con hasta 30 días de anticipación. Se validan los solapamientos y el límite de reservas del usuario.
              </p>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setBookingForm(null)} className="px-4 py-2.5">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="px-4 py-2.5">
                  {saving ? 'Guardando...' : editingBookingId ? 'Guardar cambios' : 'Crear reserva'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {workspaceForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <Card className="my-auto w-full max-w-xl rounded-2xl bg-[#111113] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editingWorkspaceId ? 'Editar espacio' : 'Crear espacio'}
              </h2>
              <button type="button" aria-label="Cerrar formulario" onClick={() => setWorkspaceForm(null)}>
                <X size={18} className="text-zinc-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={saveWorkspace} className="grid gap-4 sm:grid-cols-2">
              {formError && (
                <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 sm:col-span-2">
                  {formError}
                </p>
              )}
              <label className="sm:col-span-2">
                <span className={labelClass}>Nombre</span>
                <input required value={workspaceForm.name} onChange={(event) => setWorkspaceForm({ ...workspaceForm, name: event.target.value })} className={inputClass} />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>Descripción</span>
                <textarea required rows={3} value={workspaceForm.description} onChange={(event) => setWorkspaceForm({ ...workspaceForm, description: event.target.value })} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Tipo</span>
                <select value={workspaceForm.type} onChange={(event) => setWorkspaceForm({ ...workspaceForm, type: event.target.value as WorkspaceType })} className={inputClass}>
                  {Object.entries(workspaceTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Capacidad</span>
                <input required min="1" type="number" value={workspaceForm.capacity} onChange={(event) => setWorkspaceForm({ ...workspaceForm, capacity: event.target.value })} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Precio por hora (€)</span>
                <input required min="0.01" step="0.01" type="number" value={workspaceForm.pricePerHour} onChange={(event) => setWorkspaceForm({ ...workspaceForm, pricePerHour: event.target.value })} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Ruta de imagen</span>
                <input required value={workspaceForm.imageUrl} onChange={(event) => setWorkspaceForm({ ...workspaceForm, imageUrl: event.target.value })} placeholder="/images/desk-1.svg" className={inputClass} />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setWorkspaceForm(null)} className="px-4 py-2.5">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="px-4 py-2.5">
                  {saving ? 'Guardando...' : editingWorkspaceId ? 'Guardar cambios' : 'Crear espacio'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
