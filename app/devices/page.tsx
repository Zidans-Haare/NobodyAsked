'use client'
import { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import Link from 'next/link'

export default function DevicesPage() {
  const { devices, loading, createDevice, deleteDevice } = useDevices()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    await createDevice(newName.trim())
    setNewName('')
    setShowForm(false)
    setCreating(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This will remove all calibration data.`)) {
      await deleteDevice(id)
    }
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          <p className="text-white/40 text-sm">Your headphone profiles</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-cyan-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-cyan-400 transition-colors"
        >
          + Add
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="text-sm text-white/60 mb-3">Device name</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. AirPods Pro, Sony WH-1000XM5"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex-1 bg-cyan-500 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-cyan-400 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewName('') }}
              className="px-4 glass rounded-xl text-sm text-white/60"
            >
              Cancel
            </button>
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
          <p className="text-white/60 font-medium">No devices yet</p>
          <p className="text-white/30 text-sm mt-1">Add your first headphone profile above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map(device => (
            <div key={device.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{device.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {device.calibrationPoints.length > 0 ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        {device.calibrationPoints.length} calibration points
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">Not calibrated</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  <Link
                    href={`/calibrate?deviceId=${device.id}`}
                    className="glass-darker rounded-xl px-3 py-1.5 text-xs text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
                  >
                    Calibrate
                  </Link>
                  <button
                    onClick={() => handleDelete(device.id, device.name)}
                    className="glass-darker rounded-xl px-3 py-1.5 text-xs text-red-400 font-medium hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {device.calibrationPoints.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex gap-1 flex-wrap">
                    {device.calibrationPoints.map(p => (
                      <div
                        key={p.id}
                        className="text-xs bg-white/5 rounded-lg px-2 py-1 text-white/40"
                        title={`Vol: ${p.volumeStep}%, Leakage: ${p.leakageDb.toFixed(1)}dB`}
                      >
                        {p.volumeStep}% → {p.leakageDb.toFixed(0)}dB
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
