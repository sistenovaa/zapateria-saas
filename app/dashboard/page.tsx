export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Package, ShoppingCart, AlertCircle, Link as LinkIcon, ExternalLink } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: store } = await supabase
    .from('stores')
    .select('id, slug, name')
    .eq('owner_id', user?.id)
    .single()

  // Obtener contadores reales para el dashboard
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
            <p className="text-emerald-100 text-sm">Comparte este enlace con tus clientes para que vean tus productos.</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Ventas de Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">$0.00</div>
            <p className="text-xs text-zinc-500 mt-1">Aún no hay ventas registradas</p>
          </CardContent>
        </Card>
        
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

      <div className="mt-8 p-8 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">¿Listo para vender?</h3>
        <p className="text-zinc-500 max-w-md mb-6">
          Usa el Punto de Venta para registrar tus ingresos y mantener tu inventario actualizado.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard/inventario">
            <Button variant="outline">Ver Inventario</Button>
          </Link>
          <Link href="/dashboard/ventas">
            <Button>Ir al Punto de Venta</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}