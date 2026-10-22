export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PurchaseForm } from './PurchaseForm'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default async function ComprasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Usamos el Admin Client para evitar bloqueos de RLS
  const adminClient = createAdminClient()

  // 1. Verificar que el usuario sea dueño
  const { data: employee } = await adminClient
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) redirect('/onboarding')
  if (employee.role !== 'owner') redirect('/dashboard') // Solo dueños compran

  // 2. Traer Proveedores
  const { data: suppliers } = await adminClient
    .from('suppliers')
    .select('id, name')
    .eq('store_id', employee.store_id)
    .order('name', { ascending: true })

  // 3. Traer Productos con sus variantes
  const { data: products } = await adminClient
    .from('products')
    .select(`
      id,
      name,
      brand,
      purchase_price,
      variants:product_variants (*)
    `)
    .eq('store_id', employee.store_id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Aseguramos que las variantes siempre sean un array
  const cleanProducts = (products || []).map(p => ({
    ...p,
    variants: Array.isArray(p.variants) ? p.variants : (p.variants ? [p.variants] : [])
  }))

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventario" className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" size={24} /> Registrar Compra
          </h1>
          <p className="text-zinc-500">Ingresa mercancía nueva y suma stock a tu inventario.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <PurchaseForm 
          suppliers={suppliers || []} 
          initialProducts={cleanProducts} 
        />
      </div>
    </div>
  )
}