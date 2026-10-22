'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { showSuccess, showError } from '@/components/ui/Alert'

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      showError(error.message)
      setIsLoading(false)
    } else {
      showSuccess('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.')
      router.push('/login')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input 
        label="Nueva contraseña" 
        name="password" 
        type="password" 
        placeholder="Mínimo 6 caracteres" 
        required 
        minLength={6} 
        disabled={isLoading} 
      />
      <Button type="submit" isLoading={isLoading}>
        {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
      </Button>
    </form>
  )
}