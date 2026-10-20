export const instant = false;

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Check, Store, Zap, ShieldCheck } from 'lucide-react'
import { PLANS } from '@/lib/plans'

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(value)
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si ya está logueado, lo mandamos al dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-zinc-900">
            <Store className="text-emerald-600" /> Zapatería SaaS
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Iniciar Sesión
            </Link>
            <Link href="/register">
              <Button size="sm">Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          El mejor software para tu zapatería
        </span>
        <h1 className="text-5xl font-extrabold text-zinc-900 mt-6 mb-4 tracking-tight">
          Vende más y controla tu inventario <span className="text-emerald-600">sin complicaciones</span>
        </h1>
        <p className="text-lg text-zinc-500 mb-8 max-w-2xl mx-auto">
          Lleva tu zapatería al siguiente nivel con un punto de venta rápido, catálogo público con WhatsApp y reportes en tiempo real.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base">Crear mi tienda gratis</Button>
          </Link>
        </div>
      </section>

      {/* FEATURES (Por qué elegirnos) */}
      <section className="py-16 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Punto de Venta Rápido</h3>
            <p className="text-zinc-500 text-sm">Factura en segundos. El stock se descuenta automáticamente sin errores.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Store size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Catálogo Digital</h3>
            <p className="text-zinc-500 text-sm">Comparte un enlace con tus clientes para que vean tus productos por WhatsApp.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">100% Seguro</h3>
            <p className="text-zinc-500 text-sm">Tu información está en la nube, respaldada y disponible desde cualquier dispositivo.</p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 px-4 max-w-6xl mx-auto" id="precios">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-4">Planes a tu medida</h2>
          <p className="text-zinc-500">Elige el plan que mejor se adapte al tamaño de tu zapatería.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {Object.values(PLANS).map((plan) => (
            <div 
              key={plan.id} 
              className={`rounded-2xl border p-8 flex flex-col relative bg-white ${
                plan.highlighted 
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 scale-105 z-10' 
                  : 'border-zinc-200 shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  Más Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
              <p className="text-sm text-zinc-500 mt-2 h-10">{plan.description}</p>
              
              <div className="my-6">
                <span className="text-4xl font-extrabold text-zinc-900">
                  {plan.price === 0 ? 'Gratis' : formatCOP(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-zinc-500 text-sm"> /mes</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check size={18} className="text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={`/register?plan=${plan.id}`} className="w-full">
                <Button 
                  variant={plan.highlighted ? 'primary' : 'outline'} 
                  className={`w-full h-12 text-base ${!plan.highlighted && 'bg-zinc-50'}`}
                >
                  {/* 👈 CAMBIO CLAVE: Cambiamos el texto del botón para mayor claridad */}
                  {plan.price === 0 ? 'Empezar Gratis' : 'Registrarse y Pagar'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 py-8 text-center text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} Zapatería SaaS. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}