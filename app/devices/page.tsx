'use client'
import { useState } from 'react'
import { useDevices, getBestCalibration } from '@/hooks/useDevices'

const DEVICE_TYPES = ['over-ear', 'on-ear', 'in-ear']

export default function DevicesPage() {
  const [query, setQuery] = useState('')
  const { devices, loading, createDevice, vote } = useDevices(query)
  const [showForm, setShowForm] = useState(false)
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('over-ear')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!brand.trim() || !name.trim()) return
    setCreating(true)
    await createDevice(brand.trim(), name.trim(), type)
    setBrand(''); setName(''); setType('over-ear')
    setShowForm(false)
    setCreating(false)
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          <p className="text-white/40 text-sm">Community headphone library</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-cyan-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-cyan-400 transition-colors"
        >
          + Add
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search devices..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-4"
      />

      {showForm && (
        <div className="glass rounded-2xl p-4 mb-4 space-y-3">
          <p className="text-sm text-white/60 font-medium">Add new device</p>
          <input
            type="text"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder="Brand (e.g. Sony, Apple, Bose)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Model name (e.g. WH-1000XM5)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {DEVICE_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !brand.trim() || !name.trim()}
              className="flex-1 bg-cyan-500 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-cyan-400"
            >
              {creating ? 'Adding...' : 'Add device'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 glass rounded-xl text-sm text-white/60">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-4xl mb-3">🎧</div>
          <p className="text-white/60 font-medium">{query ? 'No devices found' : 'No devices yet'}</p>
          <p className="text-white/30 text-sm mt-1">{query ? 'Try a different search or add it' : 'Be the first to add a device'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map(device => {
            const best = getBestCalibration(device)
            const score = best ? best.votes.reduce((s, v) => s + v.value, 0) : 0
            return (
              <div key={device.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{device.brand} {device.name}</h3>
                      {best?.verified && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">verified</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/30">{device.type}</span>
                      {device.calibrations.length > 0 ? (
                        <span className="text-xs text-cyan-400">{device.calibrations.length} calibration{device.calibrations.length !== 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-xs text-white/30">uncalibrated</span>
                      )}
                    </div>
                  </div>
                  {best && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => vote(best.id, 1)} className="text-white/30 hover:text-emerald-400 transition-colors text-lg">↑</button>
                      <span className={`text-sm font-medium tabular-nums ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-white/40'}`}>{score}</span>
                      <button onClick={() => vote(best.id, -1)} className="text-white/30 hover:text-red-400 transition-colors text-lg">↓</button>
                    </div>
                  )}
                </div>
                {best && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1">
                    {best.points.map(p => (
                      <span key={p.id} className="text-xs bg-white/5 rounded-lg px-2 py-0.5 text-white/30">
                        {p.volumeStep}%→{p.leakageDb.toFixed(0)}dB
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
