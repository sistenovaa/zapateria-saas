export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { POSClient } from './POSClient'
import { PLANS } from '@/lib/plans'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

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

  // 👈 BUSCAMOS LA CAJA DEL USUARIO ACTUAL (No la de la tienda)
  const { data: currentSession } = await adminClient
    .from('cash_sessions')
    .select('id')
    .eq('store_id', store.id)
    .eq('opened_by', user.id) // Filtramos por el cajero actual
    .eq('status', 'open')
    .maybeSingle()

  // Si no hay caja abierta para este usuario, lo bloqueamos
  if (!currentSession) {
    return (
      <div className="h-full flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-amber-100 text-amber-600 p-4 rounded-full mb-4">
          <Lock size={48} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Caja Cerrada</h2>
        <p className="text-zinc-500 max-w-md mb-6">
          Para poder registrar ventas o abonos, primero debes abrir tu turno de caja.
        </p>
        <Link href="/dashboard/caja">
          <Button>Abrir Caja Ahora</Button>
        </Link>
      </div>
    )
  }

  const plan = PLANS[store.plan_id as keyof typeof PLANS] || PLANS.free

  const { data: products } = await adminClient
    .from('products')
    .select(`
      *,
      variants:product_variants (*)
    `)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .eq('variants.is_active', true)
    .order('name', { ascending: true })

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
        sessionId={currentSession.id} // 👈 Pasamos el ID de la caja del cajero
      />
    </div>
  )
}