'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Plus, Minus, Trash2, ShoppingBag, X, CreditCard, Banknote, ArrowRightLeft, Smartphone, Calculator, Users } from 'lucide-react'
import { showError, showSuccess } from '@/components/ui/Alert'
import { PlanLimits } from '@/lib/plans'

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
  category: string
  sale_price: number
  variants: Variant[]
}

interface CartItem {
  product: Product
  variant: Variant
  quantity: number
}

interface Customer {
  id: string
  name: string
}

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

export function POSClient({ 
  initialProducts, 
  plan, 
  customers,
  sessionId // 👈 Recibimos el ID de la caja
}: { 
  initialProducts: Product[], 
  plan: PlanLimits,
  customers: Customer[],
  sessionId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  
  const [productToSelect, setProductToSelect] = useState<Product | null>(null)

  const [isMixedPaymentModalOpen, setIsMixedPaymentModalOpen] = useState(false)
  const [mixedCash, setMixedCash] = useState<string>('')
  const [mixedCard, setMixedCard] = useState<string>('')

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

  const hasAdvancedPayments = plan.id !== 'free'
  const isPremium = plan.id === 'premium'

  const filteredProducts = useMemo(() => {
    if (!search) return initialProducts
    return initialProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, initialProducts])

  const total = cart.reduce((acc, item) => acc + (item.product.sale_price * item.quantity), 0)

  function handleProductClick(product: Product) {
    if (!product.variants || product.variants.length === 0) return

    if (isPremium) {
      setProductToSelect(product)
    } else {
      const variant = product.variants[0]
      if (variant.stock > 0) {
        addToCart(product, variant)
      }
    }
  }

  function addToCart(product: Product, variant: Variant) {
    setCart(prev => {
      const existing = prev.find(item => item.variant.id === variant.id)
      if (existing) {
        if (existing.quantity >= variant.stock) return prev
        return prev.map(item => item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, variant, quantity: 1 }]
    })
    setProductToSelect(null)
  }

  function updateQuantity(variantId: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        const newQuantity = item.quantity + delta
        if (newQuantity <= 0) return item
        if (newQuantity > item.variant.stock) return item
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  function removeFromCart(variantId: string) {
    setCart(prev => prev.filter(item => item.variant.id !== variantId))
  }

  async function processSale(paymentMethod: string, paymentDetails: any = null, customerId: string | null = null, isCredit: boolean = false) {
    setIsProcessing(true)

    const items = cart.map(item => ({
      variant_id: item.variant.id,
      quantity: item.quantity
    }))

    const { error } = await supabase.rpc('create_sale', { 
      items: items,
      p_payment_method: paymentMethod,
      p_payment_details: paymentDetails,
      p_customer_id: customerId,
      p_is_credit: isCredit,
      p_cash_session_id: sessionId // 👈 ENVIAMOS EL ID DE LA CAJA
    })

    if (error) {
      showError('Error al procesar la venta: ' + error.message)
      setIsProcessing(false)
      return
    }

    setCart([])
    setIsPaymentModalOpen(false)
    setIsMixedPaymentModalOpen(false)
    setIsCreditModalOpen(false)
    showSuccess('¡Venta registrada!', `El stock se ha actualizado correctamente.`)
    router.refresh()
    setIsProcessing(false)
  }

  function handleMixedPayment() {
    const cash = parseFloat(mixedCash) || 0
    const card = parseFloat(mixedCard) || 0
    
    if (cash + card !== total) {
      showError('La suma de los pagos debe ser exactamente igual al total.')
      return
    }

    if (cash < 0 || card < 0) {
      showError('Los valores no pueden ser negativos.')
      return
    }

    const details = { cash: cash, card: card }
    processSale('mixto', details)
  }

  function handleCreditPayment() {
    if (!selectedCustomerId) {
      showError('Debes seleccionar un cliente para la venta a crédito.')
      return
    }
    processSale('credito', null, selectedCustomerId, true)
  }

  function handleCheckout() {
    if (hasAdvancedPayments) {
      setIsPaymentModalOpen(true)
    } else {
      processSale('efectivo')
    }
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
          {filteredProducts.map(product => {
            const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0)
            
            return (
              <button 
                key={product.id} 
                onClick={() => handleProductClick(product)}
                disabled={totalStock === 0}
                className="text-left flex flex-col p-4 rounded-xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex justify-between items-start w-full mb-2">
                  <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded">
                    {product.category}
                  </span>
                  <span className="text-xs text-zinc-400">{totalStock} en stock</span>
                </div>
                <h3 className="font-semibold text-zinc-900 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{product.brand}</p>
                <div className="mt-auto flex items-center justify-between w-full">
                  <span className="text-lg font-bold text-emerald-600">{formatCOP(product.sale_price)}</span>
                  <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={18} />
                  </div>
                </div>
              </button>
            )
          })}
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
              <div key={item.variant.id} className="flex flex-col p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-sm text-zinc-900">{item.product.name}</h4>
                    <p className="text-xs text-zinc-500">
                      Talla {item.variant.size} • {item.variant.color} • {formatCOP(item.product.sale_price)}
                    </p>
                  </div>
                  <button onClick={() => removeFromCart(item.variant.id)} className="text-zinc-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-lg px-2 py-1">
                    <button onClick={() => updateQuantity(item.variant.id, -1)} className="text-zinc-500 hover:text-zinc-900">
                      <Minus size={16} />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variant.id, 1)} className="text-zinc-500 hover:text-zinc-900">
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="font-bold text-zinc-900">
                    {formatCOP(item.product.sale_price * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50">
          <div className="flex justify-between items-center mb-4 text-lg">
            <span className="font-medium text-zinc-600">Total:</span>
            <span className="font-bold text-2xl text-zinc-900">{formatCOP(total)}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg" 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || isProcessing}
            isLoading={isProcessing}
          >
            {hasAdvancedPayments ? 'Cobrar (Seleccionar Pago)' : 'Cobrar (Efectivo)'}
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
                <p className="text-sm text-zinc-500">Selecciona la talla y color</p>
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
                    onClick={() => addToCart(productToSelect, variant)}
                    disabled={variant.stock === 0}
                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">Talla {variant.size} • {variant.color}</p>
                      <p className="text-sm text-zinc-500">Stock: {variant.stock} pares</p>
                    </div>
                    <span className="font-bold text-emerald-600">{formatCOP(productToSelect.sale_price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE MÉTODOS DE PAGO */}
      {isPaymentModalOpen && hasAdvancedPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-semibold text-zinc-900">Método de Pago</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-center text-zinc-500 mb-6">Total a cobrar: <strong className="text-2xl text-zinc-900 block mt-1">{formatCOP(total)}</strong></p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => processSale('efectivo')} isLoading={isProcessing}>
                  <Banknote size={24} /> Efectivo
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => processSale('tarjeta')} isLoading={isProcessing}>
                  <CreditCard size={24} /> Tarjeta
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => processSale('transferencia')} isLoading={isProcessing}>
                  <ArrowRightLeft size={24} /> Transferencia
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => processSale('nequi')} isLoading={isProcessing}>
                  <Smartphone size={24} /> Nequi / Bre-B
                </Button>
              </div>

              {isPremium && (
                <>
                  <div className="mt-3">
                    <Button 
                      variant="secondary" 
                      className="w-full h-12 gap-2 bg-zinc-900 hover:bg-zinc-800 text-white"
                      onClick={() => {
                        setIsPaymentModalOpen(false)
                        setIsMixedPaymentModalOpen(true)
                        setMixedCash('')
                        setMixedCard('')
                      }}
                    >
                      <Calculator size={18} /> Pago Mixto (Efectivo + Tarjeta)
                    </Button>
                  </div>

                  <div className="mt-3">
                    <Button 
                      variant="secondary" 
                      className="w-full h-12 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => {
                        setIsPaymentModalOpen(false)
                        setIsCreditModalOpen(true)
                        setSelectedCustomerId('')
                      }}
                    >
                      <Users size={18} /> Venta a Crédito (Cuentas por Cobrar)
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO MIXTO */}
      {isMixedPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-semibold text-zinc-900">Pago Mixto</h2>
              <button onClick={() => setIsMixedPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-center text-zinc-500 mb-6">Total a cobrar: <strong className="text-2xl text-zinc-900 block mt-1">{formatCOP(total)}</strong></p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-900 block mb-1">Monto en Efectivo</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={mixedCash}
                    onChange={(e) => setMixedCash(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-900 block mb-1">Monto en Tarjeta</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={mixedCard}
                    onChange={(e) => setMixedCard(e.target.value)}
                  />
                </div>

                <div className="bg-zinc-50 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-600">Falta por cubrir:</span>
                  <span className={`font-bold ${
                    (parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) === total 
                      ? 'text-emerald-600' 
                      : 'text-red-500'
                  }`}>
                    {formatCOP(total - ((parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0)))}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  className="w-full h-12" 
                  onClick={handleMixedPayment}
                  isLoading={isProcessing}
                  disabled={(parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) !== total}
                >
                  Confirmar Pago Mixto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VENTA A CRÉDITO */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-semibold text-zinc-900">Venta a Crédito</h2>
              <button onClick={() => setIsCreditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-center text-zinc-500 mb-6">Total a fiar: <strong className="text-2xl text-zinc-900 block mt-1">{formatCOP(total)}</strong></p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-900 block mb-1">Selecciona al Cliente</label>
                  <select 
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona un cliente...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  className="w-full h-12 bg-amber-600 hover:bg-amber-700" 
                  onClick={handleCreditPayment}
                  isLoading={isProcessing}
                  disabled={!selectedCustomerId}
                >
                  Confirmar Venta a Crédito
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}