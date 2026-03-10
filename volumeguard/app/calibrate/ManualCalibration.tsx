'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useDevices, Device } from '@/hooks/useDevices'
import { DbMeter } from '@/components/DbMeter'

const VOLUME_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

interface ManualCalibrationProps {
  device: Device
  onDone: () => void
}

type StepState = 'idle' | 'measuring' | 'done'

export function ManualCalibration({ device, onDone }: ManualCalibrationProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [stepState, setStepState] = useState<StepState>('idle')
  const [ambientDb, setAmbientDb] = useState<number | null>(null)
  const [completed, setCompleted] = useState<number[]>([])
  const [measurementDb, setMeasurementDb] = useState<number | null>(null)
  const { db, micStatus, error, start, stop } = useAudioAnalyzer({ updateInterval: 300 })
  const { addCalibrationPoint } = useDevices()
  const [started, setStarted] = useState(false)

  const currentStep = VOLUME_STEPS[stepIndex]

  const handleStartMic = async () => {
    setStarted(true)
    await start()
  }

  const measureAmbient = useCallback(() => {
    setAmbientDb(db)
  }, [db])

  const captureReading = useCallback(() => {
    setMeasurementDb(db)
    setStepState('done')
  }, [db])

  const confirmAudible = useCallback(async (audible: boolean) => {
    if (measurementDb === null || ambientDb === null) return
    const leakageDb = audible ? measurementDb : ambientDb - 5
    await addCalibrationPoint(device.id, currentStep, leakageDb, ambientDb)
    setCompleted(prev => [...prev, currentStep])

    if (stepIndex < VOLUME_STEPS.length - 1) {
      setStepIndex(i => i + 1)
      setStepState('idle')
      setMeasurementDb(null)
    } else {
      stop()
      onDone()
    }
  }, [measurementDb, ambientDb, addCalibrationPoint, device.id, currentStep, stepIndex, stop, onDone])

  const skip = () => {
    if (stepIndex < VOLUME_STEPS.length - 1) {
      setStepIndex(i => i + 1)
      setStepState('idle')
      setMeasurementDb(null)
    } else {
      stop()
      onDone()
    }
  }

  useEffect(() => {
    return () => stop()
  }, [stop])

  if (!started) {
    return (
      <main className="flex-1 px-4 pt-6 pb-28">
        <div className="mb-6">
          <button onClick={onDone} className="text-white/40 text-sm mb-4 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Manual Calibration</h1>
          <p className="text-cyan-400 text-sm">{device.name}</p>
        </div>

        <div className="glass rounded-3xl p-6 mb-6">
          <h3 className="font-semibold mb-3">How it works</h3>
          <ol className="space-y-3 text-white/60 text-sm">
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">1.</span> First, measure ambient noise in silence</li>
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">2.</span> Put on your headphones and play music</li>
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">3.</span> A helper holds the phone near the headphones</li>
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">4.</span> For each volume step, tap &quot;Capture&quot; then confirm if audible</li>
            <li className="flex gap-3"><span className="text-cyan-400 font-bold">5.</span> Repeat for {VOLUME_STEPS.length} volume steps</li>
          </ol>
        </div>

        <button
          onClick={handleStartMic}
          className="w-full bg-cyan-500 text-white py-4 rounded-2xl font-semibold hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.3)]"
        >
          Start Calibration
        </button>
      </main>
    )
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <div className="mb-4">
        <button onClick={() => { stop(); onDone() }} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          ← Cancel
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Manual Calibration</h1>
          <span className="text-white/40 text-sm">{stepIndex + 1}/{VOLUME_STEPS.length}</span>
        </div>
        <p className="text-cyan-400 text-sm">{device.name}</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-5">
        {VOLUME_STEPS.map((step, i) => (
          <div
            key={step}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              completed.includes(step) ? 'bg-emerald-400'
              : i === stepIndex ? 'bg-cyan-400'
              : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* dB display */}
      <div className="glass rounded-3xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/40 text-xs uppercase tracking-widest">Live dB</p>
          {micStatus === 'active' && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs">Active</span>
            </div>
          )}
        </div>
        <div className="text-5xl font-bold text-white mb-3">{Math.round(db)} <span className="text-white/30 text-xl">dB</span></div>
        <DbMeter db={db} height={8} />
      </div>

      {/* Ambient measurement */}
      {!ambientDb && (
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="text-white/60 text-sm font-medium mb-2">Step 1: Measure ambient noise</p>
          <p className="text-white/40 text-xs mb-3">Ensure the room is quiet (no music yet). Hold the phone normally.</p>
          <button
            onClick={measureAmbient}
            className="w-full bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-xl py-2.5 text-sm font-medium hover:bg-blue-500/40 transition-colors"
          >
            Capture ambient ({Math.round(db)} dB)
          </button>
        </div>
      )}

      {/* Volume step */}
      {ambientDb && (
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Current Step</p>
          <p className="text-sm text-white/60 mb-1">
            Set volume to <span className="text-cyan-400 font-bold text-xl">{currentStep}%</span>
          </p>
          <p className="text-white/30 text-xs mb-4">Helper: hold phone ~10cm from the ear cup</p>

          {stepState === 'idle' && (
            <button
              onClick={captureReading}
              className="w-full bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl py-3 text-sm font-semibold hover:bg-cyan-500/40 transition-colors"
            >
              Capture reading ({Math.round(db)} dB)
            </button>
          )}

          {stepState === 'done' && measurementDb !== null && (
            <div>
              <p className="text-center text-white/50 text-sm mb-3">
                Captured: <span className="text-white font-bold">{measurementDb.toFixed(1)} dB</span>
              </p>
              <p className="text-center text-white/60 text-sm font-medium mb-3">Is the music audible?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => confirmAudible(true)}
                  className="flex-1 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl py-3 text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  Yes, audible
                </button>
                <button
                  onClick={() => confirmAudible(false)}
                  className="flex-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl py-3 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  Not audible
                </button>
              </div>
            </div>
          )}

          <button
            onClick={skip}
            className="w-full mt-2 text-white/20 text-xs py-2 hover:text-white/40 transition-colors"
          >
            Skip this step
          </button>
        </div>
      )}

      {ambientDb && (
        <div className="glass-darker rounded-xl p-3 text-xs text-white/30 flex justify-between">
          <span>Ambient: {ambientDb.toFixed(1)} dB</span>
          <span>Volume: {currentStep}%</span>
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
