'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { showSuccess, showError } from '@/components/ui/Alert'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    // 👈 CAMBIO CLAVE: Ahora redirigimos a la ruta /auth/confirm
    const redirectTo = `${window.location.origin}/auth/confirm?next=/update-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      showError(error.message)
    } else {
      setEmailSent(true)
      showSuccess('Correo enviado', 'Revisa tu bandeja de entrada (y la carpeta de spam).')
    }
    setIsLoading(false)
  }

  if (emailSent) {
    return (
      <div className="text-center text-sm text-zinc-600 bg-emerald-50 p-4 rounded-lg">
        Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Correo electrónico" name="email" type="email" placeholder="tu@correo.com" required disabled={isLoading} />
      <Button type="submit" isLoading={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </Button>
    </form>
  )
}