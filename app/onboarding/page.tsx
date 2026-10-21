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

  if (!user) redirect('/login')

  // 👈 VERIFICAMOS SI YA ES UN EMPLEADO (DUEÑO O CAJERO)
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Si ya está en la tabla de empleados, no debe estar aquí. Lo mandamos al dashboard.
  if (employee) {
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