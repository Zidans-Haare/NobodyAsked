import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const devices = [
  {
    name: 'AirPods Pro (2nd Gen)',
    points: [
      { volumeStep: 0,   leakageDb: 28, ambientDb: 35 },
      { volumeStep: 10,  leakageDb: 31, ambientDb: 35 },
      { volumeStep: 20,  leakageDb: 35, ambientDb: 35 },
      { volumeStep: 30,  leakageDb: 39, ambientDb: 35 },
      { volumeStep: 40,  leakageDb: 43, ambientDb: 35 },
      { volumeStep: 50,  leakageDb: 47, ambientDb: 35 },
      { volumeStep: 60,  leakageDb: 51, ambientDb: 35 },
      { volumeStep: 70,  leakageDb: 55, ambientDb: 35 },
      { volumeStep: 80,  leakageDb: 59, ambientDb: 35 },
      { volumeStep: 90,  leakageDb: 63, ambientDb: 35 },
      { volumeStep: 100, leakageDb: 67, ambientDb: 35 },
    ],
  },
  {
    name: 'Sony WH-1000XM5',
    points: [
      { volumeStep: 0,   leakageDb: 26, ambientDb: 35 },
      { volumeStep: 10,  leakageDb: 28, ambientDb: 35 },
      { volumeStep: 20,  leakageDb: 31, ambientDb: 35 },
      { volumeStep: 30,  leakageDb: 34, ambientDb: 35 },
      { volumeStep: 40,  leakageDb: 38, ambientDb: 35 },
      { volumeStep: 50,  leakageDb: 42, ambientDb: 35 },
      { volumeStep: 60,  leakageDb: 46, ambientDb: 35 },
      { volumeStep: 70,  leakageDb: 50, ambientDb: 35 },
      { volumeStep: 80,  leakageDb: 54, ambientDb: 35 },
      { volumeStep: 90,  leakageDb: 58, ambientDb: 35 },
      { volumeStep: 100, leakageDb: 62, ambientDb: 35 },
    ],
  },
  {
    name: 'Bose QC45',
    points: [
      { volumeStep: 0,   leakageDb: 27, ambientDb: 35 },
      { volumeStep: 10,  leakageDb: 30, ambientDb: 35 },
      { volumeStep: 20,  leakageDb: 33, ambientDb: 35 },
      { volumeStep: 30,  leakageDb: 37, ambientDb: 35 },
      { volumeStep: 40,  leakageDb: 41, ambientDb: 35 },
      { volumeStep: 50,  leakageDb: 45, ambientDb: 35 },
      { volumeStep: 60,  leakageDb: 49, ambientDb: 35 },
      { volumeStep: 70,  leakageDb: 53, ambientDb: 35 },
      { volumeStep: 80,  leakageDb: 57, ambientDb: 35 },
      { volumeStep: 90,  leakageDb: 61, ambientDb: 35 },
      { volumeStep: 100, leakageDb: 65, ambientDb: 35 },
    ],
  },
]

async function main() {
  console.log('Seeding demo devices...')

  for (const device of devices) {
    const created = await prisma.device.upsert({
      where: { name: device.name } as any,
      update: {},
      create: {
        name: device.name,
        calibrationPoints: {
          create: device.points,
        },
      },
    })
    console.log(`  ✓ ${created.name}`)
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
