export interface PricingPlan {
  id: string;
  nameKey: string;
  descKey: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  isPopular?: boolean;
  featureKeys: string[];
}

// Tarifas de referencia en euros. La tarifa anual se expresa por mes para calcular el pago de 12 meses.
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    nameKey: 'Starter',
    descKey: 'Para profesionales independientes que buscan flexibilidad total.',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    featureKeys: [
      'Acceso a escritorios flexibles',
      'Reservas de 1 a 4 horas',
      'Historial de reservas activas',
      'Acceso en horario comercial',
    ],
  },
  {
    id: 'pro',
    nameKey: 'Pro Member',
    descKey: 'Para equipos y creadores con necesidad de salas privadas recurrentes.',
    monthlyPrice: 29,
    annualMonthlyPrice: 24,
    isPopular: true,
    featureKeys: [
      'Todo lo del plan Starter',
      'Salas de juntas y cabinas de silencio',
      'Prioridad de disponibilidad',
      'Soporte técnico preferente',
      'Cancelación flexible hasta 1h antes',
    ],
  },
  {
    id: 'enterprise',
    nameKey: 'Empresa',
    descKey: 'Para compañías que gestionan múltiples departamentos y plantas.',
    monthlyPrice: 89,
    annualMonthlyPrice: 75,
    featureKeys: [
      'Todo lo del plan Pro',
      'Gestión de roles y miembros de equipo',
      'Panel de administración y auditoría',
      'Límites de reserva personalizados',
    ],
  },
];
