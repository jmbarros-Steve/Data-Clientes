import { DATE_PRESETS } from '@/lib/metric-utils'
import { cn } from '@/lib/utils'

interface DatePresetSelectorProps {
  value: string
  onChange: (preset: string) => void
}

export function DatePresetSelector({ value, onChange }: DatePresetSelectorProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onChange(preset.key)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer',
            value === preset.key
              ? 'bg-[#1E3A7B] text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}
