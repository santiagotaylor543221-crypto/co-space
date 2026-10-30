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
  "Reserva de coworking": "Coworking bookings",
  "Reserva tu espacio. Trabaja sin fricción.": "Book your space. Work without friction.",
  "Gestiona la disponibilidad y reserva de entornos de trabajo compartido de forma controlada, inmediata y segura.": "Manage coworking space availability and bookings in a controlled, instant, and secure way.",
  "Empezar a reservar": "Start booking",
  "Ver cómo funciona": "See how it works",
  "Acceso controlado y seguro": "Controlled and secure access",
  "Type-safe de extremo a extremo": "End-to-end type safety",
  "Doble JWT en cookies seguras": "Dual JWT in secure cookies",
  "Infraestructura predecible con Docker": "Predictable Docker infrastructure",
  "Capacidades": "Capabilities",
  "Tecnología pensada para no fallar": "Technology built to never fail",
  "Visualiza qué puestos, salas y cabinas están libres al instante, sin esperas ni llamadas.": "See which desks, rooms, and booths are free instantly, without waiting or calls.",
  "Asignación de espacios": "Space assignment",
  "Gestión inteligente según aforo, tipo de jornada de trabajo y recursos técnicos requeridos.": "Smart allocation based on capacity, work schedule, and technical requirements.",
  "Reservas sin choques": "Conflict-free bookings",
  "Validación en base de datos para garantizar que nunca existan solapamientos de horario.": "Database validation to ensure no schedule overlaps ever happen.",
  "Acceso por usuario y roles": "User and role-based access",
  "Políticas claras para miembros, administradores y equipos con permisos dedicados.": "Clear policies for members, administrators, and teams with dedicated permissions.",
  "Flujo simple": "Simple workflow",
  "Elige tu espacio": "Choose your space",
  "Explora escritorios dedicados, salas de juntas y cabinas insonorizadas con aforos detallados.": "Explore dedicated desks, meeting rooms, and soundproof booths with detailed capacities.",
  "Reserva tu horario": "Book your schedule",
  "Selecciona fecha y franja de 1 a 4 horas dentro del horario comercial con confirmación inmediata.": "Pick a date and a 1 to 4 hour slot within business hours with instant confirmation.",
  "Llega y trabaja": "Arrive and work",
  "Accede a tu puesto con tu usuario autenticado, sin fricciones ni trámites presenciales.": "Access your workspace with your authenticated account, no friction or in-person paperwork.",
  "Simulación de Reserva": "Booking Simulation",
  "Escritorio Nómade 04": "Nomad Desk 04",
  "Confirmado": "Confirmed",
  "Seguridad en el borde": "Edge Security",
  "Protección estricta antes de llegar a tus datos": "Strict protection before reaching your data",
  "Bloqueo antes del servidor": "Edge blocking before the server",
  "El middleware proxy intercepta cada solicitud entrante, validando cabeceras y rutas antes de llegar a la lógica central.": "The proxy middleware inspects every incoming request, validating headers and routes before touching core logic.",
  "Doble JWT en cookies HTTP-Only": "Dual JWT in HTTP-Only cookies",
  "Tokens criptográficos de acceso y refresco aislados del navegador, imposibles de extraer mediante ataques XSS.": "Cryptographic access and refresh tokens isolated from the browser, immune to XSS attacks.",
  "Acceso controlado por usuario": "User-controlled access",
  "Cada espacio y reserva queda asociado a una identidad verificada, evitando accesos indebidos o uso anónimo.": "Every space and booking is tied to a verified identity, preventing unauthorized access or anonymous usage.",
  "Construido para no fallar": "Built not to fail",
  "Bajo el capó": "Under the hood",
  "Prisma, Zod y TypeScript garantizan que cada dato mantiene su estructura desde la base de datos hasta la interfaz.": "Prisma, Zod, and TypeScript guarantee every data point keeps its shape from database to UI.",
  "Infraestructura efímera y predecible": "Ephemeral and predictable infrastructure",
  "Contenedores Docker multi-stage con la aplicación desacoplada del almacenamiento persistente en PostgreSQL.": "Multi-stage Docker containers with the app cleanly decoupled from persistent PostgreSQL storage.",
  "Esquema Zod validado en servidor": "Server-validated Zod schema",
  "Métricas de confianza": "Trust metrics",
  "Resultados que respaldan la plataforma": "Results that back the platform",
  "Disponibilidad del sistema": "System uptime",
  "Arquitectura diseñada para alta tolerancia y respuesta instantánea.": "Architecture designed for high tolerance and instant response.",
  "Tiempo medio de reserva": "Average booking time",
  "Flujo simplificado de 3 pasos sin formularios innecesarios.": "Simplified 3-step flow without unnecessary forms.",
  "Cobertura de tipos": "Type coverage",
  "Validación estricta de esquema en cliente, servidor y base de datos.": "Strict schema validation across client, server, and database.",
  "Horas gestionadas": "Hours managed",
  "Espacios de trabajo reservados con cero choques de horario.": "Workspace bookings with zero schedule collisions.",
  "Experiencias": "Testimonials",
  "Lo que dicen los equipos": "What teams are saying",
  "Líder de Operaciones": "Operations Lead",
  "Ingeniero de Software Senior": "Senior Software Engineer",
  "Fundadora & Diseñadora": "Founder & Designer",
  "Menos fricción en reservas": "Less friction in bookings",
  "Seguridad en cookies": "Security in cookies",
  "Tiempo de reserva diario": "Daily booking time",
  "Antes perdíamos horas organizando qué sala estaba libre. Con co-space todo el equipo sabe exactamente dónde y cuándo sentarse sin cruzarse.": "We used to lose hours figuring out which room was free. With co-space the whole team knows exactly where and when to sit without clashes.",
  "Saber que los datos viajan con doble JWT y validación Zod de extremo a extremo nos da total tranquilidad para alojar a nuestros clientes.": "Knowing data travels with dual JWT and end-to-end Zod validation gives us complete peace of mind for our clients.",
  "La interfaz es limpia, luminosa y directa. Reservo mi puesto de trabajo en 30 segundos cada mañana antes de salir de casa.": "The interface is clean, bright, and direct. I book my desk in 30 seconds every morning before leaving home.",
  "Precios transparentes": "Transparent pricing",
  "Planes a tu medida": "Plans tailored to you",
  "Facturación mensual": "Monthly billing",
  "Facturación anual": "Annual billing",
  "Ahorra 2 meses": "Save 2 months",
  "Más popular": "Most popular",
  "Empezar gratis": "Get started free",
  "Elegir plan Pro": "Choose Pro plan",
  "Contactar equipo": "Contact team",
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
  "SLA garantizado del 99.9%": "Guaranteed 99.9% SLA",
  "¿Listo para reservar sin complicaciones?": "Ready to book without complications?",
  "Únete a co-space y gestiona tus reservas con la máxima seguridad y velocidad.": "Join co-space and manage your bookings with maximum security and speed.",
  "Sin tarjeta de crédito": "No credit card required",
  "Configuración instantánea": "Instant setup",
  "Contactar": "Contact",
  "Plataforma de reserva y gestión de espacios de coworking seguros, rápidos y type-safe.": "Platform for booking and managing coworking spaces: secure, fast, and type-safe.",
  "Producto": "Product",
  "Legal": "Legal",
  "Doble JWT": "Dual JWT",
  "Type-safe": "Type-safe",
  "Privacidad": "Privacy",
  "Términos de servicio": "Terms of service",
  "Cookies": "Cookies",
  "Todos los derechos reservados.": "All rights reserved.",
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
