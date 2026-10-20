'use client'

import { useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Button } from './Button'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleCopy} 
      className={`w-full gap-2 ${copied ? 'border-emerald-500 text-emerald-600' : ''}`}
    >
      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
      {copied ? '¡Copiado!' : 'Copiar Enlace'}
    </Button>
  )
}