export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { POSClient } from './POSClient'
import { Button } from '@/components/ui/Button'
import { History } from 'lucide-react'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('name', { ascending: true })

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Punto de Venta</h1>
          <p className="text-zinc-500">Registra nuevas ventas y actualiza el inventario.</p>
        </div>
        <Link href="/dashboard/ventas/historial">
          <Button variant="outline" className="gap-2 bg-white">
            <History size={18} /> Ver Historial
          </Button>
        </Link>
      </div>
      <POSClient initialProducts={products || []} />
    </div>
  )
}