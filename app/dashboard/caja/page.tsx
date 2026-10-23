export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CashRegister } from './CashRegister'
import { Wallet, Banknote, CreditCard, ArrowRightLeft, Smartphone, DollarSign, Receipt, Calculator } from 'lucide-react'

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(value)
}

export default async function CajaPage() {
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

  // Buscamos si hay una sesión de caja abierta
  const { data: currentSession } = await adminClient
    .from('cash_sessions')
    .select('*')
    .eq('store_id', employee.store_id)
    .eq('status', 'open')
    .maybeSingle()

  // Variables para el desglose
  let salesBreakdown = { cash: 0, card: 0, transfer: 0, nequi: 0, mixto: 0 }
  let paymentsBreakdown = { cash: 0, card: 0, transfer: 0, nequi: 0 }
  let totalSales = 0
  let totalPayments = 0

  if (currentSession) {
    // 1. Obtener Ventas del turno
    const { data: sessionSales } = await adminClient
      .from('sales')
      .select('payment_method, total, payment_details')
      .eq('cash_session_id', currentSession.id)

    sessionSales?.forEach(s => {
      totalSales += Number(s.total)
      if (s.payment_method === 'efectivo') salesBreakdown.cash += Number(s.total)
      if (s.payment_method === 'tarjeta') salesBreakdown.card += Number(s.total)
      if (s.payment_method === 'transferencia') salesBreakdown.transfer += Number(s.total)
      if (s.payment_method === 'nequi') salesBreakdown.nequi += Number(s.total)
      if (s.payment_method === 'mixto' && s.payment_details) {
        salesBreakdown.cash += Number(s.payment_details.cash || 0)
        salesBreakdown.card += Number(s.payment_details.card || 0)
      }
    })

    // 2. Obtener Abonos del turno
    const { data: sessionPayments } = await adminClient
      .from('credit_payments')
      .select('payment_method, amount')
      .eq('cash_session_id', currentSession.id)

    sessionPayments?.forEach(p => {
      totalPayments += Number(p.amount)
      if (p.payment_method === 'efectivo') paymentsBreakdown.cash += Number(p.amount)
      if (p.payment_method === 'tarjeta') paymentsBreakdown.card += Number(p.amount)
      if (p.payment_method === 'transferencia') paymentsBreakdown.transfer += Number(p.amount)
      if (p.payment_method === 'nequi') paymentsBreakdown.nequi += Number(p.amount)
    })
  }

  const grandTotal = totalSales + totalPayments

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Wallet className="text-emerald-600" size={24} /> Control de Caja
          </h1>
          <p className="text-zinc-500">Abre y cierra tu turno de caja para llevar un control exacto del efectivo.</p>
        </div>
      </div>

      <CashRegister currentSession={currentSession} />

      {currentSession && (
        <div className="space-y-6">
          {/* GRAN TOTAL (Tarjeta destacada) */}
          <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full">
                <Calculator size={32} />
              </div>
              <div>
                <p className="text-zinc-400 font-medium uppercase tracking-wider text-sm">Ingresos Totales del Turno</p>
                <p className="text-4xl font-bold">{formatCOP(grandTotal)}</p>
              </div>
            </div>
            <div className="text-sm text-zinc-400 text-right">
              <p>Ventas: <span className="text-white font-medium">{formatCOP(totalSales)}</span></p>
              <p>Abonos: <span className="text-white font-medium">{formatCOP(totalPayments)}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DESGLOSE DE VENTAS */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-zinc-500" /> Ventas del Turno
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><Banknote size={16}/> Efectivo</span>
                  <span className="font-medium text-emerald-600">{formatCOP(salesBreakdown.cash)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><CreditCard size={16}/> Tarjeta</span>
                  <span className="font-medium text-blue-600">{formatCOP(salesBreakdown.card)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><ArrowRightLeft size={16}/> Transferencia</span>
                  <span className="font-medium text-purple-600">{formatCOP(salesBreakdown.transfer)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><Smartphone size={16}/> Nequi / Bre-B</span>
                  <span className="font-medium text-pink-600">{formatCOP(salesBreakdown.nequi)}</span>
                </div>
              </div>
            </div>

            {/* DESGLOSE DE ABONOS */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-zinc-500" /> Abonos del Turno
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><Banknote size={16}/> Efectivo</span>
                  <span className="font-medium text-emerald-600">{formatCOP(paymentsBreakdown.cash)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><CreditCard size={16}/> Tarjeta</span>
                  <span className="font-medium text-blue-600">{formatCOP(paymentsBreakdown.card)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><ArrowRightLeft size={16}/> Transferencia</span>
                  <span className="font-medium text-purple-600">{formatCOP(paymentsBreakdown.transfer)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-zinc-600"><Smartphone size={16}/> Nequi / Bre-B</span>
                  <span className="font-medium text-pink-600">{formatCOP(paymentsBreakdown.nequi)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}