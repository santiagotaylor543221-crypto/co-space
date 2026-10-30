// Datos estructurados para la landing page (solo estructura, cifras e identificadores)
// Los textos visibles se traducen dinámicamente mediante el hook useI18n()

export interface TickerItem {
  id: string;
  translationKey: string;
}

export interface CapabilityItem {
  number: string;
  id: string;
  titleKey: string;
  descKey: string;
  iconName: 'clock' | 'grid' | 'check' | 'shield';
}

export interface StepItem {
  roman: string;
  id: string;
  titleKey: string;
  descKey: string;
}

export interface SecurityPillar {
  id: string;
  titleKey: string;
  descKey: string;
  iconName: 'shield' | 'key' | 'lock';
}

export interface MetricItem {
  id: string;
  value: string; // datos de ejemplo
  labelKey: string;
  descKey: string;
}

export interface TestimonialItem {
  id: string;
  author: string; // datos de ejemplo
  roleKey: string;
  company: string; // datos de ejemplo
  quoteKey: string;
  metricValue: string; // datos de ejemplo
  metricLabelKey: string;
}

export interface PricingPlan {
  id: string;
  nameKey: string;
  descKey: string;
  monthlyPrice: number; // datos de ejemplo
  annualPrice: number; // datos de ejemplo
  isPopular?: boolean;
  featureKeys: string[];
  ctaKey: string;
}

export interface FooterColumn {
  id: string;
  titleKey: string;
  links: { labelKey: string; href: string }[];
}

// 1. Elementos de la cinta en movimiento horizontal
export const TICKER_ITEMS: TickerItem[] = [
  { id: '1', translationKey: 'Disponibilidad en tiempo real' },
  { id: '2', translationKey: 'Reserva en menos de 1 minuto' },
  { id: '3', translationKey: 'Acceso controlado y seguro' },
  { id: '4', translationKey: 'Type-safe de extremo a extremo' },
  { id: '5', translationKey: 'Doble JWT en cookies seguras' },
  { id: '6', translationKey: 'Infraestructura predecible con Docker' },
];

// 2. Capacidades numeradas 01 a 04
export const CAPABILITIES: CapabilityItem[] = [
  {
    number: '01',
    id: 'realtime',
    titleKey: 'Disponibilidad en tiempo real',
    descKey: 'Visualiza qué puestos, salas y cabinas están libres al instante, sin esperas ni llamadas.',
    iconName: 'clock',
  },
  {
    number: '02',
    id: 'assignment',
    titleKey: 'Asignación de espacios',
    descKey: 'Gestión inteligente según aforo, tipo de jornada de trabajo y recursos técnicos requeridos.',
    iconName: 'grid',
  },
  {
    number: '03',
    id: 'no-collision',
    titleKey: 'Reservas sin choques',
    descKey: 'Validación en base de datos para garantizar que nunca existan solapamientos de horario.',
    iconName: 'check',
  },
  {
    number: '04',
    id: 'roles',
    titleKey: 'Acceso por usuario y roles',
    descKey: 'Políticas claras para miembros, administradores y equipos con permisos dedicados.',
    iconName: 'shield',
  },
];

// 3. Pasos con numeración romana I, II, III
export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    roman: 'I',
    id: 'choose',
    titleKey: 'Elige tu espacio',
    descKey: 'Explora escritorios dedicados, salas de juntas y cabinas insonorizadas con aforos detallados.',
  },
  {
    roman: 'II',
    id: 'book',
    titleKey: 'Reserva tu horario',
    descKey: 'Selecciona fecha y franja de 1 a 4 horas dentro del horario comercial con confirmación inmediata.',
  },
  {
    roman: 'III',
    id: 'work',
    titleKey: 'Llega y trabaja',
    descKey: 'Accede a tu puesto con tu usuario autenticado, sin fricciones ni trámites presenciales.',
  },
];

// 4. Pilares de seguridad en el borde
export const SECURITY_PILLARS: SecurityPillar[] = [
  {
    id: 'edge',
    titleKey: 'Bloqueo antes del servidor',
    descKey: 'El middleware proxy intercepta cada solicitud entrante, validando cabeceras y rutas antes de llegar a la lógica central.',
    iconName: 'shield',
  },
  {
    id: 'jwt',
    titleKey: 'Doble JWT en cookies HTTP-Only',
    descKey: 'Tokens criptográficos de acceso y refresco aislados del navegador, imposibles de extraer mediante ataques XSS.',
    iconName: 'key',
  },
  {
    id: 'access',
    titleKey: 'Acceso controlado por usuario',
    descKey: 'Cada espacio y reserva queda asociado a una identidad verificada, evitando accesos indebidos o uso anónimo.',
    iconName: 'lock',
  },
];

// 5. Pilares técnicos bajo el capó
export const TECH_PILLARS = [
  {
    id: 'typesafe',
    titleKey: 'Type-safe de extremo a extremo',
    descKey: 'Prisma, Zod y TypeScript garantizan que cada dato mantiene su estructura desde la base de datos hasta la interfaz.',
  },
  {
    id: 'edge-security',
    titleKey: 'Seguridad en el borde',
    descKey: 'Middleware perimetral y doble JWT en cookies HTTP-Only que bloquean accesos antes de tocar el servidor.',
  },
  {
    id: 'ephemeral',
    titleKey: 'Infraestructura efímera y predecible',
    descKey: 'Contenedores Docker multi-stage con la aplicación desacoplada del almacenamiento persistente en PostgreSQL.',
  },
];

