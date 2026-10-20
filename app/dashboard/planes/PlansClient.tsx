'use client'

import { useState, useEffect } from 'react'
import { PLANS, PlanId } from '@/lib/plans'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'
import { PaymentModal } from '@/components/ui/PaymentModal'

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(value)
}

interface PlansClientProps {
  currentPlanId: string
  initialSelectedPlan?: string | null
}

export function PlansClient({ currentPlanId, initialSelectedPlan }: PlansClientProps) {
  // Inicializamos el estado directamente con el plan que viene de la URL
  const [selectedPlan, setSelectedPlan] = useState<{ id: PlanId, name: string } | null>(() => {
    if (initialSelectedPlan) {
      const plan = PLANS[initialSelectedPlan as keyof typeof PLANS]
      if (plan) {
        return { id: plan.id, name: plan.name }
      }
    }
    return null
  })

  const handlePlanClick = (planId: PlanId, planName: string) => {
    if (planId === 'free') {
      alert('Para volver al plan gratuito, contacta a soporte (esto cancela tu suscripción actual).')
      return
    }
    setSelectedPlan({ id: planId, name: planName })
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          
          return (
            <div 
              key={plan.id} 
              className={`rounded-2xl border p-6 flex flex-col relative bg-white ${
                plan.highlighted ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-zinc-200 shadow-sm'
              } ${isCurrent ? 'ring-2 ring-zinc-900 ring-offset-2' : ''}`}
            >
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
                onClick={() => handlePlanClick(plan.id as PlanId, plan.name)}
              >
                {isCurrent ? 'Plan Actual' : plan.price === 0 ? 'Volver al Gratis' : 'Pagar con Nequi / Bre-B'}
              </Button>
            </div>
          )
        })}
      </div>

      <PaymentModal 
        isOpen={!!selectedPlan} 
        onClose={() => setSelectedPlan(null)} 
        planName={selectedPlan?.name || ''} 
      />
    </>
  )
}