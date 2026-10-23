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
    purchase_price: parseFloat(formData.get('purchase_price') as string),
    sale_price: parseFloat(formData.get('sale_price') as string),
    image_url: formData.get('image_url') as string || null,
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productData)
    .select('id')
    .single()

  if (productError) return { error: productError.message }

  const variantsJson = formData.get('variants') as string
  let variants = []
  
  try {
    variants = JSON.parse(variantsJson)
  } catch {
    return { error: 'Error al leer las tallas y colores.' }
  }

  if (!variants || variants.length === 0) {
    return { error: 'Debes agregar al menos una talla y color.' }
  }

  const variantsToInsert = variants.map((v: any) => ({
    product_id: product.id,
    size: v.size,
    color: v.color,
    stock: v.stock,
    barcode: v.barcode ? v.barcode.trim() : null,
    is_active: v.is_active !== false // Por defecto true
  }))

  const { error: variantsError } = await supabase
    .from('product_variants')
    .insert(variantsToInsert)

  if (variantsError) {
    await supabase.from('products').delete().eq('id', product.id)
    if (variantsError.code === '23505') {
      return { error: 'El código de barras ya está registrado en otro producto.' }
    }
    return { error: 'Error al guardar las tallas: ' + variantsError.message }
  }

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
    purchase_price: parseFloat(formData.get('purchase_price') as string),
    sale_price: parseFloat(formData.get('sale_price') as string),
    image_url: formData.get('image_url') as string || null,
  }

  const { error: productError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)

  if (productError) return { error: productError.message }

  const variantsJson = formData.get('variants') as string
  let variants = []
  
  try {
    variants = JSON.parse(variantsJson)
  } catch {
    return { error: 'Error al leer las tallas y colores.' }
  }

  if (!variants || variants.length === 0) {
    return { error: 'Debes agregar al menos una talla y color.' }
  }

  // 1. Identificamos las variantes que el usuario quiere conservar (las que tienen ID)
  const incomingVariantIds = variants.filter((v: any) => v.id).map((v: any) => v.id)

  // 2. Buscamos las variantes actuales en la base de datos
  const { data: currentVariants } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', id)

  if (currentVariants) {
    // 3. Las variantes que el usuario eliminó del formulario (están en BD pero no en el JSON)
    const idsToRemove = currentVariants
      .filter(v => !incomingVariantIds.includes(v.id))
      .map(v => v.id)

    if (idsToRemove.length > 0) {
      // 👈 EN LUGAR DE BORRAR, DESACTIVAMOS LA VARIANTE
      await supabase
        .from('product_variants')
        .update({ is_active: false, stock: 0 })
        .in('id', idsToRemove)
    }
  }

  // 4. Preparamos las variantes para el UPSERT (actualizar o insertar)
  const variantsToUpsert = variants.map((v: any) => {
    const base = {
      product_id: id,
      size: v.size,
      color: v.color,
      stock: v.stock,
      barcode: v.barcode ? v.barcode.trim() : null,
      is_active: v.is_active !== false // Por defecto true
    }
    
    if (v.id) {
      return { ...base, id: v.id } 
    }
    return base 
  })

  const { error: variantsError } = await supabase
    .from('product_variants')
    .upsert(variantsToUpsert)

  if (variantsError) {
    if (variantsError.code === '23505') {
      return { error: 'El código de barras ya está registrado en otro producto.' }
    }
    return { error: 'Error al actualizar las tallas: ' + variantsError.message }
  }

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