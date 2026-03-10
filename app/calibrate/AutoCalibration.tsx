'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { DeviceModel } from '@/hooks/useDevices'
import { DbMeter } from '@/components/DbMeter'

const VOLUME_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const MEASURE_DURATION = 3000

interface Point { volumeStep: number; leakageDb: number; ambientDb: number }

interface Props {
  device: DeviceModel
  onSubmit: (deviceId: string, points: Point[], note?: string) => Promise<any>
  onDone: () => void
}

export function AutoCalibration({ device, onSubmit, onDone }: Props) {
  const [stepIndex, setStepIndex] = useState(-1)
  const [phase, setPhase] = useState<'setup' | 'ambient' | 'measuring' | 'done'>('setup')
  const [progress, setProgress] = useState(0)
  const [ambientDb, setAmbientDb] = useState(0)
  const [points, setPoints] = useState<Point[]>([])
  const [note, setNote] = useState('')
  const { db, error, start, stop } = useAudioAnalyzer({ updateInterval: 200 })
  const samplesRef = useRef<number[]>([])
  const startTimeRef = useRef(0)

  const finalize = useCallback(async (currentStepIndex: number, currentAmbient: number, currentPoints: Point[]) => {
    const avg = samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length
    samplesRef.current = []
    startTimeRef.current = 0

    if (currentStepIndex === -1) {
      setAmbientDb(avg)
      setPhase('measuring')
      setStepIndex(0)
      setProgress(0)
    } else {
      const newPoints = [...currentPoints, { volumeStep: VOLUME_STEPS[currentStepIndex], leakageDb: avg, ambientDb: currentAmbient }]
      setPoints(newPoints)
      if (currentStepIndex < VOLUME_STEPS.length - 1) {
        setStepIndex(currentStepIndex + 1)
        setProgress(0)
      } else {
        setPhase('done')
        await onSubmit(device.id, newPoints, note)
        stop()
      }
    }
  }, [onSubmit, device.id, note, stop])

  useEffect(() => {
    if (phase !== 'ambient' && phase !== 'measuring') return
    samplesRef.current.push(db)
    if (!startTimeRef.current) startTimeRef.current = Date.now()
    const elapsed = Date.now() - startTimeRef.current
    setProgress(Math.min(100, (elapsed / MEASURE_DURATION) * 100))
    if (elapsed >= MEASURE_DURATION) {
      finalize(stepIndex, ambientDb, points)
    }
  }, [db, phase, stepIndex, ambientDb, points, finalize])

  useEffect(() => () => stop(), [stop])

  if (phase === 'setup') return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <button onClick={onDone} className="text-white/40 text-sm mb-4 block">← Back</button>
      <h1 className="text-2xl font-bold mb-1">Auto Calibration</h1>
      <p className="text-cyan-400 text-sm mb-6">{device.brand} {device.name}</p>
      <div className="glass rounded-3xl p-6 mb-6 space-y-3 text-white/60 text-sm">
        <p><span className="text-purple-400 font-bold">1.</span> Put on headphones, play music on loop</p>
        <p><span className="text-purple-400 font-bold">2.</span> Place phone mic near the ear cup</p>
        <p><span className="text-purple-400 font-bold">3.</span> Baseline measured first, then each volume step</p>
        <p><span className="text-purple-400 font-bold">4.</span> Adjust volume when prompted, hold still 3s</p>
      </div>
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-4"
      />
      <button onClick={async () => { await start(); setPhase('ambient') }} className="w-full bg-purple-500 text-white py-4 rounded-2xl font-semibold hover:bg-purple-400 transition-colors">
        Start Auto Calibration
      </button>
    </main>
  )

  if (phase === 'done') return (
    <main className="flex-1 px-4 pt-6 pb-28 flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-2">Done!</h2>
      <p className="text-white/40 text-sm mb-8">{points.length} points recorded and shared</p>
      <button onClick={onDone} className="bg-cyan-500 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-cyan-400">Done</button>
    </main>
  )

  return (
    <main className="flex-1 px-4 pt-6 pb-28">
      <button onClick={() => { stop(); onDone() }} className="text-white/40 text-sm mb-4 block">← Cancel</button>
      <h1 className="text-xl font-bold mb-1">Auto Calibration</h1>
      <p className="text-cyan-400 text-sm mb-4">{device.brand} {device.name}</p>

      <div className="flex gap-1 mb-5">
        {VOLUME_STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${points.find(p => p.volumeStep === s) ? 'bg-purple-400' : i === stepIndex ? 'bg-cyan-400' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="glass rounded-3xl p-5 mb-4">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Live Reading</p>
        <div className="text-5xl font-bold mb-3">{Math.round(db)} <span className="text-white/30 text-xl">dB</span></div>
        <DbMeter db={db} height={8} />
      </div>

      <div className="glass rounded-2xl p-5 mb-4">
        {phase === 'ambient' ? (
          <><p className="text-lg font-semibold mb-1">Measuring baseline...</p><p className="text-white/40 text-sm">Room quiet, no music yet</p></>
        ) : (
          <><p className="text-white/40 text-xs uppercase tracking-widest mb-1">Set volume to</p><p className="text-5xl font-bold text-cyan-400 mb-1">{VOLUME_STEPS[stepIndex]}%</p><p className="text-white/40 text-sm">Hold still...</p></>
        )}
        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </main>
  )
}
