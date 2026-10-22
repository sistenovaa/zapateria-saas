'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Loader2, Settings2, CalendarDays } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/Alert'
import { updateStorePlan } from './actions' // 👈 Importamos la Server Action

export function PlanSelector({ storeId, currentPlanId }: { storeId: string, currentPlanId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  const router = useRouter()

  const plans = [
    { id: 'free', name: 'Gratis' },
    { id: 'pro', name: 'Básico (Pro)' },
    { id: 'premium', name: 'Premium' },
  ]

  function handleSelectPlan(planId: string) {
    if (planId === currentPlanId) {
      setIsOpen(false)
      setSelectedPlan(null)
      return
    }
    
    if (planId === 'free') {
      updatePlan(planId, null)
    } else {
      setSelectedPlan(planId)
    }
  }

  async function updatePlan(newPlanId: string, dateStr: string | null) {
    setIsLoading(true)
    setIsOpen(false)
    setSelectedPlan(null)

    const result = await updateStorePlan(storeId, newPlanId, dateStr)

    if (result.error) {
      showError('Error al actualizar el plan: ' + result.error)
      setIsLoading(false)
      return
    }

    showSuccess('Plan actualizado', `El plan se ha activado correctamente.`)
    router.refresh()
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className="relative inline-block text-left">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || !!selectedPlan}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-600 disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Settings2 size={16} />}
        Cambiar Plan
        <ChevronDown size={14} className="opacity-70" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl bg-zinc-800 border border-zinc-600 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Cambiar a:
              </div>
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-lg transition-colors ${
                    currentPlanId === plan.id 
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                      : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {plan.name}
                  {currentPlanId === plan.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CalendarDays className="text-emerald-500" size={20} />
                Registrar Pago
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Has seleccionado el plan <strong className="text-white">{selectedPlan.toUpperCase()}</strong>. 
                Ingresa la fecha en la que recibiste el dinero.
              </p>

              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-sm font-medium text-zinc-300">Fecha de pago recibido</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => updatePlan(selectedPlan, paymentDate)}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Guardar y Activar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}