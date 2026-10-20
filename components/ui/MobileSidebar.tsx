'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LayoutDashboard, Package, ShoppingCart, Settings, ExternalLink, LogOut } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { Button } from './Button'

export function MobileSidebar({ store, userEmail }: { store: any, userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(true)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg">
        <Menu size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          
          <aside className="relative w-64 bg-white h-full flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200">
              <span className="font-bold text-zinc-900">Menú</span>
              <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex-1 space-y-1 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {store.name}
              </div>
              
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
                <LayoutDashboard size={20} className="text-zinc-500" /> Resumen
              </Link>
              <Link href="/dashboard/inventario" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
                <Package size={20} className="text-zinc-500" /> Inventario
              </Link>
              <Link href="/dashboard/ventas" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
                <ShoppingCart size={20} className="text-zinc-500" /> Punto de Venta
              </Link>
              <Link href="/dashboard/configuracion" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
                <Settings size={20} className="text-zinc-500" /> Configuración
              </Link>
            </div>

            <div className="p-4 border-t border-zinc-200 space-y-3">
              <a 
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/tienda/${store.slug}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 font-medium px-3"
              >
                <ExternalLink size={16} /> Ver Catálogo Público
              </a>
              
              <div className="px-3 text-xs text-zinc-500 mb-2 truncate">{userEmail}</div>
              
              <form action={logout}>
                <Button variant="outline" className="w-full justify-start text-red-600 gap-2" type="submit">
                  <LogOut size={16} /> Cerrar Sesión
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}