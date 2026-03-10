import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      include: { calibrationPoints: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(devices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const device = await prisma.device.create({
      data: { name: name.trim() },
      include: { calibrationPoints: true },
    })
    return NextResponse.json(device, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
  }
}
