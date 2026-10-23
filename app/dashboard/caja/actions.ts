'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ==========================================
// 1. ABRIR CAJA (Individual por usuario)
// ==========================================
export async function openCashSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: employee } = await supabase
    .from('employees')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) return { error: 'Empleado no encontrado' }

  const adminClient = createAdminClient()
  
  // 👈 Verificamos si ESTE usuario ya tiene una caja abierta (no la tienda entera)
  const { data: existingSession } = await adminClient
    .from('cash_sessions')
    .select('id')
    .eq('store_id', employee.store_id)
    .eq('opened_by', user.id) // Filtramos por el usuario actual
    .eq('status', 'open')
    .maybeSingle()

  if (existingSession) {
    return { error: 'Ya tienes una caja abierta. Debes cerrarla antes de abrir otra.' }
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
  revalidatePath('/dashboard/caja')
  revalidatePath('/dashboard/ventas')
  return { success: true }
}

// ==========================================
// 2. CERRAR CAJA (Con cálculo exacto)
// ==========================================
export async function closeCashSession(sessionId: string, finalAmount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const adminClient = createAdminClient()

  // Usamos la función RPC que creamos en la base de datos para calcular el esperado
  const { data: summary, error: summaryError } = await adminClient.rpc('get_cash_session_summary', {
    p_session_id: sessionId
  })

  if (summaryError || !summary) {
    return { error: 'Error al calcular el resumen de caja: ' + (summaryError?.message || 'Desconocido') }
  }

  // summary.expected_cash trae el total exacto que debería haber en efectivo
  const expectedAmount = summary.expected_cash

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
  revalidatePath('/dashboard/caja')
  revalidatePath('/dashboard/ventas')
  return { success: true, expectedAmount, difference: finalAmount - expectedAmount }
}