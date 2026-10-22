'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPurchase } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { showSuccess, showError } from '@/components/ui/Alert'
import { Search, Plus, Minus, Trash2, ShoppingBag, X } from 'lucide-react'

interface Supplier {
  id: string
  name: string
}

interface Variant {
  id: string
  size: number
  color: string
  stock: number
  barcode?: string
}

interface Product {
  id: string
  name: string
  brand: string
  purchase_price: number
  variants: Variant[]
}

interface PurchaseItem {
  product: Product
  variant: Variant
  quantity: number
  unitCost: number
}

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

export function PurchaseForm({ 
  suppliers, 
  initialProducts 
}: { 
  suppliers: Supplier[]
  initialProducts: Product[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  
  // Estados de la compra
  const [supplierId, setSupplierId] = useState<string>('none')
  const [items, setItems] = useState<PurchaseItem[]>([])
  
  // Estado para seleccionar variante
  const [productToSelect, setProductToSelect] = useState<Product | null>(null)

  // Filtrar productos por búsqueda
  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const total = items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0)

  function handleProductClick(product: Product) {
    if (product.variants.length === 1) {
      addToPurchase(product, product.variants[0])
    } else {
      setProductToSelect(product)
    }
  }

  function addToPurchase(product: Product, variant: Variant) {
    setItems(prev => {
      const existing = prev.find(item => item.variant.id === variant.id)
      if (existing) {
        return prev.map(item => 
          item.variant.id === variant.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }
      return [...prev, { product, variant, quantity: 1, unitCost: product.purchase_price }]
    })
    setProductToSelect(null)
  }

  function updateQuantity(variantId: string, delta: number) {
    setItems(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        const newQuantity = item.quantity + delta
        if (newQuantity <= 0) return item
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  function updateUnitCost(variantId: string, cost: number) {
    setItems(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        return { ...item, unitCost: cost }
      }
      return item
    }))
  }

  function removeFromPurchase(variantId: string) {
    setItems(prev => prev.filter(item => item.variant.id !== variantId))
  }

  async function handleSubmit() {
    if (items.length === 0) {
      showError('Debes agregar al menos un producto a la compra.')
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('supplier_id', supplierId)
    
    const itemsJson = items.map(item => ({
      variant_id: item.variant.id,
      quantity: item.quantity,
      unit_cost: item.unitCost
    }))
    
    formData.append('items', JSON.stringify(itemsJson))

    const result = await createPurchase(formData)

    if (result.error) {
      showError(result.error)
      setIsLoading(false)
    } else {
      showSuccess('Compra registrada', 'El stock se ha actualizado correctamente.')
      setItems([])
      setSupplierId('none')
      router.refresh()
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
      {/* COLUMNA IZQUIERDA: Catálogo */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <Input 
              placeholder="Buscar producto por nombre o marca..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
          {filteredProducts.map(product => (
            <button 
              key={product.id} 
              onClick={() => handleProductClick(product)}
              className="text-left flex flex-col p-4 rounded-xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <h3 className="font-semibold text-zinc-900 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{product.brand}</p>
              <div className="mt-auto flex items-center justify-between w-full">
                <span className="text-sm font-medium text-zinc-600">
                  Costo: {formatCOP(product.purchase_price)}
                </span>
                <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={18} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: Carrito de Compra */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
          <ShoppingBag className="text-zinc-500" size={20} />
          <h2 className="font-semibold text-zinc-900">Resumen de Compra</h2>
          <span className="ml-auto bg-zinc-200 text-zinc-700 text-xs font-bold px-2 py-1 rounded-full">
            {items.reduce((acc, item) => acc + item.quantity, 0)} items
          </span>
        </div>

        <div className="p-4 border-b border-zinc-100">
          <label className="text-sm font-medium text-zinc-900 mb-1 block">Proveedor</label>
          <select 
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="none">Sin proveedor (Opcional)</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p>La compra está vacía</p>
              <p className="text-sm">Selecciona productos del catálogo</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.variant.id} className="flex flex-col p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-sm text-zinc-900">{item.product.name}</h4>
                    <p className="text-xs text-zinc-500">
                      Talla {item.variant.size} • {item.variant.color}
                    </p>
                  </div>
                  <button onClick={() => removeFromPurchase(item.variant.id)} className="text-zinc-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  {/* Control de Cantidad */}
                  <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-1 py-1">
                    <button onClick={() => updateQuantity(item.variant.id, -1)} className="p-1 text-zinc-500 hover:text-zinc-900">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variant.id, 1)} className="p-1 text-zinc-500 hover:text-zinc-900">
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  {/* Costo Unitario */}
                  <div className="flex-1">
                    <Input 
                      type="number"
                      className="h-8 text-sm text-right"
                      value={item.unitCost}
                      onChange={(e) => updateUnitCost(item.variant.id, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  {/* Subtotal */}
                  <span className="font-bold text-zinc-900 text-sm w-20 text-right">
                    {formatCOP(item.unitCost * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50">
          <div className="flex justify-between items-center mb-4 text-lg">
            <span className="font-medium text-zinc-600">Total Compra:</span>
            <span className="font-bold text-2xl text-zinc-900">{formatCOP(total)}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg" 
            onClick={handleSubmit} 
            disabled={items.length === 0 || isLoading}
            isLoading={isLoading}
          >
            Registrar Compra y Sumar Stock
          </Button>
        </div>
      </div>

      {/* MODAL PARA SELECCIONAR VARIANTE */}
      {productToSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{productToSelect.name}</h2>
                <p className="text-sm text-zinc-500">Selecciona la talla a comprar</p>
              </div>
              <button onClick={() => setProductToSelect(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {productToSelect.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => addToPurchase(productToSelect, variant)}
                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">Talla {variant.size} • {variant.color}</p>
                      <p className="text-sm text-zinc-500">Stock actual: {variant.stock} pares</p>
                    </div>
                    <span className="font-bold text-zinc-600">{formatCOP(productToSelect.purchase_price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}