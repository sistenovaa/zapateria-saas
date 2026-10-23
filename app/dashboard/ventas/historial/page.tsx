export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SalesHistoryTable } from './SalesHistoryTable'

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // 1. Verificamos el rol y la tienda del empleado
  const { data: employee } = await adminClient
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) redirect('/onboarding')

  const isOwner = employee.role === 'owner'

  // 2. Construimos la consulta base
  let query = adminClient
    .from('sales')
    .select(`
      id,
      ticket_number,
      total,
      created_at,
      payment_method,
      payment_details,
      created_by,
      sale_items (
        id,
        product_name,
        quantity,
        unit_price,
        subtotal,
        size,
        color
      )
    `)
    .eq('store_id', employee.store_id)

  // 👈 LÓGICA DE FILTRADO: Si es cajero, solo ve sus ventas
  if (!isOwner) {
    query = query.eq('created_by', user.id)
  }

  const { data: sales } = await query.order('created_at', { ascending: false })

  // 3. Obtener los correos de los vendedores
  const salesWithEmails = await Promise.all(
    (sales || []).map(async (sale) => {
      if (!sale.created_by) return { ...sale, created_by: 'N/A' }
      
      const { data: userData } = await adminClient.auth.admin.getUserById(sale.created_by)
      return {
        ...sale,
        created_by: userData?.user?.email || 'N/A'
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ventas" className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Historial de Ventas</h1>
          <p className="text-zinc-500">
            {isOwner ? 'Revisa todas las transacciones realizadas en tu tienda.' : 'Revisa tus ventas realizadas en este turno.'}
          </p>
        </div>
      </div>

      <SalesHistoryTable sales={salesWithEmails} />
    </div>
  )
}