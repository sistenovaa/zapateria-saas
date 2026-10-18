'use client'

import { useState } from 'react'
import { createProduct, updateProduct, deleteProduct } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Trash2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export function ProductModal({ 
  isOpen, 
  onClose, 
  product 
}: { 
  isOpen: boolean
  onClose: () => void
  product?: Product | null 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState(product?.image_url || '')
  const supabase = createClient()

  if (!isOpen) return null

  const isEditing = !!product

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError('')

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`

    // Subir a Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (uploadError) {
      setError('Error al subir la imagen: ' + uploadError.message)
      setIsLoading(false)
      return
    }

    // Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    setImageUrl(publicUrl)
    setIsLoading(false)
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError('')
    
    // Inyectar la URL de la imagen en los datos del formulario
    formData.append('image_url', imageUrl)
    
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-semibold text-zinc-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {/* Subida de Imagen */}
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

          <Input label="Nombre del calzado" name="name" defaultValue={product?.name} required />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marca" name="brand" defaultValue={product?.brand} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-900">Categoría</label>
              <select name="category" defaultValue={product?.category || 'Hombre'} className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Niño">Niño</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Talla (35-45)" name="size" type="number" min="35" max="45" defaultValue={product?.size} required />
            <Input label="Color" name="color" defaultValue={product?.color} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio Compra ($)" name="purchase_price" type="number" step="0.01" defaultValue={product?.purchase_price} required />
            <Input label="Precio Venta ($)" name="sale_price" type="number" step="0.01" defaultValue={product?.sale_price} required />
          </div>

          <Input label="Stock actual" name="stock" type="number" min="0" defaultValue={product?.stock} required />

          {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded text-center">{error}</p>}

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100">
            {isEditing ? (
              <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3">
                <Trash2 size={18} />
              </Button>
            ) : <div />}
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" isLoading={isLoading}>
                {isEditing ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}