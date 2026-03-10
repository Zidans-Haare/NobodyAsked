'use client'
import { useState, useCallback, useEffect } from 'react'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { DeviceModel } from '@/hooks/useDevices'
import { DbMeter } from '@/components/DbMeter'

const VOLUME_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

interface Point { volumeStep: number; leakageDb: number; ambientDb: number }

interface Props {
  device: DeviceModel
  onSubmit: (deviceId: string, points: Point[], note?: string) => Promise<any>
  onDone: () => void
}

export function ManualCalibration({ device, onSubmit, onDone }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [started, setStarted] = useState(false)
  const [ambientDb, setAmbientDb] = useState<number | null>(null)
  const [captured, setCaptured] = useState<number | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { db, micStatus, error, start, stop } = useAudioAnalyzer({ updateInterval: 300 })

  useEffect(() => () => stop(), [stop])

  const currentStep = VOLUME_STEPS[stepIndex]

  const confirmAudible = useCallback(async (audible: boolean) => {
    if (captured === null || ambientDb === null) return
    const leakageDb = audible ? captured : ambientDb - 5
    const newPoints = [...points, { volumeStep: currentStep, leakageDb, ambientDb }]
    setPoints(newPoints)

    if (stepIndex < VOLUME_STEPS.length - 1) {
      setStepIndex(i => i + 1)
      setCaptured(null)
    } else {
      setSubmitting(true)
      await onSubmit(device.id, newPoints, note)
      stop()
      onDone()
    }
  }, [captured, ambientDb, points, currentStep, stepIndex, onSubmit, device.id, note, stop, onDone])

  if (!started) return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <button onClick={onDone} className="text-white/40 text-sm mb-4 block">← Back</button>
      <h1 className="text-2xl font-bold mb-1">Manual Calibration</h1>
      <p className="text-cyan-400 text-sm mb-6">{device.brand} {device.name}</p>
      <div className="glass rounded-3xl p-6 mb-6 space-y-3 text-white/60 text-sm">
        <p><span className="text-cyan-400 font-bold">1.</span> Measure ambient noise in silence first</p>
        <p><span className="text-cyan-400 font-bold">2.</span> Put on headphones and play music</p>
        <p><span className="text-cyan-400 font-bold">3.</span> Helper holds phone near ear cup</p>
        <p><span className="text-cyan-400 font-bold">4.</span> Capture → confirm audible or not at each step</p>
      </div>
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note (e.g. 'measured in quiet room')"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-4"
      />
      <button onClick={async () => { setStarted(true); await start() }} className="w-full bg-cyan-500 text-white py-4 rounded-2xl font-semibold hover:bg-cyan-400 transition-colors">
        Start Calibration
      </button>
    </main>
  )

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <button onClick={() => { stop(); onDone() }} className="text-white/40 text-sm mb-4 block">← Cancel</button>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold">Manual Calibration</h1>
        <span className="text-white/40 text-sm">{stepIndex + 1}/{VOLUME_STEPS.length}</span>
      </div>
      <p className="text-cyan-400 text-sm mb-4">{device.brand} {device.name}</p>

      <div className="flex gap-1 mb-5">
        {VOLUME_STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${points.find(p => p.volumeStep === s) ? 'bg-emerald-400' : i === stepIndex ? 'bg-cyan-400' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="glass rounded-3xl p-5 mb-4">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Live dB</p>
        <div className="text-5xl font-bold mb-3">{Math.round(db)} <span className="text-white/30 text-xl">dB</span></div>
        <DbMeter db={db} height={8} />
      </div>

      {!ambientDb ? (
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="text-white/60 text-sm font-medium mb-1">Measure ambient (room quiet, no music)</p>
          <button onClick={() => setAmbientDb(db)} className="w-full bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-xl py-3 text-sm font-medium mt-2">
            Capture ambient ({Math.round(db)} dB)
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Set volume to</p>
          <p className="text-4xl font-bold text-cyan-400 mb-3">{currentStep}%</p>
          {captured === null ? (
            <button onClick={() => setCaptured(db)} className="w-full bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl py-3 text-sm font-semibold">
              Capture ({Math.round(db)} dB)
            </button>
          ) : (
            <div>
              <p className="text-center text-white/50 text-sm mb-3">Captured: <span className="text-white font-bold">{captured.toFixed(1)} dB</span> — Is music audible?</p>
              <div className="flex gap-3">
                <button onClick={() => confirmAudible(true)} disabled={submitting} className="flex-1 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl py-3 text-sm font-medium">Yes</button>
                <button onClick={() => confirmAudible(false)} disabled={submitting} className="flex-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl py-3 text-sm font-medium">No</button>
              </div>
            </div>
          )}
          <button onClick={() => { setStepIndex(i => Math.min(i + 1, VOLUME_STEPS.length - 1)); setCaptured(null) }} className="w-full mt-2 text-white/20 text-xs py-2 hover:text-white/40">Skip</button>
        </div>
      )}
    </main>
  )
}
