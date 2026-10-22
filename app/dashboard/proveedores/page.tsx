export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { SupplierTable } from './SupplierTable'

export default async function ProveedoresPage() {
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
  if (employee.role !== 'owner') redirect('/dashboard') // Solo dueños ven proveedores

  // 2. Traer los proveedores de esta tienda
  const { data: suppliers } = await adminClient
    .from('suppliers')
    .select('*')
    .eq('store_id', employee.store_id)
    .order('name', { ascending: true })

  return (
    <div>
      <SupplierTable initialSuppliers={suppliers || []} />
    </div>
  )
}