export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { SettingsForm } from './SettingsForm'
import { BrandingForm } from './BrandingForm'

export default async function ConfiguracionPage() {
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
  if (employee.role !== 'owner') redirect('/dashboard')

  const { data: store } = await adminClient
    .from('stores')
    .select('*')
    .eq('id', employee.store_id)
    .single()

  if (!store) redirect('/onboarding')

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configuración</h1>
        <p className="text-zinc-500">Administra los datos de tu negocio y personaliza tu tienda.</p>
      </div>

      {/* Formulario de Datos Básicos y Cajeros */}
      <SettingsForm store={store} />

      {/* Formulario de Branding (Logo, Color, Descripción) */}
      <BrandingForm store={store} />
    </div>
  )
}