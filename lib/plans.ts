export type PlanId = 'free' | 'pro' | 'premium'

export interface PlanLimits {
  id: PlanId
  name: string
  price: number
  description: string
  maxProducts: number | null
  maxSalesPerMonth: number | null
  features: string[]
  highlighted?: boolean
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    name: 'Gratis',
    price: 0,
    description: 'Para empezar a digitalizar tu zapatería.',
    maxProducts: 20,
    maxSalesPerMonth: 50,
    features: [
      'Hasta 20 productos en inventario',
      'Hasta 50 ventas al mes',
      'Catálogo público con WhatsApp',
      '1 Usuario (Dueño)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Básico',
    price: 49900,
    description: 'Para zapaterías en crecimiento.',
    maxProducts: null,
    maxSalesPerMonth: null,
    features: [
      'Productos ilimitados',
      'Ventas ilimitadas',
      'Catálogo público sin marca de agua',
      'Exportación a Excel (CSV)',
      'Reportes gráficos de ventas',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 69900,
    description: 'Control total de tu negocio (Próximamente).',
    maxProducts: null,
    maxSalesPerMonth: null,
    features: [
      'Todo lo del plan Básico',
      'Múltiples sucursales',
      'Usuarios y roles (Cajeros)',
      'Variantes (Talla/Color) y Código de Barras',
      'Proveedores y Compras',
      'Apertura/Cierre de caja y Kardex',
      'Métodos de pago (Efectivo, Tarjeta, Mixto)',
      'Cuentas por cobrar (Créditos)',
    ],
  },
}