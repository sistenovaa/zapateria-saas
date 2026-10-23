export const instant = false;

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { PrintButton } from './PrintButton'

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

export default async function TicketPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ size?: string }> 
}) {
  const { id } = await params
  const { size } = await searchParams
  const ticketSize = size === '80' ? '80mm' : '58mm'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: sale } = await adminClient
    .from('sales')
    .select(`
      *,
      sale_items (*),
      stores (*)
    `)
    .eq('id', id)
    .single()

  if (!sale) {
    notFound()
  }

  let vendedorEmail = 'N/A'
  if (sale.created_by) {
    const { data: userData } = await adminClient.auth.admin.getUserById(sale.created_by)
    vendedorEmail = userData?.user?.email || 'N/A'
  }

  const store = Array.isArray(sale.stores) ? sale.stores[0] : sale.stores

  return (
    <div className="min-h-screen bg-zinc-200 flex flex-col items-center py-8 print:bg-white print:py-0 print:block">
      
      <style>{`
        @media print {
          /* Reseteamos márgenes de la página */
          @page { size: ${ticketSize} auto; margin: 0; }
          body { margin: 0; padding: 0; background: white; }
          
          /* Ocultamos la interfaz del dashboard */
          aside, header { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          
          /* Ajustamos el contenedor del ticket para que tenga un margen interno */
          .ticket-print-container {
            margin: 0 !important;
            padding: 10px !important; /* 👈 Margen interno para que no se corte el texto */
            width: 100% !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div className="w-full max-w-md flex justify-between items-center mb-4 px-4 print:hidden">
        <a href="/dashboard/ventas/historial" className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
          &larr; Volver al Historial
        </a>
        <PrintButton />
      </div>

      <div 
        className="ticket-print-container bg-white text-black p-4 shadow-lg print:shadow-none"
        style={{ width: ticketSize, fontFamily: 'monospace' }}
      >
        {/* Encabezado */}
        <div className="text-center border-b border-black border-dashed pb-2 mb-2">
          {store.logo_url && (
            <div className="flex justify-center mb-2">
              <img src={store.logo_url} alt="Logo" className="w-16 h-16 object-contain grayscale" />
            </div>
          )}
          <h1 className="font-bold text-sm uppercase">{store.name}</h1>
          <p className="text-xs">{store.address}</p>
          <p className="text-xs">Tel: {store.phone}</p>
        </div>

        {/* Info de la venta */}
        <div className="text-xs mb-4">
          <div className="flex justify-between">
            <span>Ticket:</span>
            <span>#{sale.ticket_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{formatDate(sale.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pago:</span>
            <span className="uppercase">{sale.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span>Vendedor:</span>
            <span className="truncate max-w-[150px]">{vendedorEmail}</span>
          </div>
        </div>

        {/* Detalle de productos */}
        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="border-b border-black border-dashed">
              <th className="text-left py-1">Cant</th>
              <th className="text-left py-1">Desc</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.sale_items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-1 align-top">{item.quantity}</td>
                <td className="py-1 align-top">
                  {item.product_name}
                  <br/>
                  <span className="text-[10px]">Talla: {item.size} | {item.color}</span>
                </td>
                <td className="py-1 text-right align-top">{formatCOP(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="border-t border-black border-dashed pt-2 mb-4">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{formatCOP(sale.total)}</span>
          </div>
          
          {sale.payment_method === 'mixto' && sale.payment_details && (
            <div className="text-xs mt-1">
              <div className="flex justify-between">
                <span>Efectivo:</span>
                <span>{formatCOP(sale.payment_details.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarjeta:</span>
                <span>{formatCOP(sale.payment_details.card)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pie de página */}
        <div className="text-center text-xs mt-4">
          <p>¡Gracias por su compra!</p>
          <p className="mt-1">Creado por Siste Nova Calzado</p>
        </div>
      </div>
    </div>
  )
}