# VolumeGuard

> *Nobody asked to hear your music — but when you listen too loud, you force it on them anyway.*

A headphone leakage calibration and real-time monitoring PWA. Calibrate your headphones once — then VolumeGuard tells you the maximum volume you can listen at without others hearing your music.

## How it works

1. **Add a device** — create a profile for your headphones (e.g. "AirPods Pro", "Sony WH-1000XM5")
2. **Calibrate** — measure how much sound leaks out at each volume step, either with a helper or solo
3. **Monitor** — the app continuously reads ambient noise via the microphone and displays the highest volume that stays below the leakage threshold

The leakage threshold is defined as **ambient dB + 3 dB** — the point at which sound becomes noticeable above background noise.

## Features

- **Real-time dB meter** — rolling average over 10 frames, updated every 500 ms
- **Traffic light indicator** — green / yellow / red based on how close you are to the threshold
- **Live graph** — last 30 seconds of ambient noise
- **Manual calibration** — step-by-step wizard with a helper who confirms audibility at each volume step
- **Auto calibration** — solo mode: place the phone near the ear cup, app records dB at each step automatically
- **Device profiles** — stored in SQLite via Prisma, multiple devices supported
- **PWA** — installable on iPhone via "Add to Home Screen", works offline for core features

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) · TypeScript · Tailwind CSS v4
- [Prisma](https://prisma.io) + SQLite
- Web Audio API (`AudioContext` + `AnalyserNode`)
- Service Worker for offline support and PWA installability

## Getting started

```bash
# Install dependencies
npm install

# Set up the database
npx prisma db push

# Seed demo devices (AirPods Pro, Sony WH-1000XM5, Bose QC45)
npx prisma db seed

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Microphone access is required. On iOS Safari, the AudioContext is resumed after the first user gesture — tap "Start Monitoring" to activate it.

## Project structure

```
app/
  page.tsx                  # Monitor screen (home)
  calibrate/                # Calibration flows
    page.tsx                # Mode selector
    ManualCalibration.tsx   # Helper-assisted wizard
    AutoCalibration.tsx     # Solo auto mode
  devices/page.tsx          # Device CRUD
  api/devices/              # REST API routes
components/
  BottomNav.tsx             # Monitor / Calibrate / Devices tabs
  DbMeter.tsx               # Animated level bar
  DbGraph.tsx               # 30-second canvas graph
  TrafficLight.tsx          # Green / yellow / red indicator
hooks/
  useAudioAnalyzer.ts       # Web Audio API + rolling average
  useDevices.ts             # Device and calibration state
lib/
  audio.ts                  # dB math, leakage interpolation, safe volume calc
  prisma.ts                 # Prisma singleton
prisma/
  schema.prisma             # Device + CalibrationPoint models
  seed.ts                   # Demo headphone profiles
public/
  manifest.json             # PWA manifest
  sw.js                     # Service worker
```

## Data model

```prisma
Device {
  id        String
  name      String @unique
  calibrationPoints CalibrationPoint[]
}

CalibrationPoint {
  deviceId    String
  volumeStep  Int     // 0–100
  leakageDb   Float   // measured external dB at this volume
  ambientDb   Float   // ambient baseline during calibration
}
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npx prisma db push` | Apply schema to database |
| `npx prisma db seed` | Seed demo headphone profiles |
| `npx prisma studio` | Open Prisma database GUI |
