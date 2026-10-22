'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // 👈 Importante

export async function createStore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const planId = formData.get('plan_id') as string || 'free'

  // 1. Insertar la tienda (Usamos el cliente normal)
  const { data: newStore, error: storeError } = await supabase
    .from('stores')
    .insert({
      owner_id: user.id,
      name,
      slug,
      phone,
      address,
      plan_id: 'free',
      owner_email: user.email,
    })
    .select('id')
    .single()

  if (storeError) {
    if (storeError.code === '23505') {
      return redirect('/onboarding?message=El enlace (slug) ya está en uso, intenta con otro.')
    }
    return redirect('/onboarding?message=' + encodeURIComponent(storeError.message))
  }

  // 2. Insertar al dueño en employees usando el Admin Client para evitar bloqueos de RLS
  const adminClient = createAdminClient()
  const { error: employeeError } = await adminClient
    .from('employees')
    .insert({
      store_id: newStore.id,
      user_id: user.id,
      role: 'owner',
    })

  if (employeeError) {
    console.error('Error al crear el empleado:', employeeError)
    return redirect('/onboarding?message=' + encodeURIComponent('Error al vincular al dueño con la tienda.'))
  }

  revalidatePath('/', 'layout')
  
  if (planId !== 'free') {
    redirect(`/dashboard/planes?pending=true&plan=${planId}`)
  }
  
  redirect('/dashboard')
}