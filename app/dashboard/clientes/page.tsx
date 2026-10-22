export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CustomerTable } from './CustomerTable'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // 1. Verificar que el usuario sea dueño
  const { data: employee } = await adminClient
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) redirect('/onboarding')
  if (employee.role !== 'owner') redirect('/dashboard')

  // 2. Traer los clientes con sus créditos y el historial de pagos de cada crédito
  const { data: customers } = await adminClient
    .from('customers')
    .select(`
      *,
      credits (
        *,
        payments:credit_payments (*)
      )
    `)
    .eq('store_id', employee.store_id)
    .order('name', { ascending: true })

  // Aseguramos que 'credits' y 'payments' siempre sean arrays
  const cleanCustomers = (customers || []).map(c => ({
    ...c,
    credits: (Array.isArray(c.credits) ? c.credits : (c.credits ? [c.credits] : [])).map((credit: any) => ({
      ...credit,
      payments: Array.isArray(credit.payments) ? credit.payments : (credit.payments ? [credit.payments] : [])
    }))
  }))

  return (
    <div>
      <CustomerTable initialCustomers={cleanCustomers} />
    </div>
  )
}