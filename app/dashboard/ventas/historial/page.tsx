export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SalesHistoryTable } from './SalesHistoryTable'

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  // 👈 AGREGAMOS 'payment_details' AL SELECT
  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id,
      total,
      created_at,
      payment_method,
      payment_details,
      sale_items (
        id,
        product_name,
        quantity,
        unit_price,
        subtotal
      )
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ventas" className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Historial de Ventas</h1>
          <p className="text-zinc-500">Revisa todas las transacciones realizadas en tu tienda.</p>
        </div>
      </div>

      <SalesHistoryTable sales={sales || []} />
    </div>
  )
}