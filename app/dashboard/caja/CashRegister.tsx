'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { openCashSession, closeCashSession } from './actions'
import { showSuccess, showError } from '@/components/ui/Alert'
import { Lock, Unlock, Calculator } from 'lucide-react'

interface CashSession {
  id: string
  opened_at: string
  initial_amount: number
  status: string
}

// 👈 COMPONENTE PARA EVITAR EL ERROR DE HIDRATACIÓN
function FormattedTime({ dateString }: { dateString: string }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <span>...</span>

  return <span>{new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' }).format(new Date(dateString))}</span>
}

export function CashRegister({ currentSession }: { currentSession: CashSession | null }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [initialAmount, setInitialAmount] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const [finalAmount, setFinalAmount] = useState('')

  async function handleOpen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append('initial_amount', initialAmount)

    const result = await openCashSession(formData)

    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Caja abierta', 'Ya puedes empezar a registrar ventas.')
      router.refresh()
    }
    setIsLoading(false)
  }

  async function handleClose() {
    if (!finalAmount) {
      showError('Ingresa el monto final contado en caja.')
      return
    }

    setIsLoading(true)
    const result = await closeCashSession(currentSession!.id, parseFloat(finalAmount))

    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Caja cerrada', 'El turno se ha cerrado correctamente.')
      setIsClosing(false)
      setFinalAmount('')
      router.refresh()
    }
    setIsLoading(false)
  }

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(value)
  }

  if (currentSession) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
              <Unlock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Caja Abierta</h2>
              <p className="text-sm text-zinc-500">
                {/* 👈 USAMOS EL COMPONENTE AQUÍ */}
                Abierta a las <FormattedTime dateString={currentSession.opened_at} /> con una base de {formatCOP(currentSession.initial_amount)}.
              </p>
            </div>
          </div>
          {!isClosing && (
            <Button onClick={() => setIsClosing(true)} variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
              <Lock size={18} /> Cerrar Caja
            </Button>
          )}
        </div>

        {isClosing && (
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Calculator size={18} className="text-zinc-500" /> Arqueo de Caja
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Cuenta todo el dinero físico que hay en la caja (incluyendo la base inicial) e ingresa el total aquí.
            </p>
            <div className="flex gap-3">
              <Input 
                type="number" 
                placeholder="Monto total contado" 
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
              />
              <Button onClick={handleClose} isLoading={isLoading} className="whitespace-nowrap bg-zinc-900">
                Confirmar Cierre
              </Button>
              <Button variant="ghost" onClick={() => setIsClosing(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-100 text-amber-700">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-900">Caja Cerrada</h2>
            <p className="text-sm text-amber-700">
              Debes abrir la caja con una base inicial para poder registrar ventas y movimientos.
            </p>
          </div>
        </div>
        <form onSubmit={handleOpen} className="flex gap-2 w-full sm:w-auto">
          <Input 
            type="number" 
            placeholder="Base inicial (Ej: 50000)" 
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            className="w-full sm:w-48"
            required
          />
          <Button type="submit" isLoading={isLoading} className="whitespace-nowrap">
            Abrir Caja
          </Button>
        </form>
      </div>
    </div>
  )
}