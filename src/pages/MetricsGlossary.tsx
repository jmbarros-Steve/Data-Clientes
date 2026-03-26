import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Eye, Users, MousePointerClick, Percent, DollarSign, BadgeDollarSign,
  BarChart3, Target, Calculator, TrendingUp, Repeat, Play, HelpCircle,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Eye: <Eye className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  MousePointerClick: <MousePointerClick className="h-5 w-5" />,
  Percent: <Percent className="h-5 w-5" />,
  DollarSign: <DollarSign className="h-5 w-5" />,
  BadgeDollarSign: <BadgeDollarSign className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Calculator: <Calculator className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Repeat: <Repeat className="h-5 w-5" />,
  Play: <Play className="h-5 w-5" />,
}

const categoryLabels: Record<string, string> = {
  engagement: 'Interacción',
  cost: 'Costos',
  conversion: 'Conversiones',
  general: 'General',
}

const categoryColors: Record<string, string> = {
  engagement: 'bg-blue-100 text-blue-700',
  cost: 'bg-yellow-100 text-yellow-700',
  conversion: 'bg-green-100 text-green-700',
  general: 'bg-gray-100 text-gray-700',
}

interface MetricEntry {
  id: string
  metric_key: string
  display_name: string
  description: string
  icon: string | null
  category: string
  sort_order: number
}

export default function MetricsGlossary() {
  const [metrics, setMetrics] = useState<MetricEntry[]>([])

  useEffect(() => {
    supabase
      .from('metric_glossary')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setMetrics(data ?? []))
  }, [])

  const grouped = metrics.reduce<Record<string, MetricEntry[]>>((acc, m) => {
    const cat = m.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  return (
    <ClientLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Glosario de Métricas</h1>
          <p className="text-muted-foreground">
            Entendé qué significa cada número en tu dashboard
          </p>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <Badge className={categoryColors[category] ?? categoryColors.general}>
                {categoryLabels[category] ?? category}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map(metric => (
                <Card key={metric.id} id={metric.metric_key}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {metric.icon && iconMap[metric.icon] ? iconMap[metric.icon] : <HelpCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{metric.display_name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ClientLayout>
  )
}
