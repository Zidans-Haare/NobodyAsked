'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createAudioAnalyzer, AudioAnalyzer } from '@/lib/audio'

export type MicStatus = 'idle' | 'requesting' | 'active' | 'error'

interface UseAudioAnalyzerOptions {
  updateInterval?: number
  enabled?: boolean
}

export function useAudioAnalyzer({ updateInterval = 500, enabled = true }: UseAudioAnalyzerOptions = {}) {
  const [db, setDb] = useState<number>(0)
  const [micStatus, setMicStatus] = useState<MicStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const analyzerRef = useRef<AudioAnalyzer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const start = useCallback(async () => {
    if (analyzerRef.current) return
    setMicStatus('requesting')
    setError(null)
    try {
      const analyzer = await createAudioAnalyzer()
      analyzerRef.current = analyzer
      setMicStatus('active')

      intervalRef.current = setInterval(() => {
        if (analyzerRef.current && enabledRef.current) {
          const reading = analyzerRef.current.getDb()
          setDb(Math.max(0, reading))
        }
      }, updateInterval)
    } catch (err: any) {
      setMicStatus('error')
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access to use NobodyAsked.')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.')
      } else {
        setError('Could not access microphone: ' + err.message)
      }
    }
  }, [updateInterval])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }
    setMicStatus('idle')
    setDb(0)
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { db, micStatus, error, start, stop }
}
