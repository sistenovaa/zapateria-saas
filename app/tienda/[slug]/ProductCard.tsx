'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

interface Variant {
  id: string
  size: number
  color: string
  stock: number
}

interface Product {
  id: string
  name: string
  brand: string
  category: string
  sale_price: number
  image_url: string | null
  variants: Variant[]
}

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

export function ProductCard({ product, phone }: { product: Product, phone: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)

  // Limpiar el teléfono (por si el dueño puso espacios o guiones)
  const cleanPhone = phone.replace(/\D/g, '')

  // Generar el mensaje de WhatsApp
  const generateWhatsAppUrl = (variant?: Variant) => {
    let message = `¡Hola! 👋 Vi en su catálogo el producto *"${product.name}"*`
    
    if (variant) {
      message += ` en talla *${variant.size}* (Color: ${variant.color})`
    }
    
    message += ` por un valor de *${formatCOP(product.sale_price)}* y me interesa comprarlo. ¿Está disponible?`
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  }

  const handleConsultClick = () => {
    // Si solo hay 1 variante, mandamos directo a WhatsApp
    if (product.variants.length === 1) {
      window.open(generateWhatsAppUrl(product.variants[0]), '_blank')
    } else {
      // Si hay varias, abrimos el modal para que elija
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        {/* Imagen */}
        <div className="h-48 bg-zinc-100 flex items-center justify-center relative overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
            />
          ) : (
            <span className="text-zinc-400 font-medium">Foto del calzado</span>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-zinc-500 font-medium mb-1">{product.brand}</p>
          <h3 className="font-bold text-lg text-zinc-900 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-zinc-500 mb-4">{product.category}</p>
          
          <div className="mt-auto flex items-end justify-between">
            <div>
              <p className="text-xs text-zinc-500">Precio</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCOP(product.sale_price)}</p>
            </div>
            <button 
              onClick={handleConsultClick}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
            >
              <MessageCircle size={18} />
              Consultar
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PARA SELECCIONAR TALLA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{product.name}</h2>
                <p className="text-sm text-zinc-500">Selecciona la talla que deseas</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                      selectedVariant?.id === variant.id 
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                        : 'border-zinc-200 hover:border-emerald-300 hover:bg-zinc-50'
                    } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={variant.stock === 0}
                  >
                    <span className="text-lg font-bold text-zinc-900">Talla {variant.size}</span>
                    <span className="text-xs text-zinc-500">{variant.color}</span>
                    {variant.stock === 0 && <span className="text-xs text-red-500 mt-1">Agotado</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200">
              <a 
                href={generateWhatsAppUrl(selectedVariant || undefined)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!selectedVariant) {
                    e.preventDefault()
                    alert('Por favor, selecciona una talla primero.')
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                  selectedVariant ? 'bg-[#25D366] hover:bg-[#20bd5a]' : 'bg-zinc-300 cursor-not-allowed'
                }`}
              >
                <MessageCircle size={20} /> Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}