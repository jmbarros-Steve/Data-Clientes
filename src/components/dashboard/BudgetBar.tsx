import { Progress } from '@/components/ui/progress'

interface BudgetBarProps {
  spent: number
  budget: number
  label?: string
  compact?: boolean
}

export function BudgetBar({ spent, budget, label, compact = false }: BudgetBarProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const overBudget = spent > budget

  const getColor = () => {
    if (overBudget) return 'text-red-600'
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getBarColor = () => {
    if (overBudget) return '[&>div]:bg-red-500'
    if (percentage >= 90) return '[&>div]:bg-red-400'
    if (percentage >= 70) return '[&>div]:bg-yellow-400'
    return '[&>div]:bg-green-500'
  }

  if (compact) {
    return (
      <div className="w-full min-w-[80px]">
        <Progress value={percentage} className={`h-2 ${getBarColor()}`} />
        <p className={`text-xs mt-0.5 ${getColor()}`}>
          {percentage.toFixed(0)}%
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <Progress value={percentage} className={`h-3 ${getBarColor()}`} />
      <div className="flex justify-between text-sm">
        <span className={getColor()}>
          ${spent.toLocaleString('es-CL')} gastado
        </span>
        <span className="text-muted-foreground">
          ${budget.toLocaleString('es-CL')} presupuesto
        </span>
      </div>
      {overBudget && (
        <p className="text-xs text-red-500 font-medium">
          Sobre presupuesto por ${(spent - budget).toLocaleString('es-CL')}
        </p>
      )}
    </div>
  )
}
