'use client'

import { useState } from 'react'
import { createStore } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function OnboardingForm({ errorMessage, selectedPlan }: { errorMessage?: string, selectedPlan?: string }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    
    const generatedSlug = newName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setSlug(generatedSlug)
  }

  return (
    <form action={createStore} className="flex flex-col gap-4">
      {/* Input oculto con el plan seleccionado */}
      <input type="hidden" name="plan_id" value={selectedPlan || 'free'} />

      <Input 
        label="Nombre de la tienda" 
        name="name" 
        placeholder="Ej: Calzados El Paso" 
        required 
        value={name}
        onChange={handleNameChange}
      />
      
      <div className="flex flex-col gap-1.5">
        <Input 
          label="Enlace de tu catálogo (Slug)" 
          name="slug" 
          placeholder="ej-calzados-el-paso" 
          required 
          pattern="^[a-z0-9-]+$"
          title="Solo letras minúsculas, números y guiones"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <span className="text-xs text-zinc-400">
          Tu catálogo público será: tudominio.com/tienda/<strong>{slug || 'tu-slug'}</strong>
        </span>
      </div>

      <Input 
        label="Teléfono (WhatsApp)" 
        name="phone" 
        placeholder="+123456789" 
        required 
      />
      <Input 
        label="Dirección física" 
        name="address" 
        placeholder="Calle 123 #45-67" 
      />
      
      {errorMessage && (
        <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="w-full mt-4">Crear mi Tienda</Button>
    </form>
  )
}