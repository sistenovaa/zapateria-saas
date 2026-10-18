export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './SettingsForm'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configuración de la Tienda</h1>
        <p className="text-zinc-500">Actualiza los datos de tu negocio.</p>
      </div>
      <SettingsForm store={store} />
    </div>
  )
}