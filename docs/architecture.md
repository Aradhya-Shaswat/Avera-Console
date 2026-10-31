# AEVRA Architecture

AEVRA is an open-source, subscription-free physiological monitoring platform built with a local-first design philosophy. Users maintain full ownership of their physiological data, with optional, explicitly controlled cloud synchronization.

```
┌─────────────────────────────────────────────────────────────┐
│                      AEVRA Studio UI                        │
│   (Next.js App Router, React 19, Tailwind CSS 4, Zustand)   │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               ▼                               │
┌─────────────────────────────┐ ┌──────────────┴──────────────┐
│       Device Layer          │ │      Analytics Engine       │
│  (DeviceManager / Adapters) │ │ (Pure, deterministic, v1.0) │
└──────────────┬──────────────┘ └──────────────▲──────────────┘
               │                               │
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                 Client Database (Dexie.js)                   │
│             IndexedDB, Local-First, Offline-Ready           │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Optional opt-in sync)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Synchronization API                     │
│                  POST /api/sync (Next.js)                   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Cloud Database (Neon PostgreSQL)             │
│               Drizzle ORM, Server-Only Connection           │
└─────────────────────────────────────────────────────────────┘
```

## Architectural Principles

1. **Local-First & Offline-by-Default:** All incoming sensor telemetry and derived metrics persist directly into browser IndexedDB via Dexie.js. No network connection or account creation is required for complete functionality.
2. **Strict Server-Client Boundary:** Database credentials (`DATABASE_URL`, `NEON_AUTH_SECRET`) are strictly confined to server-only modules (`src/lib/db/server/`). No server database package or credential can be bundled into client assets.
3. **Deterministic & Versioned Analytics:** All physiological algorithms (HRV RMSSD, Sleep Staging, Day Strain, Recovery Index) are implemented as pure, deterministic TypeScript functions versioned under semantic versioning (`v1.0.0`).
4. **Hardware Abstraction Layer:** The application communicates with wearables exclusively via the `DeviceAdapter` contract. A realistic `SimulatorAdapter` generates synthetic data across multiple operational scenarios, while the `WebBluetoothAdapter` interfaces with physical BLE hardware.
5. **Data Provenance:** Every record tracks its `source` (`"simulator" | "ble" | "manual" | "imported"`). Simulated records are never misrepresented as physical hardware readings.

