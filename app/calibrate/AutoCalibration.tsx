'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useDevices, Device } from '@/hooks/useDevices'
import { DbMeter } from '@/components/DbMeter'

const VOLUME_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const MEASURE_DURATION = 3000 // 3 seconds per step

interface AutoCalibrationProps {
  device: Device
  onDone: () => void
}

export function AutoCalibration({ device, onDone }: AutoCalibrationProps) {
  const [stepIndex, setStepIndex] = useState(-1) // -1 = ambient phase
  const [phase, setPhase] = useState<'setup' | 'ambient' | 'measuring' | 'done'>('setup')
  const [progress, setProgress] = useState(0)
  const [ambientDb, setAmbientDb] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const { db, micStatus, error, start, stop } = useAudioAnalyzer({ updateInterval: 200 })
  const { addCalibrationPoint } = useDevices()
  const samplesRef = useRef<number[]>([])
  const startTimeRef = useRef(0)
  const [started, setStarted] = useState(false)

  const currentStep = stepIndex >= 0 ? VOLUME_STEPS[stepIndex] : 0

  const finalizeMeasurement = useCallback(async () => {
    if (samplesRef.current.length === 0) return
    const avg = samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length

    if (stepIndex === -1) {
      // Ambient phase
      setAmbientDb(avg)
      setPhase('measuring')
      setStepIndex(0)
      setProgress(0)
    } else {
      // Volume step
      await addCalibrationPoint(device.id, VOLUME_STEPS[stepIndex], avg, ambientDb)
      setCompleted(prev => [...prev, VOLUME_STEPS[stepIndex]])

      if (stepIndex < VOLUME_STEPS.length - 1) {
        setStepIndex(i => i + 1)
        setProgress(0)
      } else {
        setPhase('done')
        stop()
      }
    }
    samplesRef.current = []
  }, [stepIndex, ambientDb, addCalibrationPoint, device.id, stop])

  useEffect(() => {
    if (phase !== 'ambient' && phase !== 'measuring') return

    samplesRef.current.push(db)
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }
    const elapsed = Date.now() - startTimeRef.current
    const pct = Math.min(100, (elapsed / MEASURE_DURATION) * 100)
    setProgress(pct)

    if (elapsed >= MEASURE_DURATION) {
      startTimeRef.current = 0
      finalizeMeasurement()
    }
  }, [db, phase, finalizeMeasurement])

  const handleStart = async () => {
    setStarted(true)
    await start()
    setPhase('ambient')
  }

  useEffect(() => {
    return () => stop()
  }, [stop])

  if (!started) {
    return (
      <main className="flex-1 px-4 pt-6 pb-28">
        <div className="mb-6">
          <button onClick={onDone} className="text-white/40 text-sm mb-4">← Back</button>
          <h1 className="text-2xl font-bold">Auto Calibration</h1>
          <p className="text-cyan-400 text-sm">{device.name}</p>
        </div>

        <div className="glass rounded-3xl p-6 mb-6">
          <h3 className="font-semibold mb-3">Setup</h3>
          <ol className="space-y-3 text-white/60 text-sm">
            <li className="flex gap-3"><span className="text-purple-400 font-bold">1.</span> Put on your headphones and play music on repeat</li>
            <li className="flex gap-3"><span className="text-purple-400 font-bold">2.</span> Place the phone microphone near the ear cup</li>
            <li className="flex gap-3"><span className="text-purple-400 font-bold">3.</span> Start – first a quiet baseline is measured</li>
            <li className="flex gap-3"><span className="text-purple-400 font-bold">4.</span> When prompted, adjust volume to the displayed step</li>
            <li className="flex gap-3"><span className="text-purple-400 font-bold">5.</span> Hold still for 3 seconds at each step</li>
          </ol>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-purple-500 text-white py-4 rounded-2xl font-semibold hover:bg-purple-400 transition-colors shadow-[0_0_30px_rgba(168,85,247,0.3)]"
        >
          Start Auto Calibration
        </button>
      </main>
    )
  }

  if (phase === 'done') {
    return (
      <main className="flex-1 px-4 pt-6 pb-28">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Calibration Complete!</h2>
          <p className="text-white/40 text-sm mb-2">{completed.length} points recorded</p>
          <p className="text-white/30 text-xs mb-8 text-center">
            Your leakage profile for {device.name} is ready.
          </p>
          <button
            onClick={onDone}
            className="bg-cyan-500 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-cyan-400 transition-colors"
          >
            Done
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <div className="mb-4">
        <button onClick={() => { stop(); onDone() }} className="text-white/40 text-sm mb-4">← Cancel</button>
        <h1 className="text-xl font-bold">Auto Calibration</h1>
        <p className="text-cyan-400 text-sm">{device.name}</p>
      </div>

      {/* Step progress */}
      <div className="flex gap-1 mb-5">
        {VOLUME_STEPS.map((step, i) => (
          <div
            key={step}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              completed.includes(step) ? 'bg-purple-400'
              : i === stepIndex ? 'bg-cyan-400'
              : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Live dB */}
      <div className="glass rounded-3xl p-5 mb-4">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Live Reading</p>
        <div className="text-5xl font-bold text-white mb-3">{Math.round(db)} <span className="text-white/30 text-xl">dB</span></div>
        <DbMeter db={db} height={8} />
      </div>

      {/* Current instruction */}
      <div className="glass rounded-2xl p-5 mb-4">
        {phase === 'ambient' ? (
          <>
            <p className="text-lg font-semibold mb-1">Measuring baseline...</p>
            <p className="text-white/40 text-sm">Keep the room quiet. Don&apos;t play music yet.</p>
          </>
        ) : (
          <>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Set volume to</p>
            <p className="text-5xl font-bold text-cyan-400 mb-1">{currentStep}%</p>
            <p className="text-white/40 text-sm">Hold still while measuring...</p>
          </>
        )}

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/30 text-xs mt-2 text-right">{Math.ceil((1 - progress / 100) * 3)}s</p>
      </div>

      {ambientDb > 0 && (
        <div className="glass-darker rounded-xl p-3 text-xs text-white/30 flex justify-between">
          <span>Baseline: {ambientDb.toFixed(1)} dB</span>
          <span>Step {stepIndex + 1}/{VOLUME_STEPS.length}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
    </main>
  )
}
