'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ==========================================
// 1. CREAR CLIENTE
// ==========================================
export async function createCustomer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: employee } = await supabase
    .from('employees')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) return { error: 'Empleado no encontrado' }

  const customerData = {
    store_id: employee.store_id,
    name: formData.get('name') as string,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
  }

  const { error } = await supabase.from('customers').insert(customerData)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/clientes')
  return { success: true }
}

// ==========================================
// 2. ACTUALIZAR CLIENTE
// ==========================================
export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const customerData = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
  }

  const { error } = await supabase.from('customers').update(customerData).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/clientes')
  return { success: true }
}

// ==========================================
// 3. ELIMINAR CLIENTE
// ==========================================
export async function deleteCustomer(id: string) {
  const supabase = await createClient()
  
  const { count } = await supabase
    .from('credits')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', id)
    .eq('status', 'pending')

  if (count && count > 0) {
    return { error: 'No puedes eliminar un cliente con deudas pendientes.' }
  }

  const { error } = await supabase.from('customers').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/clientes')
  return { success: true }
}

// ==========================================
// 4. REGISTRAR ABONO (Con método de pago y caja)
// ==========================================
export async function registerPayment(creditId: string, amount: number, paymentMethod: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const adminClient = createAdminClient()

  // 👈 CORRECCIÓN: Buscamos la tienda en la tabla employees (sirve para dueños y cajeros)
  const { data: employee } = await adminClient
    .from('employees')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee) return { error: 'Empleado no encontrado.' }

  // Verificar caja abierta para ESTE usuario
  const { data: currentSession } = await adminClient
    .from('cash_sessions')
    .select('id')
    .eq('store_id', employee.store_id)
    .eq('opened_by', user.id) // 👈 La caja debe ser la del usuario actual
    .eq('status', 'open')
    .maybeSingle()

  if (!currentSession) {
    return { error: 'Debes abrir tu caja antes de registrar un abono.' }
  }

  // Obtener el crédito
  const { data: credit, error: creditError } = await adminClient
    .from('credits')
    .select('*')
    .eq('id', creditId)
    .single()

  if (creditError || !credit) {
    return { error: 'Crédito no encontrado.' }
  }

  if (amount <= 0) {
    return { error: 'El abono debe ser mayor a cero.' }
  }

  if (amount > credit.balance) {
    return { error: 'El abono no puede ser mayor al saldo pendiente.' }
  }

  const newBalance = credit.balance - amount
  const newStatus = newBalance === 0 ? 'paid' : 'pending'

  // Actualizar crédito
  const { error: updateError } = await adminClient
    .from('credits')
    .update({ 
      balance: newBalance, 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', creditId)

  if (updateError) {
    return { error: 'Error al registrar el abono: ' + updateError.message }
  }

  // Guardar historial con el método de pago
  const { error: paymentError } = await adminClient
    .from('credit_payments')
    .insert({
      credit_id: creditId,
      amount: amount,
      payment_method: paymentMethod,
      cash_session_id: currentSession.id,
      created_by: user.id
    })

  if (paymentError) {
    // Rollback
    await adminClient
      .from('credits')
      .update({ balance: credit.balance, status: credit.status })
      .eq('id', creditId)
    
    return { error: 'Error al guardar el historial del abono: ' + paymentError.message }
  }

  revalidatePath('/dashboard/clientes')
  revalidatePath('/dashboard/caja')
  return { success: true, newBalance }
}