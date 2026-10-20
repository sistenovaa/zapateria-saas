export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ADMIN_EMAILS } from '@/lib/admin'
import { BadgeCheck, Store, Calendar, Phone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'
import { PlanSelector } from './PlanSelector'

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString))
}

// Función para calcular los días restantes
const getDaysLeft = (endDate: string | null) => {
  if (!endDate) return null
  const now = new Date()
  const end = new Date(endDate)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard')
  }

  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  const totalStores = stores?.length || 0
  const freeStores = stores?.filter(s => s.plan_id === 'free').length || 0
  const proStores = stores?.filter(s => s.plan_id === 'pro').length || 0
  const premiumStores = stores?.filter(s => s.plan_id === 'premium').length || 0

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <BadgeCheck className="text-emerald-500" size={32} /> Panel de Administración
            </h1>
            <p className="text-zinc-400 mt-1">Gestiona los clientes y suscripciones de Zapatería SaaS.</p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Volver al Dashboard →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <p className="text-sm text-zinc-400 font-medium">Total Clientes</p>
            <p className="text-3xl font-bold text-white mt-1">{totalStores}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <p className="text-sm text-zinc-400 font-medium">Plan Gratis</p>
            <p className="text-3xl font-bold text-zinc-300 mt-1">{freeStores}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <p className="text-sm text-zinc-400 font-medium">Plan Básico (Pro)</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{proStores}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
            <p className="text-sm text-zinc-400 font-medium">Plan Premium</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">{premiumStores}</p>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-300">
              <thead className="bg-zinc-900/50 border-b border-zinc-700 text-zinc-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Tienda</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Plan Actual</th>
                  <th className="px-6 py-4">Vencimiento</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {stores?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No hay tiendas registradas todavía.
                    </td>
                  </tr>
                ) : (
                  stores?.map((store) => {
                    const daysLeft = getDaysLeft(store.subscription_ends_at)
                    
                    return (
                      <tr key={store.id} className="hover:bg-zinc-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white flex items-center gap-2">
                            <Store size={16} className="text-zinc-500" /> {store.name}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1 font-mono">
                            /{store.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Phone size={14} className="text-zinc-500" />
                            {store.phone || 'Sin teléfono'}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <Mail size={14} className="text-zinc-500" />
                            {store.owner_email || 'Sin correo'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            store.plan_id === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                            store.plan_id === 'pro' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-zinc-600/50 text-zinc-300'
                          }`}>
                            {store.plan_id}
                          </span>
                        </td>
                        {/* COLUMNA DE VENCIMIENTO */}
                        <td className="px-6 py-4">
                          {store.plan_id === 'free' || !store.subscription_ends_at ? (
                            <span className="text-zinc-500 text-xs italic">N/A</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-zinc-300 text-xs flex items-center gap-1">
                                <Calendar size={12} /> {formatDate(store.subscription_ends_at)}
                              </span>
                              <span className={`text-xs font-bold flex items-center gap-1 ${
                                daysLeft && daysLeft <= 5 ? 'text-red-400' : 'text-emerald-400'
                              }`}>
                                <Clock size={12} /> 
                                {daysLeft && daysLeft > 0 
                                  ? `Quedan ${daysLeft} días` 
                                  : 'Vencido'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <PlanSelector 
                            storeId={store.id} 
                            currentPlanId={store.plan_id} 
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}