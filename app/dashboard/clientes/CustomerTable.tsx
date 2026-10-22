'use client'

import { useState } from 'react'
import { CustomerModal } from './CustomerModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Edit2, Users, Phone, Mail, DollarSign, X, History } from 'lucide-react'
import { registerPayment } from './actions'
import { showSuccess, showError } from '@/components/ui/Alert'

interface CreditPayment {
  id: string
  amount: number
  created_at: string
}

interface Credit {
  id: string
  amount: number
  balance: number
  status: string
  created_at: string
  payments: CreditPayment[]
}

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  credits: Credit[]
}

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateString))
}

export function CustomerTable({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  function handleCreate() {
    setSelectedCustomer(null)
    setIsModalOpen(true)
  }

  function handleEdit(customer: Customer) {
    setSelectedCustomer(customer)
    setIsModalOpen(true)
  }

  function handleOpenPayments(customer: Customer) {
    setPaymentCustomer(customer)
    setPaymentAmount('')
  }

  const getTotalDebt = (customer: Customer) => {
    return customer.credits
      .filter(c => c.status === 'pending')
      .reduce((acc, c) => acc + Number(c.balance), 0)
  }

  async function handleRegisterPayment(creditId: string) {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      showError('Ingresa un monto válido.')
      return
    }

    setIsPaying(true)
    const result = await registerPayment(creditId, amount)

    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('Abono registrado', 'El saldo pendiente se ha actualizado.')
      setPaymentAmount('')
      window.location.reload()
    }
    setIsPaying(false)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clientes y Créditos</h1>
          <p className="text-zinc-500">Gestiona tu directorio de clientes y controla las deudas.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} /> Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Deuda Total</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No hay clientes registrados. ¡Crea el primero!
                  </td>
                </tr>
              ) : (
                initialCustomers.map((customer) => {
                  const totalDebt = getTotalDebt(customer)

                  return (
                    <tr key={customer.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 flex items-center gap-2">
                          <Users size={16} className="text-zinc-400" />
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-zinc-500 text-xs">
                            <Phone size={12} className="text-zinc-400" /> {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-zinc-500 text-xs">
                            <Mail size={12} className="text-zinc-400" /> {customer.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {totalDebt > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-red-600 bg-red-50">
                            {formatCOP(totalDebt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50">
                            Al día
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {totalDebt > 0 && (
                            <Button variant="outline" size="sm" onClick={() => handleOpenPayments(customer)} className="gap-2 bg-white">
                              <DollarSign size={16} /> Abonar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                            <Edit2 size={16} className="text-zinc-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customer={selectedCustomer} 
      />

      {/* MODAL DE ABONOS Y HISTORIAL */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">Cuentas por Cobrar</h2>
                <p className="text-sm text-zinc-500">{paymentCustomer.name}</p>
              </div>
              <button onClick={() => setPaymentCustomer(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {paymentCustomer.credits.filter(c => c.status === 'pending').length === 0 ? (
                <p className="text-center text-zinc-500 py-4">Este cliente no tiene deudas pendientes.</p>
              ) : (
                paymentCustomer.credits.filter(c => c.status === 'pending').map(credit => (
                  <div key={credit.id} className="border border-zinc-200 rounded-xl overflow-hidden">
                    {/* Cabecera del Crédito */}
                    <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex justify-between items-center">
                      <span className="text-xs text-zinc-500">
                        Crédito del {new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(credit.created_at))}
                      </span>
                      <span className="font-bold text-red-600">Debe: {formatCOP(credit.balance)}</span>
                    </div>

                    {/* Formulario de Abono */}
                    <div className="p-4 bg-white flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Monto a abonar" 
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="h-9"
                      />
                      <Button 
                        onClick={() => handleRegisterPayment(credit.id)}
                        isLoading={isPaying}
                        className="h-9 whitespace-nowrap"
                      >
                        Abonar
                      </Button>
                    </div>

                    {/* Historial de Abonos */}
                    {credit.payments && credit.payments.length > 0 && (
                      <div className="bg-zinc-50 p-4 border-t border-zinc-200">
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          <History size={14} /> Historial de Abonos
                        </div>
                        <ul className="space-y-2">
                          {credit.payments.map(payment => (
                            <li key={payment.id} className="flex justify-between items-center text-sm text-zinc-600">
                              <span>{formatDate(payment.created_at)}</span>
                              <span className="font-medium text-emerald-600">+ {formatCOP(payment.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}