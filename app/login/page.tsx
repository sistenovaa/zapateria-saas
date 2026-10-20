'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { showError } from '@/components/ui/Alert'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    // Llamamos a la server action
    const result = await login(formData)
    
    // Si la acción devuelve un error, mostramos la alerta y quitamos el spinner
    if (result?.error) {
      showError(result.error)
      setIsLoading(false)
    }
    // Si no hay error, la server action hará el redirect automáticamente 
    // y no necesitamos hacer nada más aquí.
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          <p className="text-sm text-zinc-500 text-center">Ingresa a tu panel de control</p>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <Input label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com" required />
            <Input label="Contraseña" name="password" type="password" placeholder="••••••••" required />
            
            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              {isLoading ? 'Ingresando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-zinc-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-emerald-600 hover:underline font-medium">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}