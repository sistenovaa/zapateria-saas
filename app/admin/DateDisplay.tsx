'use client'

import { useState, useEffect } from 'react'

export function DateDisplay({ dateString }: { dateString: string | null }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span className="text-zinc-600 text-xs animate-pulse">Cargando...</span>
  }

  if (!dateString) return <span>N/A</span>

  const date = new Date(dateString)
  const formatted = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)

  return <span>{formatted}</span>
}