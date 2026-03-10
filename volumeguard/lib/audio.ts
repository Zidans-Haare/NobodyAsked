// Web Audio API utilities for real-time dB measurement

export interface AudioAnalyzer {
  getDb: () => number
  stop: () => void
}

export async function createAudioAnalyzer(): Promise<AudioAnalyzer> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  // iOS Safari requires resume after user gesture
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  const source = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.8
  source.connect(analyser)

  const bufferLength = analyser.fftSize
  const dataArray = new Float32Array(bufferLength)

  // Rolling average buffer
  const rollingBuffer: number[] = []
  const ROLLING_FRAMES = 10

  function getRawDb(): number {
    analyser.getFloatTimeDomainData(dataArray)
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(sum / bufferLength)
    if (rms === 0) return -Infinity
    return 20 * Math.log10(rms)
  }

  function getDb(): number {
    const raw = getRawDb()
    rollingBuffer.push(raw)
    if (rollingBuffer.length > ROLLING_FRAMES) {
      rollingBuffer.shift()
    }
    const avg = rollingBuffer.reduce((a, b) => a + b, 0) / rollingBuffer.length
    // Normalize to a more intuitive scale (typical range: -60 to 0 dBFS → map to ~30-90 dB SPL)
    // Add ~74dB offset to convert dBFS to approximate dB SPL
    return avg + 74
  }

  function stop() {
    stream.getTracks().forEach(track => track.stop())
    audioContext.close()
  }

  return { getDb, stop }
}

export function interpolateLeakageDb(
  calibrationPoints: Array<{ volumeStep: number; leakageDb: number; ambientDb: number }>,
  volumeStep: number
): number {
  if (calibrationPoints.length === 0) return -Infinity

  const sorted = [...calibrationPoints].sort((a, b) => a.volumeStep - b.volumeStep)

  if (volumeStep <= sorted[0].volumeStep) return sorted[0].leakageDb
  if (volumeStep >= sorted[sorted.length - 1].volumeStep) return sorted[sorted.length - 1].leakageDb

  for (let i = 0; i < sorted.length - 1; i++) {
    if (volumeStep >= sorted[i].volumeStep && volumeStep <= sorted[i + 1].volumeStep) {
      const t = (volumeStep - sorted[i].volumeStep) / (sorted[i + 1].volumeStep - sorted[i].volumeStep)
      return sorted[i].leakageDb + t * (sorted[i + 1].leakageDb - sorted[i].leakageDb)
    }
  }

  return -Infinity
}

export function calculateSafeVolume(
  calibrationPoints: Array<{ volumeStep: number; leakageDb: number; ambientDb: number }>,
  ambientDb: number
): { safeVolumeStep: number; maxVolumeStep: number; status: 'safe' | 'warning' | 'danger' } {
  if (calibrationPoints.length === 0) {
    return { safeVolumeStep: 0, maxVolumeStep: 100, status: 'safe' }
  }

  const sorted = [...calibrationPoints].sort((a, b) => a.volumeStep - b.volumeStep)
  const maxVolumeStep = sorted[sorted.length - 1].volumeStep
  const threshold = ambientDb + 3 // sound becomes noticeable ~3dB above background

  let safeVolumeStep = 0
  for (const point of sorted) {
    if (point.leakageDb <= threshold) {
      safeVolumeStep = point.volumeStep
    }
  }

  const percentSafe = maxVolumeStep > 0 ? safeVolumeStep / maxVolumeStep : 0

  let status: 'safe' | 'warning' | 'danger'
  if (percentSafe >= 0.7) status = 'safe'
  else if (percentSafe >= 0.4) status = 'warning'
  else status = 'danger'

  return { safeVolumeStep, maxVolumeStep, status }
}
