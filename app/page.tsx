'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useDevices, getBestCalibration } from '@/hooks/useDevices'
import { calculateSafeVolume } from '@/lib/audio'
import { DbMeter } from '@/components/DbMeter'
import { DbGraph } from '@/components/DbGraph'
import { TrafficLight } from '@/components/TrafficLight'

export default function MonitorPage() {
  const [query, setQuery] = useState('')
  const { devices, loading } = useDevices()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [showGraph, setShowGraph] = useState(false)
  const [started, setStarted] = useState(false)
  const { db, micStatus, error, start, stop } = useAudioAnalyzer({ updateInterval: 500, enabled: started })

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) setSelectedDeviceId(devices[0].id)
  }, [devices, selectedDeviceId])

  const selectedDevice = devices.find(d => d.id === selectedDeviceId)
  const bestCalibration = selectedDevice ? getBestCalibration(selectedDevice) : null
  const hasCalibration = (bestCalibration?.points?.length ?? 0) >= 2

  const safeVolume = hasCalibration && started
    ? calculateSafeVolume(bestCalibration!.points, db)
    : null

  const handleStartStop = async () => {
    if (started) { stop(); setStarted(false) }
    else { setStarted(true); await start() }
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-cyan-400">Nobody</span>Asked
        </h1>
        <p className="text-white/40 text-sm">Headphone leakage monitor</p>
      </div>

      {!loading && devices.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedDeviceId}
            onChange={e => setSelectedDeviceId(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {devices.map(d => (
              <option key={d.id} value={d.id} className="bg-slate-900">
                {d.brand} {d.name} {d.calibrations.length > 0 ? `(${d.calibrations.length} cal.)` : '(uncalibrated)'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="glass rounded-3xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Ambient Noise</p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold tabular-nums text-white">
                {started ? Math.round(db) : '--'}
              </span>
              <span className="text-white/40 text-lg mb-2">dB</span>
            </div>
          </div>
          {safeVolume && <TrafficLight status={safeVolume.status} size={20} />}
        </div>
        <DbMeter db={db} height={10} />
        {micStatus === 'active' && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/40 text-xs">Microphone active</span>
          </div>
        )}
      </div>

      {safeVolume && started && (
        <div className={`rounded-3xl p-5 mb-4 border transition-all duration-500 ${
          safeVolume.status === 'safe' ? 'bg-emerald-500/10 border-emerald-500/30'
          : safeVolume.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-red-500/10 border-red-500/30'
        }`}>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Safe Volume</p>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-4xl font-bold ${
                safeVolume.status === 'safe' ? 'text-emerald-400'
                : safeVolume.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>{safeVolume.safeVolumeStep}</span>
              <span className="text-white/40 text-lg"> / {safeVolume.maxVolumeStep}</span>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                safeVolume.status === 'safe' ? 'text-emerald-400'
                : safeVolume.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {safeVolume.status === 'safe' ? 'All good' : safeVolume.status === 'warning' ? 'Be careful' : 'Too loud!'}
              </p>
              <p className="text-white/40 text-xs">
                {safeVolume.status === 'safe' ? 'Volume is private' : 'Others may hear you'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && devices.length === 0 && (
        <div className="glass rounded-3xl p-5 mb-4 text-center">
          <p className="text-white/60 text-sm">No devices yet.</p>
          <p className="text-white/40 text-xs mt-1">Search or add your headphones in the Devices tab.</p>
        </div>
      )}

      {!loading && devices.length > 0 && !hasCalibration && (
        <div className="glass rounded-3xl p-5 mb-4">
          <p className="text-white/60 text-sm font-medium">No calibration available</p>
          <p className="text-white/40 text-xs mt-1">Be the first to calibrate this device in the Calibrate tab.</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {started && (
        <button onClick={() => setShowGraph(v => !v)} className="w-full glass rounded-2xl py-3 text-sm text-white/60 mb-4 hover:text-white/80 transition-colors">
          {showGraph ? 'Hide' : 'Show'} live graph
        </button>
      )}
      {showGraph && started && (
        <div className="glass rounded-3xl p-4 mb-4">
          <p className="text-white/40 text-xs mb-3">Last 30 seconds</p>
          <DbGraph db={db} />
        </div>
      )}

      <button
        onClick={handleStartStop}
        disabled={micStatus === 'requesting'}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 ${
          started
            ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
            : 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
        }`}
      >
        {micStatus === 'requesting' ? 'Starting...' : started ? 'Stop Monitoring' : 'Start Monitoring'}
      </button>
    </main>
  )
}
