'use client'

import { useState } from 'react'
import { SupplierModal } from './SupplierModal'
import { Button } from '@/components/ui/Button'
import { Plus, Edit2, Truck, Phone, Mail, MapPin, User } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export function SupplierTable({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  function handleCreate() {
    setSelectedSupplier(null)
    setIsModalOpen(true)
  }

  function handleEdit(supplier: Supplier) {
    setSelectedSupplier(supplier)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Proveedores</h1>
          <p className="text-zinc-500">Gestiona tu directorio de proveedores de calzado.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} /> Nuevo Proveedor
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No hay proveedores registrados. ¡Crea el primero!
                  </td>
                </tr>
              ) : (
                initialSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 flex items-center gap-2">
                        <Truck size={16} className="text-zinc-400" />
                        {supplier.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {supplier.contact_name && (
                        <div className="flex items-center gap-2 text-zinc-700 text-xs">
                          <User size={12} className="text-zinc-400" /> {supplier.contact_name}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                          <Phone size={12} className="text-zinc-400" /> {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                          <Mail size={12} className="text-zinc-400" /> {supplier.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.address ? (
                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                          <MapPin size={12} className="text-zinc-400 shrink-0" /> {supplier.address}
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs italic">Sin dirección</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                        <Edit2 size={16} className="text-zinc-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        supplier={selectedSupplier} 
      />
    </>
  )
}