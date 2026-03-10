import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { volumeStep, leakageDb, ambientDb } = await req.json()

    const point = await prisma.calibrationPoint.upsert({
      where: { deviceId_volumeStep: { deviceId: id, volumeStep } },
      create: { deviceId: id, volumeStep, leakageDb, ambientDb },
      update: { leakageDb, ambientDb },
    })

    return NextResponse.json(point, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save calibration point' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.calibrationPoint.deleteMany({ where: { deviceId: id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear calibration' }, { status: 500 })
  }
}
