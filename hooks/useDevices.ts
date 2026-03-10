'use client'
import { useState, useEffect, useCallback } from 'react'

export interface CalibrationPoint {
  id: string
  deviceId: string
  volumeStep: number
  leakageDb: number
  ambientDb: number
}

export interface Device {
  id: string
  name: string
  createdAt: string
  calibrationPoints: CalibrationPoint[]
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setDevices(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const createDevice = useCallback(async (name: string): Promise<Device | null> => {
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const device = await res.json()
      setDevices(prev => [device, ...prev])
      return device
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [])

  const deleteDevice = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDevices(prev => prev.filter(d => d.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const addCalibrationPoint = useCallback(async (
    deviceId: string,
    volumeStep: number,
    leakageDb: number,
    ambientDb: number
  ) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/calibration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volumeStep, leakageDb, ambientDb }),
      })
      if (!res.ok) throw new Error('Failed to save calibration point')
      const point = await res.json()
      setDevices(prev => prev.map(d => {
        if (d.id !== deviceId) return d
        const existing = d.calibrationPoints.find(p => p.volumeStep === volumeStep)
        const points = existing
          ? d.calibrationPoints.map(p => p.volumeStep === volumeStep ? point : p)
          : [...d.calibrationPoints, point]
        return { ...d, calibrationPoints: points.sort((a, b) => a.volumeStep - b.volumeStep) }
      }))
      return point
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [])

  const clearCalibration = useCallback(async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/calibration`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear calibration')
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, calibrationPoints: [] } : d
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  return { devices, loading, error, fetchDevices, createDevice, deleteDevice, addCalibrationPoint, clearCalibration }
}
