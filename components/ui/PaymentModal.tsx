'use client'

import { useState } from 'react'
import { Button } from './Button'
import { X, Copy, CheckCircle2, MessageCircle } from 'lucide-react'

export function PaymentModal({ isOpen, onClose, planName }: { isOpen: boolean, onClose: () => void, planName: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  if (!isOpen) return null

  const nequi = process.env.NEXT_PUBLIC_PAYMENT_NEQUI || '3000000000'
  const breb = process.env.NEXT_PUBLIC_PAYMENT_BREB || '@tu-llave'
  const whatsapp = process.env.NEXT_PUBLIC_PAYMENT_WHATSAPP || '573000000000'

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const message = `¡Hola! Acabo de realizar el pago del plan ${planName} de Zapatería SaaS. Adjunto mi comprobante. Mi correo de registro es: `
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-semibold text-zinc-900">Pago del Plan {planName}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-zinc-600">
            Para activar tu plan, realiza una transferencia por el valor correspondiente a una de las siguientes cuentas y envíanos el comprobante por WhatsApp.
          </p>

          <div className="space-y-3">
            {/* Nequi */}
            <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-lg border border-zinc-200">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Nequi</p>
                <p className="font-mono text-sm font-bold text-zinc-900">{nequi}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy(nequi, 'nequi')} className="gap-2">
                {copied === 'nequi' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied === 'nequi' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            {/* Bre-B */}
            <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-lg border border-zinc-200">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Bre-B</p>
                <p className="font-mono text-sm font-bold text-zinc-900">{breb}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy(breb, 'breb')} className="gap-2">
                {copied === 'breb' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied === 'breb' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <MessageCircle size={20} /> Enviar comprobante por WhatsApp
              </Button>
            </a>
            <p className="text-xs text-center text-zinc-400 mt-3">
              Tu plan se activará una vez verifiquemos el pago (usualmente en menos de 1 hora).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}