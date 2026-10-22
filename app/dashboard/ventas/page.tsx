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

  // 1. Obtener tienda y rol
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

  // 2. Traer productos con sus variantes
  const { data: products } = await adminClient
    .from('products')
    .select(`
      *,
      variants:product_variants (*)
    `)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const productsWithStock = (products || []).filter(p => 
    p.variants && p.variants.some((v: any) => v.stock > 0)
  )

  // 3. Traer clientes para el módulo de créditos
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