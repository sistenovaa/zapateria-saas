'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  date: string
  ventas: number
}

export function SalesChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-zinc-400">
        No hay datos de ventas para mostrar.
      </div>
    )
  }

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip 
            formatter={(value: any) => [formatCOP(Number(value)), 'Ventas']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}