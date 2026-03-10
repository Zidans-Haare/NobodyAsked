'use client'

interface TrafficLightProps {
  status: 'safe' | 'warning' | 'danger'
  size?: number
}

export function TrafficLight({ status, size = 16 }: TrafficLightProps) {
  return (
    <div className="flex flex-col gap-2 items-center">
      {(['danger', 'warning', 'safe'] as const).map(s => (
        <div
          key={s}
          className={`rounded-full transition-all duration-500 ${
            status === s
              ? s === 'safe' ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)]'
                : s === 'warning' ? 'bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.7)]'
                : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]'
              : 'bg-white/10'
          }`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  )
}
