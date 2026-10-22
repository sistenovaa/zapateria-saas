'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateStorePlan(storeId: string, newPlanId: string, dateStr: string | null) {
  const adminClient = createAdminClient()

  let subscriptionEndsAt = null
  let subscriptionStartedAt = null

  if (dateStr) {
    // Convertimos la fecha sin la 'Z' de UTC para que se guarde tal cual
    const startDate = new Date(dateStr + 'T12:00:00')
    subscriptionStartedAt = startDate.toISOString().replace('Z', '')
    
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 30)
    subscriptionEndsAt = endDate.toISOString().replace('Z', '')
  }

  const { error } = await adminClient
    .from('stores')
    .update({ 
      plan_id: newPlanId,
      subscription_started_at: subscriptionStartedAt,
      subscription_ends_at: subscriptionEndsAt 
    })
    .eq('id', storeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}