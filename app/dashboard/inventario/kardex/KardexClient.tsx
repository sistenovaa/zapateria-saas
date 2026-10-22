'use client'

import { useState, useMemo } from 'react'
import { registerManualMovement } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { showSuccess, showError } from '@/components/ui/Alert'
import { Search, AlertTriangle, ArrowDownRight, ArrowUpRight, Package } from 'lucide-react'

interface Movement {
  id: string
  type: string
  quantity: number
  reason: string | null
  created_at: string
  variant: {
    size: number
    color: string
    product: {
      name: string
      brand: string
    }
  }
}

interface ProductVariant {
  id: string
  size: number
  color: string
  stock: number
  product: {
    name: string
    brand: string
  }
}

export function KardexClient({ 
  initialMovements, 
  availableVariants 
}: { 
  initialMovements: Movement[]
  availableVariants: ProductVariant[]
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Filtrar variantes para el selector
  const filteredVariants = useMemo(() => {
    if (!search) return availableVariants
    return availableVariants.filter(v => 
      v.product.name.toLowerCase().includes(search.toLowerCase()) ||
      v.product.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.size.toString().includes(search)
    )
  }, [search, availableVariants])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    const result = await registerManualMovement(formData)

    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Movimiento registrado', 'El stock se ha actualizado correctamente.')
      form.reset()
    }
    
    setIsLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateString))
  }

  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case 'venta': return { label: 'Venta', color: 'text-blue-600 bg-blue-50', icon: ArrowUpRight }
      case 'perdida': return { label: 'Pérdida', color: 'text-red-600 bg-red-50', icon: ArrowDownRight }
      case 'robo': return { label: 'Robo', color: 'text-red-600 bg-red-50', icon: ArrowDownRight }
      case 'daño': return { label: 'Daño', color: 'text-orange-600 bg-orange-50', icon: ArrowDownRight }
      case 'ajuste': return { label: 'Ajuste', color: 'text-zinc-600 bg-zinc-100', icon: ArrowUpRight }
      default: return { label: type, color: 'text-zinc-600 bg-zinc-50', icon: Package }
    }
  }

  return (
    <div className="space-y-8">
      {/* FORMULARIO DE REGISTRO */}
      <Card>
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-900">Registrar Salida Manual</h3>
          <p className="text-sm text-zinc-500">Descuenta productos por pérdidas, robos o daños.</p>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-zinc-900 mb-1 block">Producto (Talla/Color)</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <Input 
                  placeholder="Buscar por nombre, marca o talla..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select 
                name="variant_id" 
                required
                className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecciona un producto...</option>
                {filteredVariants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.product.name} - Talla {v.size} ({v.color}) - Stock: {v.stock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1 block">Motivo</label>
              <select 
                name="type" 
                required
                className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="perdida">Pérdida</option>
                <option value="robo">Robo</option>
                <option value="daño">Daño / Avería</option>
                <option value="ajuste">Ajuste de inventario</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1 block">Cantidad a retirar</label>
              <Input type="number" name="quantity" min="1" placeholder="Ej: 1" required />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-zinc-900 mb-1 block">Notas (Opcional)</label>
              <Input name="reason" placeholder="Ej: Se manchó en la bodega" />
            </div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <Button type="submit" isLoading={isLoading} className="gap-2 bg-red-600 hover:bg-red-700">
                <AlertTriangle size={18} /> Registrar Salida
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* HISTORIAL DE MOVIMIENTOS */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Historial de Movimientos</h3>
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {initialMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No hay movimientos registrados aún.
                    </td>
                  </tr>
                ) : (
                  initialMovements.map((mov) => {
                    const typeInfo = getMovementTypeInfo(mov.type)
                    const TypeIcon = typeInfo.icon
                    const isNegative = mov.quantity < 0

                    return (
                      <tr key={mov.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-zinc-500 whitespace-nowrap text-xs">
                          {formatDate(mov.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900">{mov.variant.product.name}</div>
                          <div className="text-xs text-zinc-500">
                            Talla {mov.variant.size} • {mov.variant.color}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            <TypeIcon size={14} />
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isNegative ? mov.quantity : `+${mov.quantity}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 text-xs">
                          {mov.reason || '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}