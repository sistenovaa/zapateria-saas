'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Receipt, X, Calendar, ShoppingBag } from 'lucide-react'

interface SaleItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Sale {
  id: string
  total: number
  created_at: string
  sale_items: SaleItem[]
}

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
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
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Artículos</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      Aún no hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-900 font-medium">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded text-xs font-medium">
                          {sale.sale_items.reduce((acc, item) => acc + item.quantity, 0)} pares
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DEL TICKET */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-center gap-2 text-zinc-900">
                <Receipt size={20} className="text-emerald-600" />
                <h2 className="font-semibold">Detalle de Venta</h2>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6 pb-4 border-b border-zinc-100 border-dashed">
                <Calendar size={16} />
                {formatDate(selectedSale.created_at)}
              </div>

              <div className="space-y-4 mb-6">
                {selectedSale.sale_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{item.product_name}</p>
                      <p className="text-zinc-500 text-xs">
                        {item.quantity} x {formatCOP(item.unit_price)}
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

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <Button onClick={() => setSelectedSale(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}