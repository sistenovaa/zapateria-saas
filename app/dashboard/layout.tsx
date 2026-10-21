export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // 👈
import { redirect } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, ExternalLink, LogOut, User, Settings, History } from 'lucide-react'
import { MobileSidebar } from '@/components/ui/MobileSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 👈 USAMOS EL ADMIN CLIENT PARA LEER SIN PROBLEMAS DE RLS
  const adminClient = createAdminClient()

  const { data: employee } = await adminClient
    .from('employees')
    .select('role, store_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employee) {
    redirect('/onboarding')
  }

  const { data: store } = await adminClient
    .from('stores')
    .select('id, name, slug, plan_id')
    .eq('id', employee.store_id)
    .single()

  if (!store) {
    redirect('/onboarding')
  }

  const isOwner = employee.role === 'owner'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const publicUrl = `${baseUrl}/tienda/${store.slug}`

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-64 bg-white border-r border-zinc-200 flex-col hidden md:flex fixed inset-y-0 left-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <span className="text-xl font-bold text-zinc-900 tracking-tight">Zapatería SaaS</span>
        </div>
        
        <div className="p-4 flex-1 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Menú {isOwner ? 'Dueño' : 'Cajero'}
          </div>
          
          {isOwner && (
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
              <LayoutDashboard size={20} className="text-zinc-500" /> Resumen
            </Link>
          )}

          {isOwner && (
            <Link href="/dashboard/inventario" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
              <Package size={20} className="text-zinc-500" /> Inventario
            </Link>
          )}

          <Link href="/dashboard/ventas" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
            <ShoppingCart size={20} className="text-zinc-500" /> Punto de Venta
          </Link>
          
          <Link href="/dashboard/ventas/historial" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
            <History size={20} className="text-zinc-500" /> Historial de Ventas
          </Link>

          {isOwner && (
            <Link href="/dashboard/configuracion" className="flex items-center gap-3 px-3 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium">
              <Settings size={20} className="text-zinc-500" /> Configuración
            </Link>
          )}
        </div>

        {isOwner && (
          <div className="p-4 border-t border-zinc-200 space-y-3">
            <div className="px-3">
              <p className="text-xs font-medium text-zinc-500 mb-1">Tu Catálogo Público</p>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium break-all group">
                <ExternalLink size={16} className="shrink-0 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                <span className="truncate">{store.slug}</span>
              </a>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MobileSidebar store={store} userEmail={user.email || ''} isOwner={isOwner} />
            <span className="text-lg font-bold text-zinc-900 md:hidden">Zapatería SaaS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="text-sm font-medium">Tienda:</span>
            <span className="text-sm font-bold">{store.name}</span>
            <span className="text-xs bg-emerald-200 px-2 py-0.5 rounded text-emerald-800 uppercase font-bold ml-1">
              {isOwner ? 'Dueño' : 'Cajero'}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
              <User size={16} className="text-zinc-400" />
              {user.email}
            </div>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 px-3">
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}