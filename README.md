# AVERA Console

**Understand your body. Own your data.**

Open-source, subscription-free physiological monitoring wearable console.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** — CSS-first design tokens via `@theme`
- **Typography** — Libre Caslon Display for editorial scientific headings, Geist for body & tabular figures
- **shadcn/ui** with Radix primitives
- **Motion** for animations
- **Zustand** — client state
- **Zod** — runtime validation and shared contracts
- **Dexie.js / IndexedDB** — local-first offline storage
- **Drizzle ORM + Neon PostgreSQL** — optional cloud sync
- **Recharts** — dashboard charts
- **uPlot** — high-frequency waveform rendering
- **Vitest** + **Playwright** — unit and E2E tests
- **Bun** — package manager

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/avera-console
cd avera-console
bun install
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure variables (see below). Cloud sync is entirely optional — the app runs fully offline without any credentials.

### 3. Run development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Optional | Neon PostgreSQL connection string for cloud sync |
| `NEON_AUTH_SECRET` | Optional | Neon Auth secret for user authentication |
| `NEXT_PUBLIC_CLOUD_SYNC_ENABLED` | Optional | Set `true` to enable cloud sync UI |

The application is **fully functional without any environment variables**. All physiological data is stored locally in IndexedDB by default.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full architectural overview.

### Key boundaries

| Layer | Technology | Notes |
|---|---|---|
| Local storage | Dexie.js + IndexedDB | Primary, always-on |
| Cloud storage | Drizzle + Neon PostgreSQL | Optional, user-controlled |
| Device abstraction | `DeviceAdapter` interface | Simulator + BLE + future adapters |
| Analytics | Pure TypeScript functions | Deterministic, versioned, unit-tested |
| Sync | `/api/sync` endpoint | Incremental, idempotent, conflict-aware |

### Data flow

```
Hardware / Simulator
       ↓
DeviceAdapter (adapter.ts)
       ↓
DeviceManager (device-manager.ts)
       ↓
Zustand stores
       ↓
Dexie.js (local)   →   /api/sync (optional cloud)
       ↓
Analytics modules
       ↓
Dashboard components
```

## Simulated Data

The application ships with a deterministic sensor simulator. Simulated data is **always clearly labelled** throughout the UI with a `SIM` badge. The simulator supports multiple scenarios: resting, exercising, motion artifacts, poor contact, and disconnected sensor.

## Running Tests

```bash
bun test           # Unit tests (Vitest)
bun test:e2e       # E2E tests (Playwright)
bun type-check     # TypeScript check
bun lint           # ESLint
```

## Database Migrations

```bash
bun db:generate    # Generate Drizzle migrations
bun db:migrate     # Apply migrations to Neon
bun db:studio      # Open Drizzle Studio
```

## Data Ownership

- All physiological data is stored locally in your browser (IndexedDB).
- Cloud synchronization is **opt-in** and requires explicit user action.
- Raw sensor recordings are **never** automatically uploaded.
- Full CSV and JSON export is available from the Settings page.

## License

MIT

