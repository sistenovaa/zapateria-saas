'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// (Si ya tenías la función updateStore de antes, déjala aquí arriba)

export async function createCashier(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // 1. Verificar que sea el dueño de una tienda
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return { error: 'Solo el dueño puede crear cajeros.' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Correo y contraseña son obligatorios.' }

  // 2. Usar el cliente de administrador para crear el usuario en Supabase Auth
  const adminClient = createAdminClient()
  
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Lo marcamos como confirmado para que pueda entrar de una
  })

  if (authError) {
    return { error: authError.message }
  }

  // 3. Vincular el nuevo usuario a la tienda en la tabla employees
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