'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Monitor', icon: '📡' },
  { href: '/calibrate', label: 'Calibrate', icon: '🎚️' },
  { href: '/devices', label: 'Devices', icon: '🎧' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-md mx-auto">
        <div className="mx-4 mb-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex">
            {tabs.map(tab => {
              const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className={`text-xs font-medium ${active ? 'text-cyan-400' : ''}`}>
                    {tab.label}
                  </span>
                  {active && (
                    <div className="absolute bottom-0 w-8 h-0.5 bg-cyan-400 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
