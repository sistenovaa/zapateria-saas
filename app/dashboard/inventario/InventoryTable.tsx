'use client'

import { useState } from 'react'
import { ProductModal } from './ProductModal'
import { Button } from '@/components/ui/Button'
import { Plus, Edit2, AlertCircle, Image as ImageIcon, Download, Layers, EyeOff } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PlanLimits } from '@/lib/plans'

interface Variant {
  id: string
  size: number
  color: string
  stock: number
  barcode: string
  is_active?: boolean // 👈 Agregamos el campo
}

interface Product {
  id: string
  name: string
  brand: string
  category: string
  purchase_price: number
  sale_price: number
  image_url?: string | null
  variants: Variant[]
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
  const [viewVariantsProduct, setViewVariantsProduct] = useState<Product | null>(null)

  function handleCreate() {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  function handleEdit(product: Product) {
    setSelectedProduct(JSON.parse(JSON.stringify(product)))
    setIsModalOpen(true)
  }

  function exportToCSV() {
    const headers = ['Producto', 'Marca', 'Categoria', 'Talla', 'Color', 'Codigo Barras', 'Precio Compra', 'Precio Venta', 'Stock', 'Estado']
    const rows: any[] = []

    initialProducts.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          rows.push([
            p.name, p.brand, p.category, v.size, v.color, v.barcode || '', 
            p.purchase_price, p.sale_price, v.stock, 
            v.is_active === false ? 'Inactiva' : 'Activa'
          ])
        })
      } else {
        rows.push([p.name, p.brand, p.category, '-', '-', '', p.purchase_price, p.sale_price, 0, 'Sin variantes'])
      }
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))
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

  // 👈 SOLO SUMAMOS EL STOCK DE LAS VARIANTES ACTIVAS
  const getTotalStock = (product: Product) => {
    return product.variants
      ?.filter(v => v.is_active !== false)
      .reduce((acc, v) => acc + v.stock, 0) || 0
  }

  const getVariantsSummary = (product: Product) => {
    const activeVariants = product.variants?.filter(v => v.is_active !== false) || []
    
    if (activeVariants.length === 0) return 'Sin variantes activas'
    
    if (activeVariants.length === 1) {
      return `Talla ${activeVariants[0].size} • ${activeVariants[0].color}`
    }

    const sizes = activeVariants.map(v => v.size)
    const minSize = Math.min(...sizes)
    const maxSize = Math.max(...sizes)
    const colorsCount = new Set(activeVariants.map(v => v.color)).size

    return `${activeVariants.length} activas (Tallas ${minSize}-${maxSize}) • ${colorsCount} color(es)`
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="w-full sm:w-1/2">
          <h1 className="text-2xl font-bold text-zinc-900">Inventario</h1>
          <p className="text-zinc-500 mb-3">Gestiona los productos de tu zapatería.</p>
          
          {plan.maxProducts !== null && (
            <ProgressBar 
              current={initialProducts.length} 
              max={plan.maxProducts} 
              label={`Uso de tu plan ${plan.name}`} 
            />
          )}
        </div>
        <div className="flex gap-2">
          {plan.id !== 'free' && (
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
                <th className="px-6 py-4">Variantes</th>
                <th className="px-6 py-4">Precios (C / V)</th>
                <th className="px-6 py-4">Stock Total</th>
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
                initialProducts.map((product) => {
                  const totalStock = getTotalStock(product)
                  
                  return (
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
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-600 text-xs font-medium">
                            {getVariantsSummary(product)}
                          </span>
                          {product.variants && product.variants.length > 1 && (
                            <button 
                              onClick={() => setViewVariantsProduct(product)}
                              className="text-emerald-600 hover:text-emerald-700 text-xs font-medium flex items-center gap-1 w-fit"
                            >
                              <Layers size={12} /> Ver detalle
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-zinc-500 text-xs">C: {formatCOP(product.purchase_price)}</div>
                        <div className="font-medium text-emerald-600">V: {formatCOP(product.sale_price)}</div>
                      </td>

                      <td className="px-6 py-4">
                        {totalStock < 3 ? (
                          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                            <AlertCircle size={14} />
                            <span className="font-bold">{totalStock}</span>
                            <span className="text-xs font-normal">bajo</span>
                          </div>
                        ) : (
                          <span className="font-medium text-zinc-700">{totalStock} u.</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                          <Edit2 size={16} className="text-zinc-500" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal 
          key={selectedProduct?.id || 'new'} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          product={selectedProduct} 
          planId={plan.id}
        />
      )}

      {/* MODAL DE DETALLE DE VARIANTES */}
      {viewVariantsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{viewVariantsProduct.name}</h2>
                <p className="text-sm text-zinc-500">Detalle de variantes</p>
              </div>
              <button onClick={() => setViewVariantsProduct(null)} className="text-zinc-400 hover:text-zinc-600">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 rounded-tl-lg">Talla</th>
                    <th className="px-4 py-2">Color</th>
                    <th className="px-4 py-2">C. Barras</th>
                    <th className="px-4 py-2 text-right rounded-tr-lg">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {viewVariantsProduct.variants.map((v) => {
                    const isInactive = v.is_active === false
                    return (
                      <tr key={v.id} className={isInactive ? 'bg-zinc-50 opacity-60' : ''}>
                        <td className="px-4 py-2 font-medium text-zinc-900">
                          {v.size}
                          {isInactive && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">
                              <EyeOff size={10} /> Inactiva
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-zinc-600">{v.color}</td>
                        <td className="px-4 py-2 text-zinc-400 text-xs">{v.barcode || '-'}</td>
                        <td className={`px-4 py-2 text-right font-medium ${isInactive ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                          {v.stock}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}