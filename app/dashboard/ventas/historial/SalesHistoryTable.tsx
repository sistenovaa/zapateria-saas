'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Receipt, X, Calendar, Banknote, CreditCard, ArrowRightLeft, Smartphone, Calculator, Printer, User } from 'lucide-react'

interface SaleItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  size: number
  color: string
}

interface Sale {
  id: string
  ticket_number: number
  total: number
  created_at: string
  payment_method: string
  payment_details: any | null
  created_by: string // 👈 Agregamos esto
  sale_items: SaleItem[]
}

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

function FormattedDate({ dateString }: { dateString: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <span className="text-transparent bg-zinc-100 rounded px-2">Cargando...</span>

  const date = new Date(dateString)
  const formatted = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium', timeStyle: 'short'
  }).format(date)

  return <span>{formatted}</span>
}

const getPaymentMethodInfo = (method: string) => {
  switch (method) {
    case 'efectivo': return { label: 'Efectivo', icon: Banknote, color: 'text-emerald-600 bg-emerald-50' }
    case 'tarjeta': return { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600 bg-blue-50' }
    case 'transferencia': return { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-purple-600 bg-purple-50' }
    case 'nequi': return { label: 'Nequi / Bre-B', icon: Smartphone, color: 'text-pink-600 bg-pink-50' }
    case 'mixto': return { label: 'Pago Mixto', icon: Calculator, color: 'text-amber-600 bg-amber-50' }
    case 'credito': return { label: 'Crédito', icon: Banknote, color: 'text-zinc-600 bg-zinc-100' }
    default: return { label: 'Efectivo', icon: Banknote, color: 'text-zinc-600 bg-zinc-50' }
  }
}

export function SalesHistoryTable({ sales }: { sales: Sale[] }) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Método de Pago</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      Aún no hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => {
                    const paymentInfo = getPaymentMethodInfo(sale.payment_method)
                    const PaymentIcon = paymentInfo.icon

                    return (
                      <tr key={sale.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                          #{sale.ticket_number || '---'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-900 font-medium">
                          <FormattedDate dateString={sale.created_at} />
                        </td>
                        <td className="px-6 py-4">
                          {/* 👈 NUEVA COLUMNA DE VENDEDOR */}
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <User size={14} className="text-zinc-400" />
                            <span className="truncate max-w-[150px]">{sale.created_by || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                            <PaymentIcon size={14} />
                            {paymentInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          {formatCOP(sale.total)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedSale(sale)} className="gap-2">
                            <Receipt size={16} /> Ver Ticket
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-center gap-2 text-zinc-900">
                <Receipt size={20} className="text-emerald-600" />
                <h2 className="font-semibold">Ticket #{selectedSale.ticket_number}</h2>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                <Calendar size={16} />
                <FormattedDate dateString={selectedSale.created_at} />
              </div>
              
              <div className="flex flex-col gap-1 text-sm text-zinc-500 mb-6 pb-4 border-b border-zinc-100 border-dashed">
                {(() => {
                  const info = getPaymentMethodInfo(selectedSale.payment_method)
                  const Icon = info.icon
                  return (
                    <>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Icon size={16} /> Pagado con: {info.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs">
                        <User size={14} /> Vendedor: {selectedSale.created_by || 'N/A'}
                      </span>
                      {selectedSale.payment_method === 'mixto' && selectedSale.payment_details && (
                        <div className="ml-6 mt-1 text-xs text-zinc-400">
                          <p>Efectivo: {formatCOP(selectedSale.payment_details.cash)}</p>
                          <p>Tarjeta: {formatCOP(selectedSale.payment_details.card)}</p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              <div className="space-y-4 mb-6">
                {selectedSale.sale_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{item.product_name}</p>
                      <p className="text-zinc-500 text-xs">
                        Talla {item.size} • {item.color} • {item.quantity} x {formatCOP(item.unit_price)}
                      </p>
                    </div>
                    <span className="font-medium text-zinc-900">
                      {formatCOP(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200 pt-4 flex justify-between items-center">
                <span className="font-medium text-zinc-600">Total Pagado</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCOP(selectedSale.total)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-between gap-2">
              <a 
                href={`/dashboard/ventas/ticket/${selectedSale.id}?size=80`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1"
              >
                <Button className="w-full gap-2" variant="outline">
                  <Printer size={18} /> Imprimir (80mm)
                </Button>
              </a>
              <a 
                href={`/dashboard/ventas/ticket/${selectedSale.id}?size=58`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1"
              >
                <Button className="w-full gap-2" variant="outline">
                  <Printer size={18} /> Imprimir (58mm)
                </Button>
              </a>
              <Button onClick={() => setSelectedSale(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}