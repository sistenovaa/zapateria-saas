'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { createCashier } from './actions'
import { showSuccess, showError } from '@/components/ui/Alert'
import { UserPlus, Users } from 'lucide-react'

export function SettingsForm({ store }: { store: any }) {
  // Estados para los datos de la tienda
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Estados para crear el cajero
  const [isCreatingCashier, setIsCreatingCashier] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Actualizar datos de la tienda
  async function handleStoreSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        showError('Ese enlace (slug) ya está en uso por otra tienda.')
      } else {
        showError(error.message)
      }
    } else {
      showSuccess('Datos actualizados', 'La información de tu tienda se guardó correctamente.')
      router.refresh()
    }
    setIsLoading(false)
  }

  // Crear un nuevo cajero
  async function handleCreateCashier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsCreatingCashier(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    const result = await createCashier(formData)

    if (result?.error) {
      showError(result.error)
    } else {
      showSuccess('Cajero creado', 'El cajero ya puede iniciar sesión con su correo y contraseña.')
      form.reset()
    }
    
    setIsCreatingCashier(false)
  }

  return (
    <div className="space-y-8">
      {/* FORMULARIO DE DATOS DE LA TIENDA */}
      <Card>
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-900">Datos de la Tienda</h3>
          <p className="text-sm text-zinc-500">Actualiza la información pública de tu negocio.</p>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleStoreSubmit} className="space-y-4">
            <Input label="Nombre de la tienda" name="name" defaultValue={store.name} required />
            
            <div className="flex flex-col gap-1.5">
              <Input 
                label="Enlace del catálogo (Slug)" 
                name="slug" 
                defaultValue={store.slug} 
                required 
                pattern="^[a-z0-9-]+$"
              />
              <span className="text-xs text-zinc-400">Si cambias esto, tu URL pública cambiará.</span>
            </div>

            <Input label="Teléfono (WhatsApp)" name="phone" defaultValue={store.phone} required />
            <Input label="Dirección física" name="address" defaultValue={store.address} />

            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={isLoading}>Guardar Cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FORMULARIO DE CREACIÓN DE CAJEROS (SOLO PLAN PREMIUM) */}
      {store.plan_id === 'premium' ? (
        <Card>
          <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
            <Users className="text-purple-600" size={20} />
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Gestión de Cajeros</h3>
              <p className="text-sm text-zinc-500">Crea cuentas para tus empleados. Ellos solo verán el Punto de Venta.</p>
            </div>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleCreateCashier} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <Input label="Correo del cajero" name="email" type="email" placeholder="cajero@correo.com" required disabled={isCreatingCashier} />
              <Input label="Contraseña temporal" name="password" type="text" placeholder="Mínimo 6 caracteres" required minLength={6} disabled={isCreatingCashier} />
              
              <div className="md:col-span-2 flex justify-end mt-2">
                <Button type="submit" isLoading={isCreatingCashier} className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <UserPlus size={18} /> Crear Cajero
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-50 border-dashed border-2 border-zinc-200 shadow-none">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <Users className="text-zinc-400 mb-4" size={32} />
            <h3 className="text-lg font-semibold text-zinc-900">Gestión de Cajeros</h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-md">
              La creación de empleados con acceso limitado está disponible únicamente en el <strong>Plan Premium</strong>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}