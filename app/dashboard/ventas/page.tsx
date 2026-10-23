export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { POSClient } from './POSClient'
import { PLANS } from '@/lib/plans'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: employee } = await adminClient
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) redirect('/onboarding')

  const { data: store } = await adminClient
    .from('stores')
    .select('id, plan_id')
    .eq('id', employee.store_id)
    .single()

  if (!store) redirect('/onboarding')

  const plan = PLANS[store.plan_id as keyof typeof PLANS] || PLANS.free

  // 👈 FILTRAMOS LAS VARIANTES ACTIVAS
  const { data: products } = await adminClient
    .from('products')
    .select(`
      *,
      variants:product_variants (*)
    `)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .eq('variants.is_active', true) // 👈 Solo variantes activas
    .order('name', { ascending: true })

  // Filtramos para dejar solo productos que tengan al menos una variante con stock > 0
  const productsWithStock = (products || []).filter(p => 
    p.variants && p.variants.length > 0 && p.variants.some((v: any) => v.stock > 0)
  )

  const { data: customers } = await adminClient
    .from('customers')
    .select('id, name')
    .eq('store_id', store.id)
    .order('name', { ascending: true })

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900">Punto de Venta</h1>
        <p className="text-zinc-500">Registra nuevas ventas y actualiza el inventario en tiempo real.</p>
      </div>
      
      <POSClient 
        initialProducts={productsWithStock} 
        plan={plan} 
        customers={customers || []}
      />
    </div>
  )
}