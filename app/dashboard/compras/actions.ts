'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createPurchase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!store) return { error: 'Tienda no encontrada' }

  // Obtenemos los datos del formulario
  const supplierId = formData.get('supplier_id') as string
  const itemsJson = formData.get('items') as string

  if (!itemsJson) {
    return { error: 'No has agregado productos a la compra.' }
  }

  let items = []
  try {
    items = JSON.parse(itemsJson)
  } catch {
    return { error: 'Error al leer los productos.' }
  }

  if (items.length === 0) {
    return { error: 'Debes agregar al menos un producto a la compra.' }
  }

  // Validamos que el proveedor exista (si se seleccionó uno)
  let finalSupplierId = null
  if (supplierId && supplierId !== 'none') {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .eq('store_id', store.id)
      .single()
    
    if (supplier) finalSupplierId = supplier.id
  }

  // Llamamos a la función RPC que creamos en la base de datos
  const { error } = await supabase.rpc('create_purchase', {
    p_supplier_id: finalSupplierId,
    p_items: items
  })

  if (error) {
    return { error: 'Error al registrar la compra: ' + error.message }
  }

  revalidatePath('/dashboard/compras')
  revalidatePath('/dashboard/inventario')
  revalidatePath('/dashboard/inventario/kardex')
  revalidatePath('/dashboard')
  
  return { success: true }
}