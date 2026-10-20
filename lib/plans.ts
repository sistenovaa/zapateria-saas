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
      'Punto de Venta (Solo Efectivo)',
      'Catálogo público con WhatsApp',
      'Reportes básicos',
      '1 Usuario (Dueño)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Básico',
    price: 39900,
    description: 'Para zapaterías en crecimiento.',
    maxProducts: null,
    maxSalesPerMonth: null,
    features: [
      'Productos ilimitados',
      'Ventas ilimitadas',
      'Punto de Venta con métodos de pago (Tarjeta, Nequi, etc.)',
      'Catálogo público sin marca de agua',
      'Exportación a Excel (CSV)',
      'Reportes gráficos de ventas',
      '1 Usuario (Dueño)',
    ],
    highlighted: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 59900,
    description: 'Control total de tu negocio.',
    maxProducts: null,
    maxSalesPerMonth: null,
    features: [
      'Todo lo del plan Básico',
      'Múltiples usuarios y roles (Cajeros, Bodegueros)',
      'Manejo de múltiples sucursales',
      'Variantes de productos (Tallas/Colores) y Código de Barras',
      'Proveedores y Compras',
      'Kardex (Historial de movimientos de inventario)',
      'Cuentas por cobrar (Créditos)',
      'Apertura y cierre de caja',
    ],
  },
}