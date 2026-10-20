'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { showError } from '@/components/ui/Alert'
import { PLANS } from '@/lib/plans'
import { useSearchParams } from 'next/navigation'

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  
  const selectedPlanId = searchParams.get('plan') || 'free'
  const planInfo = PLANS[selectedPlanId as keyof typeof PLANS] || PLANS.free

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('selected_plan', selectedPlanId)

    const result = await signup(formData)
    
    if (result?.error) {
      showError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
        <p className="text-sm text-zinc-500 text-center">Comienza a gestionar tu zapatería</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {selectedPlanId !== 'free' && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-3 rounded-lg text-center font-medium mb-2">
              Has seleccionado el plan <strong>{planInfo.name}</strong>.<br/>
              Podrás completar el pago después de crear tu cuenta.
            </div>
          )}

          <Input 
            label="Correo electrónico" 
            name="email" 
            type="email" 
            placeholder="tu@correo.com" 
            required 
            disabled={isLoading} 
          />
          <Input 
            label="Contraseña" 
            name="password" 
            type="password" 
            placeholder="Mínimo 6 caracteres" 
            required 
            minLength={6} 
            disabled={isLoading} 
          />
          
          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrarme'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-emerald-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}