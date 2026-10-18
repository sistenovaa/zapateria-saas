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

  // Insertar la tienda
  const { error } = await supabase.from('stores').insert({
    owner_id: user.id,
    name,
    slug,
    phone,
    address,
  })

  if (error) {
    // Si el slug ya existe (error 23505), enviamos un mensaje
    if (error.code === '23505') {
      return redirect('/onboarding?message=El enlace (slug) ya está en uso, intenta con otro.')
    }
    return redirect('/onboarding?message=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}