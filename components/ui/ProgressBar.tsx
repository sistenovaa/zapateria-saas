interface ProgressBarProps {
  current: number
  max: number | null
  label?: string
}

export function ProgressBar({ current, max, label }: ProgressBarProps) {
  if (max === null) return null // Si es ilimitado (Pro), no mostramos barra

  const percentage = Math.min((current / max) * 100, 100)
  
  // Cambiar color según el uso
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        {label && <span className="text-xs font-medium text-zinc-500">{label}</span>}
        <span className={`text-xs font-bold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-zinc-500'}`}>
          {current} / {max}
        </span>
      </div>
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}