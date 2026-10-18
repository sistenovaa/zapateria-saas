export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Package, ShoppingCart, AlertCircle, Link as LinkIcon, ExternalLink, TrendingUp, Trophy } from 'lucide-react'

// Helper para formatear moneda
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
    .select('id, slug, name')
    .eq('owner_id', user?.id)
    .single()

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

  // 2. Productos en stock y alertas
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

  // 3. Productos más vendidos (Top 3)
  const { data: topSellingData } = await supabase
    .from('sale_items')
    .select(`
      product_name,
      quantity,
      sales!inner (store_id)
    `)
    .eq('sales.store_id', store?.id)

  // Agrupar y sumar por nombre de producto
  const salesByProduct = topSellingData?.reduce((acc: any, item) => {
    if (!acc[item.product_name]) {
      acc[item.product_name] = 0
    }
    acc[item.product_name] += item.quantity
    return acc
  }, {})

  const topProducts = Object.entries(salesByProduct || {})
    .map(([name, quantity]) => ({ name, quantity: quantity as number }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const publicUrl = `${baseUrl}/tienda/${store?.slug}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bienvenido de nuevo</h1>
        <p className="text-zinc-500">Aquí tienes el resumen de tu tienda hoy.</p>
      </div>

      {/* BANNER DE CATÁLOGO PÚBLICO */}
      <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <LinkIcon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Tu catálogo está en línea</h3>
            <p className="text-emerald-100 text-sm">Comparte este enlace con tus clientes.</p>
          </div>
        </div>
        <a 
          href={publicUrl} 
          target="_blank" 
          rel="noreferrer"
          className="bg-white text-emerald-700 hover:bg-zinc-50 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <ExternalLink size={16} />
          Abrir Catálogo
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventas de hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Ventas de Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{formatCOP(todayTotal)}</div>
            <p className="text-xs text-zinc-500 mt-1">{todayCount} {todayCount === 1 ? 'transacción' : 'transacciones'}</p>
          </CardContent>
        </Card>
        
        {/* Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Productos en Stock</CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{totalProducts || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Pares activos en inventario</p>
          </CardContent>
        </Card>
        
        {/* Alertas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Alertas de Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{lowStockProducts || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Productos con menos de 3 pares</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* TOP PRODUCTOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} /> Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">Aún no hay ventas registradas.</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-zinc-200 text-zinc-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{p.name}</p>
                    </div>
                    <div className="text-sm font-bold text-zinc-900">
                      {p.quantity} u.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ACCESO RÁPIDO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} /> Accesos Rápidos
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
      </div>
    </div>
  )
}