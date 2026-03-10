import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const device = await prisma.deviceModel.findUnique({
    where: { id },
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
  })
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(device)
}
