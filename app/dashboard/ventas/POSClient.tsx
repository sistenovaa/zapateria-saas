'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string
  category: string
  size: number
  color: string
  sale_price: number
  stock: number
}

interface CartItem extends Product {
  quantity: number
}

export function POSClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Filtrar productos por búsqueda
  const filteredProducts = useMemo(() => {
    if (!search) return initialProducts
    return initialProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, initialProducts])

  const total = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0)

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev // No superar el stock
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function updateQuantity(id: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta
        if (newQuantity <= 0) return item
        if (newQuantity > item.stock) return item
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  async function handleCheckout() {
    if (cart.length === 0) return
    setIsProcessing(true)

    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }))

    // Llamamos a la función RPC que creamos en el Paso 1
    const { error } = await supabase.rpc('create_sale', { items })

    if (error) {
      alert('Error al procesar la venta: ' + error.message)
      setIsProcessing(false)
      return
    }

    // Éxito
    setCart([])
    setSuccessMessage('¡Venta registrada con éxito!')
    router.refresh() // Refresca los datos del servidor (stock actualizado)
    
    setTimeout(() => setSuccessMessage(''), 3000)
    setIsProcessing(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
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
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className="text-left flex flex-col p-4 rounded-xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex justify-between items-start w-full mb-2">
                <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded">
                  Talla {product.size}
                </span>
                <span className="text-xs text-zinc-400">{product.stock} en stock</span>
              </div>
              <h3 className="font-semibold text-zinc-900 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{product.brand} • {product.color}</p>
              <div className="mt-auto flex items-center justify-between w-full">
                <span className="text-lg font-bold text-emerald-600">${product.sale_price.toFixed(2)}</span>
                <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={18} />
                </div>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No se encontraron productos disponibles.
            </div>
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: Carrito */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
          <ShoppingBag className="text-zinc-500" size={20} />
          <h2 className="font-semibold text-zinc-900">Carrito de Venta</h2>
          <span className="ml-auto bg-zinc-200 text-zinc-700 text-xs font-bold px-2 py-1 rounded-full">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p>El carrito está vacío</p>
              <p className="text-sm">Haz clic en un producto para agregarlo</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-sm text-zinc-900">{item.name}</h4>
                    <p className="text-xs text-zinc-500">Talla {item.size} • ${item.sale_price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-lg px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="text-zinc-500 hover:text-zinc-900">
                      <Minus size={16} />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="text-zinc-500 hover:text-zinc-900">
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="font-bold text-zinc-900">
                    ${(item.sale_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50">
          <div className="flex justify-between items-center mb-4 text-lg">
            <span className="font-medium text-zinc-600">Total:</span>
            <span className="font-bold text-2xl text-zinc-900">${total.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg" 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || isProcessing}
            isLoading={isProcessing}
          >
            Cobrar y Descontar Stock
          </Button>
          
          {successMessage && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg font-medium">
              <CheckCircle2 size={20} />
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}