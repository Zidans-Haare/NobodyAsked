'use client'
import { useEffect, useRef } from 'react'

interface DbGraphProps {
  db: number
  windowSeconds?: number
}

export function DbGraph({ db, windowSeconds = 30 }: DbGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<number[]>([])
  const maxPoints = windowSeconds * 2 // 2 updates per second

  useEffect(() => {
    historyRef.current.push(db)
    if (historyRef.current.length > maxPoints) {
      historyRef.current.shift()
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const data = historyRef.current
    if (data.length < 2) return

    const minDb = 30
    const maxDb = 90

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let dbVal = 40; dbVal <= 80; dbVal += 10) {
      const y = height - ((dbVal - minDb) / (maxDb - minDb)) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '10px monospace'
      ctx.fillText(`${dbVal}dB`, 4, y - 3)
    }

    // Line
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)')
    gradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.9)')
    gradient.addColorStop(1, 'rgba(52, 211, 153, 0.9)')

    ctx.beginPath()
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'

    data.forEach((val, i) => {
      const x = (i / (maxPoints - 1)) * width
      const y = height - ((Math.max(minDb, Math.min(maxDb, val)) - minDb) / (maxDb - minDb)) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Fill under line
    ctx.lineTo((data.length - 1) / (maxPoints - 1) * width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = 'rgba(52, 211, 153, 0.05)'
    ctx.fill()
  }, [db, maxPoints])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={120}
      className="w-full h-32 rounded-xl"
    />
  )
}
