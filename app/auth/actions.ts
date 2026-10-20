'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Devolvemos el error para que el formulario lo capture con SweetAlert
    return { error: error.message }
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', authData.user.id)
    .single()

  revalidatePath('/', 'layout')
  
  if (!store) {
    redirect('/onboarding')
  } else {
    redirect('/dashboard')
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
    // Devolvemos el error para el formulario
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