'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function registerManualMovement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return { error: 'Tienda no encontrada' }

  const variantId = formData.get('variant_id') as string
  const type = formData.get('type') as string // perdida, robo, daño, ajuste
  const quantity = parseInt(formData.get('quantity') as string)
  const reason = formData.get('reason') as string

  if (!variantId || !type || quantity <= 0) {
    return { error: 'Datos incompletos o cantidad inválida.' }
  }

  // 1. Verificar que la variante pertenezca a esta tienda y tenga stock suficiente
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select(`
      id,
      stock,
      products!inner (store_id)
    `)
    .eq('id', variantId)
    .single()

  if (variantError || !variant) {
    return { error: 'Producto no encontrado.' }
  }

  if (variant.stock < quantity) {
    return { error: `No puedes retirar ${quantity} unidades. Solo hay ${variant.stock} en stock.` }
  }

  // 2. Descontar del inventario
  const { error: stockError } = await supabase
    .from('product_variants')
    .update({ stock: variant.stock - quantity })
    .eq('id', variantId)

  if (stockError) {
    return { error: 'Error al actualizar el stock: ' + stockError.message }
  }

  // 3. Registrar el movimiento en el Kardex
  const { error: movementError } = await supabase
    .from('inventory_movements')
    .insert({
      store_id: store.id,
      variant_id: variantId,
      type: type,
      quantity: -quantity, // Negativo porque es una salida
      reason: reason || null,
      created_by: user.id
    })

  if (movementError) {
    // Si falla el registro del movimiento, devolvemos el stock (rollback manual)
    await supabase.from('product_variants').update({ stock: variant.stock }).eq('id', variantId)
    return { error: 'Error al registrar el movimiento: ' + movementError.message }
  }

  revalidatePath('/dashboard/inventario')
  revalidatePath('/dashboard/inventario/kardex')
  return { success: true }
}