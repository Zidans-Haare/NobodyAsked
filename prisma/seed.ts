import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  // Demo admin user
  const password = await bcrypt.hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@nobodyasked.app' },
    update: {},
    create: { name: 'Demo User', email: 'demo@nobodyasked.app', password },
  })
  console.log(`  ✓ User: ${user.email}`)

  const devices = [
    {
      brand: 'Apple',
      name: 'AirPods Pro (2nd Gen)',
      type: 'in-ear',
      points: [
        { volumeStep: 0, leakageDb: 28, ambientDb: 35 },
        { volumeStep: 10, leakageDb: 31, ambientDb: 35 },
        { volumeStep: 20, leakageDb: 35, ambientDb: 35 },
        { volumeStep: 30, leakageDb: 39, ambientDb: 35 },
        { volumeStep: 40, leakageDb: 43, ambientDb: 35 },
        { volumeStep: 50, leakageDb: 47, ambientDb: 35 },
        { volumeStep: 60, leakageDb: 51, ambientDb: 35 },
        { volumeStep: 70, leakageDb: 55, ambientDb: 35 },
        { volumeStep: 80, leakageDb: 59, ambientDb: 35 },
        { volumeStep: 90, leakageDb: 63, ambientDb: 35 },
        { volumeStep: 100, leakageDb: 67, ambientDb: 35 },
      ],
    },
    {
      brand: 'Sony',
      name: 'WH-1000XM5',
      type: 'over-ear',
      points: [
        { volumeStep: 0, leakageDb: 26, ambientDb: 35 },
        { volumeStep: 10, leakageDb: 28, ambientDb: 35 },
        { volumeStep: 20, leakageDb: 31, ambientDb: 35 },
        { volumeStep: 30, leakageDb: 34, ambientDb: 35 },
        { volumeStep: 40, leakageDb: 38, ambientDb: 35 },
        { volumeStep: 50, leakageDb: 42, ambientDb: 35 },
        { volumeStep: 60, leakageDb: 46, ambientDb: 35 },
        { volumeStep: 70, leakageDb: 50, ambientDb: 35 },
        { volumeStep: 80, leakageDb: 54, ambientDb: 35 },
        { volumeStep: 90, leakageDb: 58, ambientDb: 35 },
        { volumeStep: 100, leakageDb: 62, ambientDb: 35 },
      ],
    },
    {
      brand: 'Bose',
      name: 'QuietComfort 45',
      type: 'over-ear',
      points: [
        { volumeStep: 0, leakageDb: 27, ambientDb: 35 },
        { volumeStep: 10, leakageDb: 30, ambientDb: 35 },
        { volumeStep: 20, leakageDb: 33, ambientDb: 35 },
        { volumeStep: 30, leakageDb: 37, ambientDb: 35 },
        { volumeStep: 40, leakageDb: 41, ambientDb: 35 },
        { volumeStep: 50, leakageDb: 45, ambientDb: 35 },
        { volumeStep: 60, leakageDb: 49, ambientDb: 35 },
        { volumeStep: 70, leakageDb: 53, ambientDb: 35 },
        { volumeStep: 80, leakageDb: 57, ambientDb: 35 },
        { volumeStep: 90, leakageDb: 61, ambientDb: 35 },
        { volumeStep: 100, leakageDb: 65, ambientDb: 35 },
      ],
    },
  ]

  for (const d of devices) {
    const device = await prisma.deviceModel.upsert({
      where: { brand_name: { brand: d.brand, name: d.name } },
      update: {},
      create: {
        brand: d.brand,
        name: d.name,
        type: d.type,
        calibrations: {
          create: {
            userId: user.id,
            verified: true,
            note: 'Seeded demo calibration',
            points: { create: d.points },
          },
        },
      },
    })
    console.log(`  ✓ ${device.brand} ${device.name}`)
  }

  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
