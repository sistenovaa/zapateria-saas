export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { POSClient } from './POSClient'
import { PLANS } from '@/lib/plans'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id, plan_id')
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

  // Obtenemos los límites del plan actual
  const plan = PLANS[store.plan_id as keyof typeof PLANS] || PLANS.free

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900">Punto de Venta</h1>
        <p className="text-zinc-500">Registra nuevas ventas y actualiza el inventario en tiempo real.</p>
      </div>
      
      {/* Pasamos el plan al componente del POS */}
      <POSClient 
        initialProducts={products || []} 
        plan={plan} 
      />
    </div>
  )
}