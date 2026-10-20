export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { PlansClient } from './PlansClient'

export default async function PlanesPage(props: { searchParams: Promise<{ pending?: string, plan?: string }> }) {
  const searchParams = await props.searchParams;
  const isPending = searchParams?.pending === 'true';
  const preselectedPlan = searchParams?.plan || null;

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

      {/* AVISO DE CUENTA PENDIENTE */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
          <Info className="mt-0.5 shrink-0" size={20} />
          <div>
            <h3 className="font-bold">¡Tu tienda fue creada con éxito!</h3>
            <p className="text-sm">Para activar tu plan de pago, por favor realiza la transferencia y envíanos el comprobante. Mientras tanto, tu cuenta tiene las funciones del Plan Gratuito.</p>
          </div>
        </div>
      )}

      {/* Le pasamos el plan preseleccionado al cliente para que abra el modal solo */}
      <PlansClient 
        currentPlanId={store?.plan_id || 'free'} 
        initialSelectedPlan={preselectedPlan} 
      />
    </div>
  )
}