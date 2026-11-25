"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

export type Language = "es" | "en";

const translations: Record<string, string> = {
  "Espacios que trabajan contigo": "Spaces that work with you",
  "Horario amplio": "Extended hours",
  "De 7:00 a 21:00": "From 7:00 AM to 9:00 PM",
  "A tu medida": "Tailored to you",
  "Reservas de 1 a 4 horas": "Bookings from 1 to 4 hours",
  "Sin esperas": "No waiting",
  "Gestión inmediata": "Instant management",
  "Encuentra tu lugar en": "Find your place at",
  "Reserva espacios excepcionales para trabajar, crear y conectar. Sin complicaciones.":
    "Book exceptional spaces to work, create, and connect. No hassle.",
  "Explorar Espacios": "Explore spaces",
  "Descubre más": "Discover more",
  "Pensado para ti": "Designed for you",
  "Trabaja mejor, a tu manera.": "Work better, your way.",
  "Navegación principal": "Main navigation",
  "Catálogo": "Spaces",
  "Iniciar sesión": "Sign in",
  "Mis reservas": "My bookings",
  "Mi cuenta": "My account",
  "Ir al inicio": "Go to home",
  "Cerrar sesión": "Sign out",
  "Menú de administración": "Admin menu",
  "MENÚ PRINCIPAL": "MAIN MENU",
  "Reservas": "Bookings",
  "Volver al sitio": "Back to site",
  "Administrador": "Administrator",
  "Nivel: ADMIN": "Role: ADMIN",
  "Bienvenido a CoSpace": "Welcome to CoSpace",
  "Inicia sesión para gestionar tus reservas.": "Sign in to manage your bookings.",
  "Correo Electrónico": "Email address",
  "Contraseña": "Password",
  "tu@correo.com": "you@email.com",
  "Iniciando sesión...": "Signing in...",
  "Entrar": "Sign in",
  "¿No tienes cuenta?": "Don't have an account?",
  "Regístrate": "Sign up",
  "← Volver al inicio": "← Back to home",
  "Únete a CoSpace": "Join CoSpace",
  "Crear cuenta": "Create account",
  "Empieza a trabajar a tu manera.": "Start working your way.",
  "Error al registrarse": "Failed to register",
  "Nombre Completo": "Full name",
  "Procesando...": "Processing...",
  "Registrarse": "Create account",
  "¿Ya tienes cuenta?": "Already have an account?",
  "Inicia sesión": "Sign in",
  "Volver al inicio": "Back to home",
  "Descubre tu espacio": "Discover your space",
  "Espacios Disponibles": "Available spaces",
  "Selecciona un espacio que se adapte a tu forma de trabajar.":
    "Choose a space that fits the way you work.",
  "Disponible": "Available",
  "persona": "person",
  "personas": "people",
  "/ hora": "/ hour",
  "No hay espacios disponibles en este momento.": "No spaces are available right now.",
  "Cargando espacio...": "Loading space...",
  "Espacio no encontrado": "Space not found",
  "Comodidades": "Amenities",
  "Reserva tu espacio": "Book your space",
  "Fecha": "Date",
  "Hora inicio": "Start time",
  "Hora fin": "End time",
  "Precio Total": "Total price",
  "hora": "hour",
  "horas": "hours",
  "Reservando...": "Booking...",
  "Confirmar Reserva": "Confirm booking",
  "Pago seguro · Cancelación flexible": "Secure payment · Flexible cancellation",
  "← Volver al catálogo": "← Back to spaces",
  "Panel Personal": "Personal dashboard",
  "Mis Reservas": "My Bookings",
  "Gestiona tus próximos espacios de trabajo.": "Manage your upcoming workspace bookings.",
  "Error al cargar las reservas": "Failed to load bookings",
  "¿Estás seguro de que deseas cancelar esta reserva?": "Are you sure you want to cancel this booking?",
  "Error al cancelar la reserva": "Failed to cancel the booking",
  "Error al cargar el espacio": "Failed to load the space",
  "Error al reservar": "Failed to book the space",
  "No tienes reservas activas en este momento.": "You have no active bookings right now.",
  "Explorar espacios": "Explore spaces",
  "Cancelar reserva": "Cancel booking",
  "Cancelando...": "Canceling...",
  "Cancelar": "Cancel",
  "PANEL DE CONTROL": "CONTROL PANEL",
  "Administración": "Administration",
  "Gestiona reservas, usuarios y espacios de trabajo.":
    "Manage bookings, users, and workspaces.",
  "Reservas confirmadas": "Confirmed bookings",
  "Nueva reserva": "New booking",
  "Buscar usuario o espacio...": "Search users or spaces...",
  "Buscar reservas": "Search bookings",
  "USUARIO": "USER",
  "ESPACIO": "SPACE",
  "INICIO": "START",
  "FIN": "END",
  "TOTAL": "TOTAL",
  "ACCIONES": "ACTIONS",
  "Editar": "Edit",
  "No hay reservas confirmadas.": "No confirmed bookings.",
  "No hay reservas que coincidan con la búsqueda.": "No bookings match your search.",
  "Espacios de trabajo": "Workspaces",
  "Los espacios archivados conservan su historial de reservas.":
    "Archived workspaces retain their booking history.",
  "Nuevo espacio": "New workspace",
  "Activo": "Active",
  "Archivado": "Archived",
  "Archivar": "Archive",
  "Reactivar": "Restore",
  "No hay espacios. Crea el primero para que aparezca en el catálogo.":
    "There are no workspaces. Create one to add it to the catalog.",
  "Editar reserva": "Edit booking",
  "Crear reserva": "Create booking",
  "Cerrar formulario": "Close form",
  "Usuario": "User",
  "Selecciona un usuario": "Select a user",
  "Espacio": "Workspace",
  "Selecciona un espacio": "Select a workspace",
  "Inicio": "Start",
  "Fin": "End",
  "Las reservas deben durar entre 1 y 4 horas, dentro del horario 07:00–21:00 y con hasta 30 días de anticipación. Se validan los solapamientos y el límite de reservas del usuario.":
    "Bookings must last 1 to 4 hours, fall between 07:00 and 21:00, and be made up to 30 days in advance. Overlaps and each user's booking limit are checked.",
  "Guardar cambios": "Save changes",
  "Guardando...": "Saving...",
  "Editar espacio": "Edit workspace",
  "Crear espacio": "Create workspace",
  "Nombre": "Name",
  "Descripción": "Description",
  "Tipo": "Type",
  "Escritorio": "Desk",
  "Sala de reuniones": "Meeting room",
  "Cabina": "Booth",
  "Capacidad": "Capacity",
  "Precio por hora (€)": "Price per hour (€)",
  "Ruta de imagen": "Image path",
  "Cargando datos del sistema...": "Loading system data...",
  "Cerrar": "Close",
  "Reserva actualizada.": "Booking updated.",
  "Reserva creada.": "Booking created.",
  "Reserva cancelada.": "Booking canceled.",
  "Espacio actualizado.": "Workspace updated.",
  "Espacio creado.": "Workspace created.",
  "Espacio archivado.": "Workspace archived.",
  "Espacio reactivado.": "Workspace restored.",
  "¿Quieres archivar “{name}”?": "Do you want to archive “{name}”?",
  "No se pudo guardar la reserva": "Could not save the booking",
  "No se pudo cancelar la reserva": "Could not cancel the booking",
  "No se pudo guardar el espacio": "Could not save the workspace",
  "No se pudo archivar el espacio": "Could not archive the workspace",
  "No se pudo reactivar el espacio": "Could not restore the workspace",
  // Landing page
  "Espacios": "Spaces",
  "Cómo funciona": "How it works",
  "Seguridad": "Security",
  "Planes": "Pricing",
  "Reservar": "Book now",
  "Empezar a reservar": "Start booking",
  "Elige tu espacio": "Choose your space",
  "Reserva tu horario": "Book your schedule",
  "Confirmado": "Confirmed",
  "Planes a tu medida": "Plans tailored to you",
  "Facturación mensual": "Monthly billing",
  "Facturación anual": "Annual billing",
  "Para profesionales independientes que buscan flexibilidad total.": "For independent professionals seeking total flexibility.",
  "Para equipos y creadores con necesidad de salas privadas recurrentes.": "For teams and creators needing recurring private spaces.",
  "Para compañías que gestionan múltiples departamentos y plantas.": "For companies managing multiple departments and floors.",
  "Acceso a escritorios flexibles": "Access to flexible desks",
  "Historial de reservas activas": "Active bookings history",
  "Acceso en horario comercial": "Business hours access",
  "Todo lo del plan Starter": "Everything in Starter",
  "Salas de juntas y cabinas de silencio": "Meeting rooms and quiet booths",
  "Prioridad de disponibilidad": "Priority availability",
  "Soporte técnico preferente": "Priority technical support",
  "Cancelación flexible hasta 1h antes": "Flexible cancellation up to 1h before",
  "Todo lo del plan Pro": "Everything in Pro",
  "Gestión de roles y miembros de equipo": "Role and team member management",
  "Panel de administración y auditoría": "Admin and audit panel",
  "Límites de reserva personalizados": "Custom booking limits",
  "¿Listo para reservar sin complicaciones?": "Ready to book without complications?",
  "Cookies": "Cookies",
  "Empresa": "Business",
  "Un espacio para cada forma de trabajar": "A space for every way of working",
  "Reserva un escritorio para concentrarte, una sala para reunirte con tu equipo o una cabina para tu próxima llamada.": "Book a desk to focus, a room to meet with your team, or a booth for your next call.",
  "Personas trabajando en escritorios compartidos": "People working at shared desks",
  "Encuentra tu espacio": "Find your space",
  "Escritorios flexibles": "Flexible desks",
  "Instálate con tu portátil y avanza en tus proyectos a tu ritmo.": "Set up your laptop and work on your projects at your own pace.",
  "Salas de reuniones": "Meeting rooms",
  "Reúne a tu equipo para planear, presentar o tomar decisiones juntos.": "Bring your team together to plan, present, or make decisions.",
  "Cabinas privadas": "Private booths",
  "Encuentra un lugar tranquilo para llamadas y videollamadas.": "Find a quiet spot for phone and video calls.",
  "Consulta el tipo de espacio, su capacidad y los detalles antes de elegir.": "Check the type, capacity, and details before choosing a space.",
  "Selecciona una fecha y elige una franja disponible de 1 a 4 horas.": "Choose a date and an available time slot of 1 to 4 hours.",
  "Consulta tu reserva": "Check your booking",
  "Revisa en Mis reservas dónde y a qué hora tienes agendado tu espacio.": "Open My bookings to check where and when your space is booked.",
  "Administra tu coworking en un solo lugar": "Manage your coworking space in one place",
  "Crea, edita y archiva espacios del catálogo.": "Create, edit, and archive spaces in your catalog.",
  "Consulta y filtra las reservas de todos los espacios.": "View and filter bookings across all spaces.",
  "Consulta las cuentas de miembros y administradores.": "View member and administrator accounts.",
  "Crea tu cuenta y agenda el lugar para tu próxima jornada de trabajo.": "Create an account and book a space for your next workday.",
  "Navegación del pie de página": "Footer navigation",
  "Tarifas de referencia para profesionales, equipos y empresas.": "Indicative pricing for professionals, teams, and businesses.",
  "Periodo de facturación": "Billing period",
  "año": "year",
  "mes": "month",
  "Equivale a {price} al mes": "Equivalent to {price} per month",
  "Pago mensual": "Paid monthly",
  "Abrir menú": "Open menu",
  "Cerrar menú": "Close menu",
};

const languageListeners = new Set<() => void>();

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getLanguageSnapshot(): Language {
  return window.localStorage.getItem("cospace-language") === "en" ? "en" : "es";
}

function getServerLanguageSnapshot(): Language {
  return "es";
}

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: Readonly<{ children: ReactNode }>) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem("cospace-language", nextLanguage);
    languageListeners.forEach((listener) => listener());
  }, []);

  const t = useCallback(
    (text: string) => (language === "en" ? translations[text] ?? text : text),
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
