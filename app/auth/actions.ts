'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // 👈 Importamos el cliente admin

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // 👈 USAMOS EL CLIENTE ADMIN PARA EVITAR EL BLOQUEO DEL RLS EN EL LOGIN
  const adminClient = createAdminClient()
  
  const { data: employee } = await adminClient
    .from('employees')
    .select('id')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  revalidatePath('/', 'layout')
  
  if (employee) {
    redirect('/dashboard')
  } else {
    redirect('/onboarding')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  
  const selectedPlan = formData.get('selected_plan') as string || 'free'

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/onboarding?plan=${selectedPlan}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}