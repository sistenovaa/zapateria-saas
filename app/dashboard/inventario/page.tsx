export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InventoryTable } from './InventoryTable'
import { PLANS } from '@/lib/plans'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id, plan_id')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  const plan = PLANS[store.plan_id as keyof typeof PLANS] || PLANS.free

  // 👈 QUITAMOS EL FILTRO DE VARIANTES INACTIVAS
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants (*)
    `)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div>
      <InventoryTable 
        initialProducts={products || []} 
        plan={plan}
      />
    </div>
  )
}