'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDevices } from '@/hooks/useDevices'
import { ManualCalibration } from './ManualCalibration'
import { AutoCalibration } from './AutoCalibration'

function CalibrateContent() {
  const searchParams = useSearchParams()
  const { devices, loading, submitCalibration } = useDevices()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [mode, setMode] = useState<'select' | 'manual' | 'auto'>('select')

  useEffect(() => {
    const deviceId = searchParams.get('deviceId')
    if (deviceId) setSelectedDeviceId(deviceId)
    else if (devices.length > 0 && !selectedDeviceId) setSelectedDeviceId(devices[0].id)
  }, [searchParams, devices, selectedDeviceId])

  const selectedDevice = devices.find(d => d.id === selectedDeviceId)

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  )

  if (mode === 'manual' && selectedDevice) {
    return <ManualCalibration device={selectedDevice} onSubmit={submitCalibration} onDone={() => setMode('select')} />
  }
  if (mode === 'auto' && selectedDevice) {
    return <AutoCalibration device={selectedDevice} onSubmit={submitCalibration} onDone={() => setMode('select')} />
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calibrate</h1>
        <p className="text-white/40 text-sm">Measure and share leakage data</p>
      </div>

      {devices.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-4xl mb-3">🎧</div>
          <p className="text-white/60 font-medium">No devices yet</p>
          <p className="text-white/30 text-sm mt-1">Add a device in the Devices tab first</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-sm text-white/50 mb-2">Select device</p>
            <select
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900">{d.brand} {d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <button onClick={() => setMode('manual')} className="w-full glass rounded-3xl p-5 text-left hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl">👥</div>
                <div>
                  <h3 className="font-semibold">Manual Calibration</h3>
                  <p className="text-white/40 text-sm">With a helper – more accurate</p>
                </div>
              </div>
            </button>
            <button onClick={() => setMode('auto')} className="w-full glass rounded-3xl p-5 text-left hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-2xl">🤖</div>
                <div>
                  <h3 className="font-semibold">Auto Calibration</h3>
                  <p className="text-white/40 text-sm">Solo – place phone next to headphones</p>
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </main>
  )
}

export default function CalibratePage() {
  return <Suspense><CalibrateContent /></Suspense>
}
