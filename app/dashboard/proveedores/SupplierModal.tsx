'use client'

import { useState } from 'react'
import { createSupplier, updateSupplier, deleteSupplier } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Trash2, Truck } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/Alert'

interface Supplier {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export function SupplierModal({ 
  isOpen, 
  onClose, 
  supplier 
}: { 
  isOpen: boolean
  onClose: () => void
  supplier?: Supplier | null 
}) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const isEditing = !!supplier

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    const result = isEditing 
      ? await updateSupplier(supplier!.id, formData)
      : await createSupplier(formData)

    if (result.error) {
      showError(result.error)
      setIsLoading(false)
    } else {
      showSuccess('Proveedor guardado', 'Los datos se han guardado correctamente.')
      setIsLoading(false)
      onClose()
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return
    setIsLoading(true)
    const result = await deleteSupplier(supplier!.id)
    
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Proveedor eliminado', 'El proveedor se ha borrado del sistema.')
      onClose()
    }
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Truck className="text-emerald-600" size={20} />
            <h2 className="text-xl font-semibold text-zinc-900">
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 flex flex-col gap-4">
          <Input label="Nombre de la empresa / Proveedor" name="name" defaultValue={supplier?.name} required placeholder="Ej: Calzado Andino S.A." />
          
          <Input label="Nombre del contacto" name="contact_name" defaultValue={supplier?.contact_name || ''} placeholder="Ej: Juan Pérez" />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" name="phone" defaultValue={supplier?.phone || ''} placeholder="3001234567" />
            <Input label="Correo" name="email" type="email" defaultValue={supplier?.email || ''} placeholder="contacto@proveedor.com" />
          </div>

          <Input label="Dirección" name="address" defaultValue={supplier?.address || ''} placeholder="Calle 123 #45-67" />

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100">
            {isEditing ? (
              <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3">
                <Trash2 size={18} />
              </Button>
            ) : <div />}
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" isLoading={isLoading}>
                {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}