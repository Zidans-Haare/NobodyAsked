import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  const devices = await prisma.deviceModel.findMany({
    where: q ? {
      OR: [
        { brand: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    } : undefined,
    include: {
      calibrations: {
        include: {
          points: { orderBy: { volumeStep: 'asc' } },
          votes: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { brand: 'asc' },
    take: 50,
  })

  return NextResponse.json(devices)
}

export async function POST(req: NextRequest) {
  const { brand, name, type } = await req.json()
  if (!brand?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Brand and name are required' }, { status: 400 })
  }
  const device = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: brand.trim(), name: name.trim() } },
    update: {},
    create: { brand: brand.trim(), name: name.trim(), type: type || 'over-ear' },
    include: { calibrations: { include: { points: true, votes: true, user: { select: { id: true, name: true } } } } },
  })
  return NextResponse.json(device, { status: 201 })
}
