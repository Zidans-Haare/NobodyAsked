export interface AudioAnalyzer {
  getDb: () => number
  stop: () => void
}

export async function createAudioAnalyzer(): Promise<AudioAnalyzer> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  if (audioContext.state === 'suspended') await audioContext.resume()

  const source = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.8
  source.connect(analyser)

  const bufferLength = analyser.fftSize
  const dataArray = new Float32Array(bufferLength)
  const rollingBuffer: number[] = []
  const ROLLING_FRAMES = 10

  function getDb(): number {
    analyser.getFloatTimeDomainData(dataArray)
    let sum = 0
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i]
    const rms = Math.sqrt(sum / bufferLength)
    if (rms === 0) return 0
    const raw = 20 * Math.log10(rms) + 74
    rollingBuffer.push(raw)
    if (rollingBuffer.length > ROLLING_FRAMES) rollingBuffer.shift()
    return rollingBuffer.reduce((a, b) => a + b, 0) / rollingBuffer.length
  }

  function stop() {
    stream.getTracks().forEach(t => t.stop())
    audioContext.close()
  }

  return { getDb, stop }
}

export interface CalibrationPointLike {
  volumeStep: number
  leakageDb: number
  ambientDb: number
}

export function calculateSafeVolume(
  points: CalibrationPointLike[],
  ambientDb: number
): { safeVolumeStep: number; maxVolumeStep: number; status: 'safe' | 'warning' | 'danger' } {
  if (!points.length) return { safeVolumeStep: 0, maxVolumeStep: 100, status: 'safe' }

  const sorted = [...points].sort((a, b) => a.volumeStep - b.volumeStep)
  const maxVolumeStep = sorted[sorted.length - 1].volumeStep
  const threshold = ambientDb + 3

  let safeVolumeStep = 0
  for (const p of sorted) {
    if (p.leakageDb <= threshold) safeVolumeStep = p.volumeStep
  }

  const pct = maxVolumeStep > 0 ? safeVolumeStep / maxVolumeStep : 0
  const status = pct >= 0.7 ? 'safe' : pct >= 0.4 ? 'warning' : 'danger'
  return { safeVolumeStep, maxVolumeStep, status }
}
