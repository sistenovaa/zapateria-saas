export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/Button'
import { Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(value)
}

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

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = store?.plan_id === plan.id;
          
          return (
            <div 
              key={plan.id} 
              className={`rounded-2xl border p-6 flex flex-col relative bg-white ${
                plan.highlighted 
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' 
                  : 'border-zinc-200 shadow-sm'
              } ${isCurrent ? 'ring-2 ring-zinc-900 ring-offset-2' : ''}`}
            >
              {plan.highlighted && !isCurrent && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  Recomendado
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  Tu Plan Actual
                </div>
              )}
              
              <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
              <p className="text-sm text-zinc-500 mt-2 h-10">{plan.description}</p>
              
              <div className="my-6">
                <span className="text-4xl font-extrabold text-zinc-900">
                  {plan.price === 0 ? 'Gratis' : formatCOP(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-zinc-500 text-sm"> /mes</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check size={18} className="text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={isCurrent ? 'outline' : plan.highlighted ? 'primary' : 'outline'} 
                className={`w-full h-12 text-base ${isCurrent && 'opacity-50 cursor-not-allowed'}`}
                disabled={isCurrent}
              >
                {isCurrent ? 'Plan Actual' : plan.price === 0 ? 'Volver al Gratis' : 'Suscribirme'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}