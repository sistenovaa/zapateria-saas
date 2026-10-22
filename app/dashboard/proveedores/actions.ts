'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createSupplier(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return { error: 'Tienda no encontrada' }

  const supplierData = {
    store_id: store.id,
    name: formData.get('name') as string,
    contact_name: formData.get('contact_name') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
  }

  const { error } = await supabase.from('suppliers').insert(supplierData)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/proveedores')
  return { success: true }
}

export async function updateSupplier(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const supplierData = {
    name: formData.get('name') as string,
    contact_name: formData.get('contact_name') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
  }

  const { error } = await supabase.from('suppliers').update(supplierData).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/proveedores')
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/proveedores')
  return { success: true }
}