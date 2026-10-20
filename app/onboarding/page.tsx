export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './OnboardingForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default async function OnboardingPage(props: { searchParams: Promise<{ message?: string, plan?: string }> }) {
  const searchParams = await props.searchParams;
  const selectedPlan = searchParams?.plan || 'free';
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger ruta
  if (!user) redirect('/login')

  // Verificar si ya tiene una tienda
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (store) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Configura tu Tienda</CardTitle>
          <p className="text-sm text-zinc-500 text-center">
            Cuéntanos sobre tu zapatería para crear tu catálogo.
          </p>
        </CardHeader>
        <CardContent>
          <OnboardingForm errorMessage={searchParams?.message} selectedPlan={selectedPlan} />
        </CardContent>
      </Card>
    </div>
  )
}