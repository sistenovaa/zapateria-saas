export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PlansClient } from './PlansClient'

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('plan_id')
    .eq('owner_id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mejorar mi Plan</h1>
          <p className="text-zinc-500">Elige el plan que mejor se adapte a tu zapatería.</p>
        </div>
      </div>

      {/* Aquí llamamos al componente interactivo que tiene el modal */}
      <PlansClient currentPlanId={store?.plan_id || 'free'} />
    </div>
  )
}