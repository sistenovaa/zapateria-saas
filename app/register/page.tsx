export const instant = false;

import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PLANS } from '@/lib/plans'

export default async function RegisterPage(props: { searchParams: Promise<{ message?: string, plan?: string }> }) {
  const searchParams = await props.searchParams;
  
  // Capturamos el plan de la URL (por defecto 'free')
  const selectedPlanId = searchParams?.plan || 'free'
  const planInfo = PLANS[selectedPlanId as keyof typeof PLANS] || PLANS.free

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
          <p className="text-sm text-zinc-500 text-center">Comienza a gestionar tu zapatería</p>
        </CardHeader>
        <CardContent>
          <form action={signup} className="flex flex-col gap-4">
            {/* Input oculto para enviar el plan al backend */}
            <input type="hidden" name="selected_plan" value={selectedPlanId} />

            {/* Aviso visual si el plan no es el gratis */}
            {selectedPlanId !== 'free' && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-3 rounded-lg text-center font-medium mb-2">
                Has seleccionado el plan <strong>{planInfo.name}</strong>.<br/>
                Podrás completar el pago después de crear tu cuenta.
              </div>
            )}

            <Input label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com" required />
            <Input label="Contraseña" name="password" type="password" placeholder="Mínimo 6 caracteres" required minLength={6} />
            
            {searchParams?.message && (
              <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                {searchParams.message}
              </p>
            )}

            <Button type="submit" className="w-full mt-2">Registrarme</Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-zinc-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}