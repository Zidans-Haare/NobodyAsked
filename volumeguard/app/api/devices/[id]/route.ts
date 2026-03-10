import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const device = await prisma.device.findUnique({
      where: { id },
      include: { calibrationPoints: { orderBy: { volumeStep: 'asc' } } },
    })
    if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch device' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { name } = await req.json()
    const device = await prisma.device.update({
      where: { id },
      data: { name: name.trim() },
      include: { calibrationPoints: true },
    })
    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.device.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
}
