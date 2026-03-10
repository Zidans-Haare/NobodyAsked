import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const { points, note } = await req.json()

  if (!points || !Array.isArray(points) || points.length < 2) {
    return NextResponse.json({ error: 'At least 2 calibration points required' }, { status: 400 })
  }

  const calibration = await prisma.calibration.create({
    data: {
      deviceId: id,
      userId: session?.user?.id ?? null,
      note: note?.trim() || null,
      points: {
        create: points.map((p: { volumeStep: number; leakageDb: number; ambientDb: number }) => ({
          volumeStep: p.volumeStep,
          leakageDb: p.leakageDb,
          ambientDb: p.ambientDb,
        })),
      },
    },
    include: {
      points: { orderBy: { volumeStep: 'asc' } },
      votes: true,
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(calibration, { status: 201 })
}
