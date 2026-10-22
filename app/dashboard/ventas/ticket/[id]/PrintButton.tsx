'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="gap-2">
      <Printer size={18} /> Imprimir Ticket
    </Button>
  )
}