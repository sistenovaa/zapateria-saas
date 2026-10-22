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
    barcode: v.barcode ? v.barcode.trim() : null
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
  
  // 1. Actualizar datos del producto base
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

  // 2. Procesar variantes
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

  // 👈 SOLUCIÓN: Separar en dos grupos (existentes y nuevas)
  const existingVariants = variants.filter((v: any) => v.id)
  const newVariants = variants.filter((v: any) => !v.id)

  // 3. Eliminar las variantes que el usuario borró del formulario
  const incomingVariantIds = existingVariants.map((v: any) => v.id)
  
  const { data: currentVariants } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', id)

  if (currentVariants) {
    const idsToDelete = currentVariants
      .filter(v => !incomingVariantIds.includes(v.id))
      .map(v => v.id)

    if (idsToDelete.length > 0) {
      await supabase.from('product_variants').delete().in('id', idsToDelete)
    }
  }

  // 4. Actualizar las variantes que ya existían (una por una para evitar conflictos)
  for (const v of existingVariants) {
    const { error } = await supabase
      .from('product_variants')
      .update({
        size: v.size,
        color: v.color,
        stock: v.stock,
        barcode: v.barcode ? v.barcode.trim() : null
      })
      .eq('id', v.id)
    
    if (error) {
      if (error.code === '23505') return { error: 'El código de barras ya está registrado en otro producto.' }
      return { error: 'Error al actualizar la talla ' + v.size + ': ' + error.message }
    }
  }

  // 5. Insertar las variantes nuevas
  if (newVariants.length > 0) {
    const variantsToInsert = newVariants.map((v: any) => ({
      product_id: id,
      size: v.size,
      color: v.color,
      stock: v.stock,
      barcode: v.barcode ? v.barcode.trim() : null
    }))

    const { error } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)

    if (error) {
      if (error.code === '23505') return { error: 'El código de barras ya está registrado en otro producto.' }
      return { error: 'Error al guardar las nuevas tallas: ' + error.message }
    }
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