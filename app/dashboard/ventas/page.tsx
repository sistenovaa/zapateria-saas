export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { POSClient } from './POSClient'

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

  // Solo traemos productos con stock mayor a 0 para el POS
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('name', { ascending: true })

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900">Punto de Venta</h1>
        <p className="text-zinc-500">Registra nuevas ventas y actualiza el inventario en tiempo real.</p>
      </div>
      <POSClient initialProducts={products || []} />
    </div>
  )
}