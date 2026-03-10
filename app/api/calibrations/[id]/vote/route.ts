import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { value } = await req.json()
  if (value !== 1 && value !== -1) return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })

  await prisma.vote.upsert({
    where: { calibrationId_userId: { calibrationId: id, userId: session.user.id } },
    update: { value },
    create: { calibrationId: id, userId: session.user.id, value },
  })

  const votes = await prisma.vote.findMany({ where: { calibrationId: id } })
  return NextResponse.json({ score: votes.reduce((s, v) => s + v.value, 0) })
}
