'use client'

import { useState } from 'react'
import { ProductModal } from './ProductModal'
import { Button } from '@/components/ui/Button'
import { Plus, Edit2, AlertCircle, Image as ImageIcon, Download } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PlanLimits } from '@/lib/plans'

interface Product {
  id: string
  name: string
  brand: string
  category: string
  size: number
  color: string
  purchase_price: number
  sale_price: number
  stock: number
  image_url?: string | null
}

export function InventoryTable({ 
  initialProducts, 
  plan 
}: { 
  initialProducts: Product[]
  plan: PlanLimits
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  function handleCreate() {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  function handleEdit(product: Product) {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  function exportToCSV() {
    const headers = ['Nombre', 'Marca', 'Categoria', 'Talla', 'Color', 'Precio Compra', 'Precio Venta', 'Stock']
    const rows = initialProducts.map(p => [
      p.name, p.brand, p.category, p.size, p.color, p.purchase_price, p.sale_price, p.stock
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'inventario_zapateria.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="w-full sm:w-1/2">
          <h1 className="text-2xl font-bold text-zinc-900">Inventario</h1>
          <p className="text-zinc-500 mb-3">Gestiona los productos de tu zapatería.</p>
          
          {/* BARRA DE PROGRESO (Solo se muestra si el plan tiene límite) */}
          {plan.maxProducts !== null && (
            <ProgressBar 
              current={initialProducts.length} 
              max={plan.maxProducts} 
              label={`Uso de tu plan ${plan.name}`} 
            />
          )}
        </div>
        <div className="flex gap-2">
          {plan.features.includes('Exportación a Excel (CSV)') && (
            <Button variant="outline" onClick={exportToCSV} className="gap-2 bg-white">
              <Download size={18} /> Exportar CSV
            </Button>
          )}
          <Button onClick={handleCreate} className="gap-2">
            <Plus size={18} /> Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4 w-16 text-center">Imagen</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Talla / Color</th>
                <th className="px-6 py-4">Precios (C / V)</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No hay productos en el inventario. ¡Crea el primero!
                  </td>
                </tr>
              ) : (
                initialProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <div className="relative w-10 h-10 mx-auto rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-visible">
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-md cursor-zoom-in" />
                            <div className="absolute hidden group-hover:block z-50 left-full ml-4 top-1/2 -translate-y-1/2 w-48 h-48 bg-white p-1 rounded-xl shadow-2xl border border-zinc-200 pointer-events-none">
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="text-zinc-400" size={16} />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900">{product.name}</div>
                      <div className="text-zinc-500 text-xs">{product.brand} • {product.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded text-xs font-medium mr-2 whitespace-nowrap">
                        Talla {product.size}
                      </span>
                      <span className="text-zinc-500 text-xs">{product.color}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-500 text-xs">C: {formatCOP(product.purchase_price)}</div>
                      <div className="font-medium text-emerald-600">V: {formatCOP(product.sale_price)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {product.stock < 3 ? (
                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                          <AlertCircle size={14} />
                          <span className="font-bold">{product.stock}</span>
                          <span className="text-xs font-normal">bajo</span>
                        </div>
                      ) : (
                        <span className="font-medium text-zinc-700">{product.stock} u.</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
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

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct} 
      />
    </>
  )
}