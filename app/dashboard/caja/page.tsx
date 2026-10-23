export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CashRegister } from './CashRegister'
import { Wallet, Banknote, CreditCard, ArrowRightLeft, Smartphone, DollarSign, Receipt, Calculator, Users, Clock } from 'lucide-react'

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

  const isOwner = employee.role === 'owner'

  // ==========================================
  // VISTA PARA EL DUEÑO: Lista de cajas abiertas
  // ==========================================
  if (isOwner) {
    // 1. Buscamos las cajas abiertas de los CAJEROS (excluyendo al dueño actual)
    const { data: openSessions } = await adminClient
      .from('cash_sessions')
      .select('*')
      .eq('store_id', employee.store_id)
      .eq('status', 'open')
      .neq('opened_by', user.id) // Excluimos la caja del propio dueño
      .order('opened_at', { ascending: false })

    // 2. Buscamos la caja del PROPIO DUEÑO
    const { data: mySession } = await adminClient
      .from('cash_sessions')
      .select('*')
      .eq('store_id', employee.store_id)
      .eq('opened_by', user.id)
      .eq('status', 'open')
      .maybeSingle()

    // 3. Enriquecer cajas de cajeros con email y balance
    const cashierSessions = await Promise.all(
      (openSessions || []).map(async (session) => {
        // Obtener email del cajero
        const { data: userData } = await adminClient.auth.admin.getUserById(session.opened_by)
        
        // Obtener ventas de esta caja
        const { data: sales } = await adminClient
          .from('sales')
          .select('total')
          .eq('cash_session_id', session.id)
        const totalSales = sales?.reduce((acc, s) => acc + Number(s.total), 0) || 0

        // Obtener abonos de esta caja
        const { data: payments } = await adminClient
          .from('credit_payments')
          .select('amount')
          .eq('cash_session_id', session.id)
        const totalPayments = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0

        return {
          ...session,
          cashier_email: userData?.user?.email || 'Cajero',
          total_sales: totalSales,
          total_payments: totalPayments,
          grand_total: totalSales + totalPayments
        }
      })
    )

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Wallet className="text-emerald-600" size={24} /> Supervisión de Cajas
          </h1>
          <p className="text-zinc-500">Revisa el estado de las cajas de tus cajeros y abre tu propia caja.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">Mi Caja</h2>
          <CashRegister currentSession={mySession} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">Cajas de Cajeros Abiertas</h2>
          
          {cashierSessions.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-500">
              No hay cajas de cajeros abiertas en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cashierSessions.map((session) => {
                const openedTime = new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' }).format(new Date(session.opened_at))

                return (
                  <div key={session.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 truncate max-w-[150px]">{session.cashier_email}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock size={12} /> {openedTime}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-wider">
                        Abierta
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Base Inicial:</span>
                        <span className="font-medium text-zinc-900">{formatCOP(session.initial_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Ventas:</span>
                        <span className="font-medium text-zinc-900">{formatCOP(session.total_sales)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Abonos:</span>
                        <span className="font-medium text-zinc-900">{formatCOP(session.total_payments)}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-zinc-100 flex justify-between items-center bg-zinc-50 -mx-6 -mb-6 px-6 py-3 rounded-b-xl">
                      <span className="text-sm font-medium text-zinc-600">Total Caja:</span>
                      <span className="text-lg font-bold text-emerald-600">{formatCOP(session.initial_amount + session.grand_total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // VISTA PARA EL CAJERO: Su propia caja
  // ==========================================
  // ... (El resto del código de la vista del cajero se mantiene exactamente igual)
  const { data: currentSession } = await adminClient
    .from('cash_sessions')
    .select('*')
    .eq('store_id', employee.store_id)
    .eq('opened_by', user.id)
    .eq('status', 'open')
    .maybeSingle()

  let salesBreakdown = { cash: 0, card: 0, transfer: 0, nequi: 0 }
  let paymentsBreakdown = { cash: 0, card: 0, transfer: 0, nequi: 0 }
  let totalSales = 0
  let totalPayments = 0

  if (currentSession) {
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
            <Wallet className="text-emerald-600" size={24} /> Mi Caja
          </h1>
          <p className="text-zinc-500">Abre y cierra tu turno de caja para llevar un control exacto del efectivo.</p>
        </div>
      </div>

      <CashRegister currentSession={currentSession} />

      {currentSession && (
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full">
                <Calculator size={32} />
              </div>
              <div>
                <p className="text-zinc-400 font-medium uppercase tracking-wider text-sm">Ingresos de mi Turno</p>
                <p className="text-4xl font-bold">{formatCOP(grandTotal)}</p>
              </div>
            </div>
            <div className="text-sm text-zinc-400 text-right">
              <p>Ventas: <span className="text-white font-medium">{formatCOP(totalSales)}</span></p>
              <p>Abonos: <span className="text-white font-medium">{formatCOP(totalPayments)}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-zinc-500" /> Mis Ventas
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

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-zinc-500" /> Mis Abonos
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