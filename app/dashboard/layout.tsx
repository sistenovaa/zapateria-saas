export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, Settings } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <span className="text-xl font-bold text-zinc-900 tracking-tight">Zapatería SaaS</span>
        </div>
        
        <div className="p-4 flex-1 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            {store.name}
          </div>
          
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
            <LayoutDashboard size={20} className="text-zinc-500" />
            Resumen
          </Link>
          <Link href="/dashboard/inventario" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
            <Package size={20} className="text-zinc-500" />
            Inventario
          </Link>
          <Link href="/dashboard/ventas" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
            <ShoppingCart size={20} className="text-zinc-500" />
            Punto de Venta
          </Link>
        </div>

        <div className="p-4 border-t border-zinc-200">
          <form action={logout}>
            <Button variant="outline" className="w-full justify-start text-zinc-600" type="submit">
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 md:hidden">
          <span className="text-lg font-bold text-zinc-900">Zapatería SaaS</span>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">Salir</Button>
          </form>
        </header>
        
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}