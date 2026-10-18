'use client'

import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phone: string
  productName: string
  price: string // Ahora recibe el string formateado
  size: number
}

export function WhatsAppButton({ phone, productName, price, size }: WhatsAppButtonProps) {
  // Limpiar el teléfono (por si el dueño puso espacios o guiones)
  const cleanPhone = phone.replace(/\D/g, '')
  
  const message = `¡Hola! 👋 Vi en su catálogo el producto *"${productName}"* (Talla ${size}) por un valor de *${price}* y me interesa comprarlo. ¿Está disponible?`
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
    >
      <MessageCircle size={18} />
      Consultar
    </a>
  )
}