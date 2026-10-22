export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { KardexClient } from './KardexClient'

export default async function KardexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Verificar tienda y rol
  const { data: employee } = await supabase
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) redirect('/onboarding')
  if (employee.role !== 'owner') redirect('/dashboard') // Solo el dueño ve el Kardex

  // 2. Obtener movimientos con la info del producto y la variante
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select(`
      id,
      type,
      quantity,
      reason,
      created_at,
      variant:product_variants (
        size,
        color,
        product:products (
          name,
          brand
        )
      )
    `)
    .eq('store_id', employee.store_id)
    .order('created_at', { ascending: false })
    .limit(100) // Mostrar los últimos 100 movimientos

  // 3. Obtener variantes disponibles (con stock > 0) para el formulario
  const { data: variants } = await supabase
    .from('product_variants')
    .select(`
      id,
      size,
      color,
      stock,
      product:products!inner (
        name,
        brand,
        store_id
      )
    `)
    .eq('product.store_id', employee.store_id)
    .gt('stock', 0)
    .order('size', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventario" className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BookOpen className="text-emerald-600" size={24} /> Kardex de Inventario
          </h1>
          <p className="text-zinc-500">Registra pérdidas, robos o daños, y revisa el historial de movimientos.</p>
        </div>
      </div>

      <KardexClient 
        initialMovements={(movements as any) || []} 
        availableVariants={(variants as any) || []} 
      />
    </div>
  )
}