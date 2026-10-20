'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  // Si el usuario eligió un plan de pago, NO se lo damos todavía.
  // Lo forzamos a 'free' en la base de datos hasta que pague.
  const dbPlanId = 'free'

  const { error } = await supabase.from('stores').insert({
    owner_id: user.id,
    name,
    slug,
    phone,
    address,
    plan_id: dbPlanId,
  })

  if (error) {
    if (error.code === '23505') {
      return redirect('/onboarding?message=El enlace (slug) ya está en uso, intenta con otro.')
    }
    return redirect('/onboarding?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  
  // Si eligió un plan de pago, lo enviamos a la pantalla de planes con el aviso
  if (planId !== 'free') {
    redirect(`/dashboard/planes?pending=true&plan=${planId}`)
  }
  
  // Si es gratis, directo al dashboard
  redirect('/dashboard')
}