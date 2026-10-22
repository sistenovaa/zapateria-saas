'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ==========================================
// 1. FUNCIÓN PARA CREAR CAJEROS (La que ya tenías)
// ==========================================
export async function createCashier(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return { error: 'Solo el dueño puede crear cajeros.' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Correo y contraseña son obligatorios.' }

  const adminClient = createAdminClient()
  
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return { error: authError.message }
  }

  const { error: dbError } = await supabase
    .from('employees')
    .insert({
      store_id: store.id,
      user_id: newUser.user.id,
      role: 'cashier',
    })

  if (dbError) {
    return { error: 'Usuario creado pero no se pudo vincular a la tienda: ' + dbError.message }
  }

  revalidatePath('/dashboard/configuracion')
  return { success: true }
}

// ==========================================
// 2. FUNCIÓN PARA ACTUALIZAR EL BRANDING (La nueva)
// ==========================================
export async function updateStoreBranding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const adminClient = createAdminClient()
  
  // Verificar que sea dueño de la tienda
  const { data: employee } = await adminClient
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .single()

  if (!employee || employee.role !== 'owner') {
    return { error: 'Solo el dueño puede cambiar la configuración.' }
  }

  const logoUrl = formData.get('logo_url') as string || null
  const primaryColor = formData.get('primary_color') as string || '#10b981'
  const description = formData.get('description') as string || null

  // Actualizar la tienda
  const { error } = await adminClient
    .from('stores')
    .update({
      logo_url: logoUrl,
      primary_color: primaryColor,
      description: description,
    })
    .eq('id', employee.store_id)

  if (error) {
    return { error: 'Error al guardar el branding: ' + error.message }
  }

  revalidatePath('/dashboard/configuracion')
  revalidatePath('/tienda/[slug]', 'page')
  
  return { success: true }
}