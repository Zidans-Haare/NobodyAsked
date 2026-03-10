'use client'

interface DbMeterProps {
  db: number
  minDb?: number
  maxDb?: number
  height?: number
}

export function DbMeter({ db, minDb = 30, maxDb = 90, height = 8 }: DbMeterProps) {
  const percent = Math.max(0, Math.min(100, ((db - minDb) / (maxDb - minDb)) * 100))

  const color = percent > 80 ? 'from-red-500 to-red-600'
    : percent > 60 ? 'from-yellow-400 to-orange-500'
    : 'from-emerald-400 to-cyan-500'

  return (
    <div className="w-full" style={{ height }}>
      <div className="w-full h-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-150`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
