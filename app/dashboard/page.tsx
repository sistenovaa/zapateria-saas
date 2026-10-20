export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Package, ShoppingCart, AlertCircle, Link as LinkIcon, ExternalLink, TrendingUp, Trophy, Star } from 'lucide-react'
import { SalesChart } from './SalesChart'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PLANS } from '@/lib/plans'

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: store } = await supabase
    .from('stores')
    .select('id, slug, name, plan_id')
    .eq('owner_id', user?.id)
    .single()

  const plan = PLANS[store?.plan_id as keyof typeof PLANS] || PLANS.free

  // 1. Ventas de hoy
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todaySales } = await supabase
    .from('sales')
    .select('total')
    .eq('store_id', store?.id)
    .gte('created_at', today.toISOString())

  const todayTotal = todaySales?.reduce((acc, sale) => acc + Number(sale.total), 0) || 0
  const todayCount = todaySales?.length || 0

  // 2. Datos para el gráfico (últimos 7 días)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: weekSales } = await supabase
    .from('sales')
    .select('total, created_at')
    .eq('store_id', store?.id)
    .gte('created_at', sevenDaysAgo.toISOString())

  const chartDataMap = new Map()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    chartDataMap.set(dateStr, 0)
  }

  weekSales?.forEach(sale => {
    const d = new Date(sale.created_at)
    const dateStr = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    if (chartDataMap.has(dateStr)) {
      chartDataMap.set(dateStr, chartDataMap.get(dateStr) + Number(sale.total))
    }
  })

  const chartData = Array.from(chartDataMap, ([date, ventas]) => ({ date, ventas }))

  // 3. Productos en stock y alertas
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store?.id)
    .eq('is_active', true)

  const { count: lowStockProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store?.id)
    .eq('is_active', true)
    .lt('stock', 3)

  // 4. Ventas del mes (para el límite del plan)
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const { count: monthSalesCount } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store?.id)
    .gte('created_at', firstDayOfMonth.toISOString())

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const publicUrl = `${baseUrl}/tienda/${store?.slug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bienvenido de nuevo</h1>
        <p className="text-zinc-500">Aquí tienes el resumen de tu tienda hoy.</p>
      </div>

      {/* TARJETA DE PLAN CON BARRAS DE PROGRESO */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${store?.plan_id === 'free' ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-100 text-emerald-700'}`}>
              <Star size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Plan {plan.name}</h2>
              <p className="text-sm text-zinc-500">{plan.description}</p>
            </div>
          </div>
          {store?.plan_id === 'free' && (
            <Link href="/dashboard/planes">
              <Button variant="primary" className="whitespace-nowrap">Mejorar Plan</Button>
            </Link>
          )}
        </div>

        {/* BARRAS DE CONSUMO */}
        {store?.plan_id === 'free' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
            <ProgressBar
              current={totalProducts || 0}
              max={plan.maxProducts}
              label="Productos creados"
            />
            <ProgressBar
              current={monthSalesCount || 0}
              max={plan.maxSalesPerMonth}
              label="Ventas este mes"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Ventas de Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{formatCOP(todayTotal)}</div>
            <p className="text-xs text-zinc-500 mt-1">{todayCount} transacciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Productos en Stock</CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{totalProducts || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Pares activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Alertas de Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{lowStockProducts || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Menos de 3 pares</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} /> Tendencia de Ventas (Últimos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} /> Accesos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/dashboard/ventas">
              <Button className="w-full justify-start gap-3" variant="primary">
                <ShoppingCart size={18} /> Abrir Punto de Venta
              </Button>
            </Link>
            <Link href="/dashboard/inventario">
              <Button className="w-full justify-start gap-3" variant="outline">
                <Package size={18} /> Gestionar Inventario
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-sm flex flex-col justify-center">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <LinkIcon size={20} /> Catálogo Público
          </h3>
          <p className="text-emerald-100 text-sm mb-4">Comparte este enlace con tus clientes para que vean tus productos.</p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-white text-emerald-700 hover:bg-zinc-50 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors w-full"
          >
            <ExternalLink size={16} /> Abrir Catálogo
          </a>
        </div>
      </div>
    </div>
  )
}