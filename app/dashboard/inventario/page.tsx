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

  // Hacemos la consulta de productos
  const { data: productsData, error } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants (*)
    `)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error cargando inventario:", error)
  }

  // 👈 Aseguramos que 'variants' siempre sea un array y no un objeto o null
  const products = (productsData || []).map(p => ({
    ...p,
    variants: Array.isArray(p.variants) ? p.variants : (p.variants ? [p.variants] : [])
  }))

  return (
    <div>
      <InventoryTable 
        initialProducts={products} 
        plan={plan}
      />
    </div>
  )
}