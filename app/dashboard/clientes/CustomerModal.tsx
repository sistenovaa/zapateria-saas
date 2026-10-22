'use client'

import { useState } from 'react'
import { createCustomer, updateCustomer, deleteCustomer } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Trash2, Users } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/Alert'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export function CustomerModal({ 
  isOpen, 
  onClose, 
  customer 
}: { 
  isOpen: boolean
  onClose: () => void
  customer?: Customer | null 
}) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const isEditing = !!customer

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    const result = isEditing 
      ? await updateCustomer(customer!.id, formData)
      : await createCustomer(formData)

    if (result.error) {
      showError(result.error)
      setIsLoading(false)
    } else {
      showSuccess('Cliente guardado', 'Los datos se han guardado correctamente.')
      setIsLoading(false)
      onClose()
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    setIsLoading(true)
    const result = await deleteCustomer(customer!.id)
    
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Cliente eliminado', 'El cliente se ha borrado del sistema.')
      onClose()
    }
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Users className="text-emerald-600" size={20} />
            <h2 className="text-xl font-semibold text-zinc-900">
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 flex flex-col gap-4">
          <Input label="Nombre completo" name="name" defaultValue={customer?.name} required placeholder="Ej: Juan Pérez" />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" name="phone" defaultValue={customer?.phone || ''} placeholder="3001234567" />
            <Input label="Correo" name="email" type="email" defaultValue={customer?.email || ''} placeholder="cliente@correo.com" />
          </div>

          <Input label="Dirección" name="address" defaultValue={customer?.address || ''} placeholder="Calle 123 #45-67" />

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100">
            {isEditing ? (
              <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3">
                <Trash2 size={18} />
              </Button>
            ) : <div />}
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" isLoading={isLoading}>
                {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}