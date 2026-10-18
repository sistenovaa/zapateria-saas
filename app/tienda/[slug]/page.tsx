export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MapPin, Phone } from 'lucide-react'
import { WhatsAppButton } from './WhatsAppButton'

interface Product {
  id: string
  name: string
  brand: string
  category: string
  size: number
  color: string
  sale_price: number
  stock: number
  image_url: string | null // 👈 Nuevo campo
}

// Función auxiliar para formatear precios en COP
const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Obtener datos de la tienda
  const { data: store } = await supabase
    .from('stores')
    .select('name, phone, address')
    .eq('slug', slug)
    .single()

  if (!store) {
    notFound()
  }

  // 2. Obtener productos (La función RPC ahora debe devolver image_url también)
  const { data: products } = await supabase
    .rpc('get_public_catalog', { p_slug: slug })

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header de la Tienda */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold text-zinc-900 mb-4">{store.name}</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-zinc-500 text-sm">
            {store.address && (
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="text-zinc-400" />
                {store.address}
              </span>
            )}
            {store.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={16} className="text-zinc-400" />
                {store.phone}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Catálogo */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Catálogo disponible</h2>
          <span className="text-sm text-zinc-500">{products?.length || 0} productos</span>
        </div>

        {products?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-zinc-200">
            <p className="text-zinc-500">No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products?.map((product: Product) => (
              <div key={product.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                
                {/* Imagen o Placeholder */}
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
                  
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded">
                    Talla {product.size}
                  </span>
                  {product.stock < 3 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Últimos pares
                    </span>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-zinc-500 font-medium mb-1">{product.brand}</p>
                  <h3 className="font-bold text-lg text-zinc-900 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4">Color: {product.color} • {product.category}</p>
                  
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Precio</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCOP(product.sale_price)}</p>
                    </div>
                    <WhatsAppButton 
                      phone={store.phone || ''} 
                      productName={product.name} 
                      price={formatCOP(product.sale_price)} 
                      size={product.size}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-sm text-zinc-400">
        <p>Tienda creada con Zapatería SaaS</p>
      </footer>
    </div>
  )
}