'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return { error: 'Tienda no encontrada' }

  const productData = {
    store_id: store.id,
    name: formData.get('name') as string,
    brand: formData.get('brand') as string,
    category: formData.get('category') as string,
    size: parseInt(formData.get('size') as string),
    color: formData.get('color') as string,
    purchase_price: parseFloat(formData.get('purchase_price') as string),
    sale_price: parseFloat(formData.get('sale_price') as string),
    stock: parseInt(formData.get('stock') as string),
    image_url: formData.get('image_url') as string || null,
  }

  const { error } = await supabase.from('products').insert(productData)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const productData = {
    name: formData.get('name') as string,
    brand: formData.get('brand') as string,
    category: formData.get('category') as string,
    size: parseInt(formData.get('size') as string),
    color: formData.get('color') as string,
    purchase_price: parseFloat(formData.get('purchase_price') as string),
    sale_price: parseFloat(formData.get('sale_price') as string),
    stock: parseInt(formData.get('stock') as string),
    image_url: formData.get('image_url') as string || null,
  }

  const { error } = await supabase.from('products').update(productData).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventario')
  revalidatePath('/dashboard')
  return { success: true }
}