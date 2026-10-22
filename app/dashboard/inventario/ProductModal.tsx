'use client'

import { useState } from 'react'
import { createProduct, updateProduct, deleteProduct } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Trash2, Image as ImageIcon, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PlanId } from '@/lib/plans'

interface Variant {
  id?: string
  size: number
  color: string
  stock: number
  barcode: string
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

export function ProductModal({ 
  isOpen, 
  onClose, 
  product,
  planId
}: { 
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  planId: PlanId
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [imageUrl, setImageUrl] = useState(product?.image_url || '')
  
  const [variants, setVariants] = useState<Variant[]>(() => {
    if (product && product.variants && product.variants.length > 0) {
      return product.variants.map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
        barcode: v.barcode || ''
      }))
    }
    return [{ size: 35, color: '', stock: 0, barcode: '' }]
  })

  const [simpleSize, setSimpleSize] = useState<number>(product?.variants?.[0]?.size || 35)
  const [simpleColor, setSimpleColor] = useState<string>(product?.variants?.[0]?.color || '')
  const [simpleStock, setSimpleStock] = useState<number>(product?.variants?.[0]?.stock || 0)

  const isPremium = planId === 'premium'
  const supabase = createClient()

  if (!isOpen) return null

  const isEditing = !!product

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (uploadError) {
      setError('Error al subir la imagen: ' + uploadError.message)
      setIsLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    setImageUrl(publicUrl)
    setIsLoading(false)
  }

  function handleVariantChange(index: number, field: keyof Variant, value: string | number) {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  function addVariant() {
    // Al agregar, el objeto NO tiene ID
    setVariants([...variants, { size: 35, color: '', stock: 0, barcode: '' }])
  }

  function removeVariant(index: number) {
    if (variants.length === 1) return
    setVariants(variants.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError('')

    formData.append('image_url', imageUrl)

    // 👈 AQUÍ LIMPIAMOS LOS DATOS ANTES DE ENVIARLOS
    if (isPremium) {
      // Si una variante no tiene ID, lo eliminamos del objeto para que no llegue como "undefined"
      const cleanVariants = variants.map(v => {
        const { id, ...rest } = v
        return id ? { ...rest, id } : rest
      })
      formData.append('variants', JSON.stringify(cleanVariants))
    } else {
      const simpleVariant = [{ 
        id: product?.variants?.[0]?.id, 
        size: simpleSize, 
        color: simpleColor, 
        stock: simpleStock, 
        barcode: product?.variants?.[0]?.barcode || '' 
      }]
      formData.append('variants', JSON.stringify(simpleVariant))
    }

    const result = isEditing 
      ? await updateProduct(product!.id, formData)
      : await createProduct(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onClose()
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    setIsLoading(true)
    await deleteProduct(product!.id)
    setIsLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-semibold text-zinc-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 flex flex-col gap-4">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-900">Foto del producto (Opcional)</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center overflow-hidden relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-zinc-400" size={24} />
                )}
              </div>
              <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Subir Imagen
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre del calzado" name="name" defaultValue={product?.name} required />
            <Input label="Marca" name="brand" defaultValue={product?.brand} required />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-900">Categoría</label>
              <select name="category" defaultValue={product?.category || 'Hombre'} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Unisex">Unisex</option>
                <option value="Niño">Niño</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Precio Compra ($)" name="purchase_price" type="number" step="0.01" defaultValue={product?.purchase_price} required />
            <Input label="Precio Venta ($)" name="sale_price" type="number" step="0.01" defaultValue={product?.sale_price} required />
          </div>

          {isPremium ? (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-zinc-900">Variantes (Tallas, Colores y Códigos)</label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1 h-8 text-xs">
                  <Plus size={14} /> Agregar Variante
                </Button>
              </div>
              
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <div className="flex-1 min-w-[80px]">
                      <label className="text-xs text-zinc-500 mb-1 block">Talla</label>
                      <Input 
                        type="number" min="20" max="45" 
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, 'size', parseInt(e.target.value))}
                        className="h-8 text-sm" required
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-xs text-zinc-500 mb-1 block">Color</label>
                      <Input 
                        value={variant.color}
                        onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                        className="h-8 text-sm" required placeholder="Ej: Negro"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-xs text-zinc-500 mb-1 block">Stock</label>
                      <Input 
                        type="number" min="0"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                        className="h-8 text-sm" required
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-zinc-500 mb-1 block">C. Barras (Opc)</label>
                      <Input 
                        value={variant.barcode}
                        onChange={(e) => handleVariantChange(index, 'barcode', e.target.value)}
                        className="h-8 text-sm" placeholder="123456"
                      />
                    </div>
                    <button 
                      type="button" onClick={() => removeVariant(index)}
                      disabled={variants.length === 1}
                      className="p-1.5 text-zinc-400 hover:text-red-500 disabled:opacity-30 mb-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <label className="text-sm font-medium text-zinc-900 mb-3 block">Detalles del Producto</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Talla</label>
                  <Input 
                    type="number" min="20" max="45" 
                    value={simpleSize}
                    onChange={(e) => setSimpleSize(parseInt(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Color</label>
                  <Input 
                    value={simpleColor}
                    onChange={(e) => setSimpleColor(e.target.value)}
                    required placeholder="Ej: Negro"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Stock</label>
                  <Input 
                    type="number" min="0"
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-3 bg-zinc-100 p-2 rounded">
                💡 <strong>¿Necesitas manejar múltiples tallas o códigos de barras?</strong> Actualiza al Plan Premium.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded text-center mt-2">{error}</p>}

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100">
            {isEditing ? (
              <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3">
                <Trash2 size={18} />
              </Button>
            ) : <div />}
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" isLoading={isLoading}>
                {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}