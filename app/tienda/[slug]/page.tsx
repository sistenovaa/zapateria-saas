export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MapPin, Phone } from 'lucide-react'
import { ProductCard } from './ProductCard'

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

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Obtener datos de la tienda (incluyendo el branding)
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, phone, address, logo_url, primary_color, description')
    .eq('slug', slug)
    .single()

  if (!store) {
    notFound()
  }

  // 2. Obtener productos con sus variantes
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants (*)
    `)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Filtramos productos que no tengan ninguna variante con stock
  const availableProducts = (products || []).filter(p => 
    p.variants && p.variants.some((v: any) => v.stock > 0)
  )

  const accentColor = store.primary_color || '#10b981'

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header de la Tienda con Branding */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          
          {/* Logo */}
          {store.logo_url && (
            <div className="w-24 h-24 mb-6 rounded-2xl overflow-hidden shadow-sm border border-zinc-100 bg-white">
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-contain" />
            </div>
          )}

          <h1 className="text-4xl font-extrabold text-zinc-900 mb-2">{store.name}</h1>
          
          {/* Descripción */}
          {store.description && (
            <p className="text-zinc-500 max-w-2xl mb-6">{store.description}</p>
          )}
          
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
          <span className="text-sm text-zinc-500">{availableProducts.length} productos</span>
        </div>

        {availableProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-zinc-200">
            <p className="text-zinc-500">No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {availableProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product as Product} 
                phone={store.phone || ''} 
                accentColor={accentColor} // 👈 Pasamos el color al componente de la tarjeta
              />
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