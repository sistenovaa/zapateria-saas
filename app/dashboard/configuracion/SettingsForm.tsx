'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'

export function SettingsForm({ store }: { store: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    const formData = new FormData(e.currentTarget)
    const updates = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    }

    const { error } = await supabase.from('stores').update(updates).eq('id', store.id)

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Ese enlace (slug) ya está en uso por otra tienda.' })
      } else {
        setMessage({ type: 'error', text: error.message })
      }
    } else {
      setMessage({ type: 'success', text: 'Datos actualizados correctamente.' })
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre de la tienda" name="name" defaultValue={store.name} required />
          
          <div className="flex flex-col gap-1.5">
            <Input 
              label="Enlace del catálogo (Slug)" 
              name="slug" 
              defaultValue={store.slug} 
              required 
              pattern="^[a-z0-9-]+$"
            />
            <span className="text-xs text-zinc-400">Si cambias esto, tu URL pública cambiará y los enlaces anteriores dejarán de funcionar.</span>
          </div>

          <Input label="Teléfono (WhatsApp)" name="phone" defaultValue={store.phone} required />
          <Input label="Dirección física" name="address" defaultValue={store.address} />

          {message.text && (
            <p className={`text-sm p-3 rounded-lg font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {message.text}
            </p>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isLoading}>Guardar Cambios</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}