'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ==========================================
// 1. ABRIR CAJA
// ==========================================
export async function openCashSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: employee } = await supabase
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee || employee.role !== 'owner') {
    return { error: 'Solo el dueño puede abrir la caja.' }
  }

  // Verificamos que no haya una caja abierta
  const adminClient = createAdminClient()
  const { data: existingSession } = await adminClient
    .from('cash_sessions')
    .select('id')
    .eq('store_id', employee.store_id)
    .eq('status', 'open')
    .maybeSingle()

  if (existingSession) {
    return { error: 'Ya hay una caja abierta. Debes cerrarla antes de abrir otra.' }
  }

  const initialAmount = parseFloat(formData.get('initial_amount') as string) || 0

  const { error } = await adminClient
    .from('cash_sessions')
    .insert({
      store_id: employee.store_id,
      opened_by: user.id,
      initial_amount: initialAmount,
      status: 'open'
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ==========================================
// 2. CERRAR CAJA
// ==========================================
export async function closeCashSession(sessionId: string, finalAmount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const adminClient = createAdminClient()

  // Calcular el dinero esperado en caja (solo efectivo)
  // 1. Dinero inicial
  const { data: session } = await adminClient
    .from('cash_sessions')
    .select('initial_amount')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Sesión de caja no encontrada.' }

  // 2. Ventas en efectivo de esta sesión
  const { data: sales } = await adminClient
    .from('sales')
    .select('total')
    .eq('cash_session_id', sessionId)
    .eq('payment_method', 'efectivo')

  const cashSales = sales?.reduce((acc, s) => acc + Number(s.total), 0) || 0

  // 3. Abonos en efectivo de esta sesión
  const { data: payments } = await adminClient
    .from('credit_payments')
    .select('amount')
    .eq('cash_session_id', sessionId)
    .eq('payment_method', 'efectivo')

  const cashPayments = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0

  // 4. Dinero esperado
  const expectedAmount = Number(session.initial_amount) + cashSales + cashPayments

  // Actualizar la sesión
  const { error } = await adminClient
    .from('cash_sessions')
    .update({
      closed_at: new Date().toISOString(),
      final_amount: finalAmount,
      expected_amount: expectedAmount,
      status: 'closed'
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true, expectedAmount }
}