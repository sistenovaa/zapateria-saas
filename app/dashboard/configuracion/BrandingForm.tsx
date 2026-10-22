'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { showSuccess, showError } from '@/components/ui/Alert'
import { updateStoreBranding } from './actions'
import { Palette, Image as ImageIcon, Upload } from 'lucide-react'

export function BrandingForm({ store }: { store: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(store.logo_url || '')
  const [primaryColor, setPrimaryColor] = useState(store.primary_color || '#10b981')
  const router = useRouter()
  const supabase = createClient()

  // Subir el logo a Supabase Storage
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `logos/${store.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product-images') // Reutilizamos el bucket existente
      .upload(fileName, file)

    if (uploadError) {
      showError('Error al subir el logo: ' + uploadError.message)
      setIsLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    setLogoUrl(publicUrl)
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('logo_url', logoUrl)
    formData.append('primary_color', primaryColor)

    const result = await updateStoreBranding(formData)

    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Branding actualizado', 'Tu tienda ya tiene un nuevo diseño.')
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
        <Palette className="text-emerald-600" size={20} />
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Diseño de la Tienda</h3>
          <p className="text-sm text-zinc-500">Personaliza la apariencia de tu catálogo público.</p>
        </div>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Logo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-900">Logo de la Tienda</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="text-zinc-400" size={32} />
                )}
              </div>
              <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Upload size={16} /> Subir Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <span className="text-xs text-zinc-400">Recomendado: fondo transparente (PNG), 500x500px.</span>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-900">Descripción corta</label>
            <textarea 
              name="description"
              defaultValue={store.description || ''}
              placeholder="Ej: Calzado para toda la familia desde 1990..."
              className="flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-zinc-400">Aparecerá debajo del nombre de tu tienda en el catálogo.</span>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-900">Color de Acento</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border border-zinc-200 p-1 bg-white"
              />
              <Input 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 font-mono uppercase"
                maxLength={7}
              />
              <div 
                className="flex-1 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Vista previa del botón
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-zinc-100">
            <Button type="submit" isLoading={isLoading}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}