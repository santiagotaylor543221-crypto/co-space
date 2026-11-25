'use client';

import { FormEvent, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import BookingOverview from '@/components/admin/BookingOverview';
import WorkspaceOverview from '@/components/admin/WorkspaceOverview';
import type { AdminWorkspace } from '@/lib/workspace-schema';
import { useI18n } from '@/lib/i18n';

type Section = 'bookings' | 'workspaces';

interface AdminUser {
  id: string;
  name: string;
  email: string;
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
  const { t } = useI18n();
  const [section, setSection] = useState<Section>('bookings');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bookingForm, setBookingForm] = useState<BookingFormState | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    setError('');

    try {
      const response = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, t('No se pudo cancelar la reserva')));
      }

      setNotice(t('Reserva cancelada.'));
      await loadData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('No se pudo cancelar la reserva'));
      return false;
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

      {section === 'bookings' && (
        <BookingOverview
          bookings={bookings}
          loading={loading}
          canCreate={users.length > 0 && workspaces.some((workspace) => workspace.isActive)}
          onCreate={openNewBookingForm}
          onEdit={openEditBookingForm}
          onCancel={cancelBooking}
        />
      )}

      {section === 'workspaces' && (
        <WorkspaceOverview workspaces={workspaces} loading={loading} onChanged={(space) => {
          setWorkspaces((current) => current.some((item) => item.id === space.id)
            ? current.map((item) => item.id === space.id ? space : item)
            : [...current, space]);
        }} />
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

    </div>
  );
}
