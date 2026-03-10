'use client'
import { useState, useEffect, useCallback } from 'react'

export interface CalibrationPoint {
  id: string
  calibrationId: string
  volumeStep: number
  leakageDb: number
  ambientDb: number
}

export interface Vote {
  id: string
  calibrationId: string
  userId: string
  value: number
}

export interface Calibration {
  id: string
  deviceId: string
  userId: string | null
  note: string | null
  verified: boolean
  createdAt: string
  points: CalibrationPoint[]
  votes: Vote[]
  user: { id: string; name: string | null } | null
}

export interface DeviceModel {
  id: string
  brand: string
  name: string
  type: string
  createdAt: string
  calibrations: Calibration[]
}

export function getBestCalibration(device: DeviceModel): Calibration | null {
  if (!device.calibrations.length) return null
  return device.calibrations.reduce((best, cal) => {
    const scoreA = cal.votes.reduce((s, v) => s + v.value, 0) + (cal.verified ? 10 : 0)
    const scoreB = best.votes.reduce((s, v) => s + v.value, 0) + (best.verified ? 10 : 0)
    return scoreA > scoreB ? cal : best
  })
}

export function useDevices(query = '') {
  const [devices, setDevices] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/devices${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      const data = await res.json()
      setDevices(data)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { fetchDevices() }, [fetchDevices])

  const createDevice = useCallback(async (brand: string, name: string, type: string): Promise<DeviceModel | null> => {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, name, type }),
    })
    if (!res.ok) return null
    const device = await res.json()
    setDevices(prev => {
      const exists = prev.find(d => d.id === device.id)
      return exists ? prev.map(d => d.id === device.id ? device : d) : [device, ...prev]
    })
    return device
  }, [])

  const submitCalibration = useCallback(async (
    deviceId: string,
    points: Array<{ volumeStep: number; leakageDb: number; ambientDb: number }>,
    note?: string
  ): Promise<Calibration | null> => {
    const res = await fetch(`/api/devices/${deviceId}/calibration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, note }),
    })
    if (!res.ok) return null
    const calibration = await res.json()
    setDevices(prev => prev.map(d => {
      if (d.id !== deviceId) return d
      return { ...d, calibrations: [calibration, ...d.calibrations] }
    }))
    return calibration
  }, [])

  const vote = useCallback(async (calibrationId: string, value: 1 | -1) => {
    const res = await fetch(`/api/calibrations/${calibrationId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    return res.ok
  }, [])

  return { devices, loading, fetchDevices, createDevice, submitCalibration, vote }
}