export const TECH_BADGES = ['Next.js', 'TypeScript', 'Prisma', 'Zod', 'PostgreSQL', 'Docker'];

// Código ilustrativo y corto (esquema Zod)
export const ZOD_CODE_SNIPPET = `import { z } from "zod";

export const createBookingSchema = z.object({
  workspaceId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: "La hora fin debe ser posterior a la de inicio" }
);`;

// 6. Métricas ilustrativas
// datos de ejemplo
export const METRICS: MetricItem[] = [
  {
    id: 'uptime',
    value: '99.9%',
    labelKey: 'Disponibilidad del sistema',
    descKey: 'Arquitectura diseñada para alta tolerancia y respuesta instantánea.',
  },
  {
    id: 'speed',
    value: '< 1 min',
    labelKey: 'Tiempo medio de reserva',
    descKey: 'Flujo simplificado de 3 pasos sin formularios innecesarios.',
  },
  {
    id: 'typesafe-stat',
    value: '100%',
    labelKey: 'Cobertura de tipos',
    descKey: 'Validación estricta de esquema en cliente, servidor y base de datos.',
  },
  {
    id: 'hours',
    value: '2.4k+',
    labelKey: 'Horas gestionadas',
    descKey: 'Espacios de trabajo reservados con cero choques de horario.',
  },
];

// 7. Testimonios
// datos de ejemplo
export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    author: 'Elena Morales',
    roleKey: 'Líder de Operaciones',
    company: 'Nexus Studio',
    quoteKey: 'Antes perdíamos horas organizando qué sala estaba libre. Con co-space todo el equipo sabe exactamente dónde y cuándo sentarse sin cruzarse.',
    metricValue: '85%',
    metricLabelKey: 'Menos fricción en reservas',
  },
  {
    id: '2',
    author: 'Javier Castillo',
    roleKey: 'Ingeniero de Software Senior',
    company: 'DevFlow',
    quoteKey: 'Saber que los datos viajan con doble JWT y validación Zod de extremo a extremo nos da total tranquilidad para alojar a nuestros clientes.',
    metricValue: '100%',
    metricLabelKey: 'Seguridad en cookies',
  },
  {
    id: '3',
    author: 'Clara Domènech',
    roleKey: 'Fundadora & Diseñadora',
    company: 'Atelier Nord',
    quoteKey: 'La interfaz es limpia, luminosa y directa. Reservo mi puesto de trabajo en 30 segundos cada mañana antes de salir de casa.',
    metricValue: '< 30s',
    metricLabelKey: 'Tiempo de reserva diario',
  },
];

// 8. Planes de suscripción
// datos de ejemplo
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    nameKey: 'Starter',
    descKey: 'Para profesionales independientes que buscan flexibilidad total.',
    monthlyPrice: 0,
    annualPrice: 0,
    featureKeys: [
      'Acceso a escritorios flexibles',
      'Reservas de 1 a 4 horas',
      'Historial de reservas activas',
      'Acceso en horario comercial',
    ],
    ctaKey: 'Empezar gratis',
  },
  {
    id: 'pro',
    nameKey: 'Pro Member',
    descKey: 'Para equipos y creadores con necesidad de salas privadas recurrentes.',
    monthlyPrice: 29,
    annualPrice: 24,
    isPopular: true,
    featureKeys: [
      'Todo lo del plan Starter',
      'Salas de juntas y cabinas de silencio',
      'Prioridad de disponibilidad',
      'Soporte técnico preferente',
      'Cancelación flexible hasta 1h antes',
    ],
    ctaKey: 'Elegir plan Pro',
  },
  {
    id: 'enterprise',
    nameKey: 'Empresa',
    descKey: 'Para compañías que gestionan múltiples departamentos y plantas.',
    monthlyPrice: 89,
    annualPrice: 75,
    featureKeys: [
      'Todo lo del plan Pro',
      'Gestión de roles y miembros de equipo',
      'Panel de administración y auditoría',
      'Límites de reserva personalizados',
      'SLA garantizado del 99.9%',
    ],
    ctaKey: 'Contactar equipo',
  },
];

// 9. Columnas del Footer
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: 'product',
    titleKey: 'Producto',
    links: [
      { labelKey: 'Espacios', href: '#capacidades' },
      { labelKey: 'Cómo funciona', href: '#como-funciona' },
      { labelKey: 'Planes', href: '#planes' },
      { labelKey: 'Catálogo', href: '/dashboard' },
    ],
  },
  {
    id: 'security',
    titleKey: 'Seguridad',
    links: [
      { labelKey: 'Seguridad en el borde', href: '#seguridad' },
      { labelKey: 'Doble JWT', href: '#seguridad' },
      { labelKey: 'Type-safe', href: '#tecnologia' },
    ],
  },
  {
    id: 'legal',
    titleKey: 'Legal',
    links: [
      { labelKey: 'Privacidad', href: '#' },
      { labelKey: 'Términos de servicio', href: '#' },
      { labelKey: 'Cookies', href: '#' },
    ],
  },
];
