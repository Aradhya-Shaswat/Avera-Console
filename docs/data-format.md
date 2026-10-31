# AEVRA Data Contracts & Schemas

All physiological data contracts are defined with strict TypeScript types and matching runtime Zod schemas in `src/lib/contracts/`.

## Common Base Record

All discrete records share a common provenance and temporal envelope:

```typescript
export interface BaseRecord {
  id: string; // UUID v4
  timestamp: number; // Epoch milliseconds (UTC)
  deviceId: string; // Device or simulator identifier
  source: "simulator" | "ble" | "manual" | "imported";
  algorithmVersion?: string;
  quality?: "excellent" | "good" | "fair" | "poor" | "invalid";
}
```

## Primary Telemetry Payloads

### Heart Rate (`HeartRateRecord`)
- `bpm`: Integer beats per minute (20–300).
- `confidence`: Optional float score (0.0–1.0).

### Pulse Intervals (`PulseIntervalRecord`)
- `intervalMs`: Measured inter-beat interval in milliseconds (200–3000 ms).
- `rrIntervalMs`: Ectopic-filtered interval in milliseconds.
- `artifactFlag`: Boolean indicating detected motion or premature contraction.

### PPG Samples (`PpgSample`)
- `green`: Photoplethysmogram green channel ADC count.
- `red`: Optional red channel ADC count (for SpO₂ estimation).
- `infrared`: Optional infrared channel ADC count.
- `sampleRateHz`: Sampling rate in Hz (nominal 25–100 Hz).

### Inertial Measurement (`ImuSample`)
- `accelX`, `accelY`, `accelZ`: Triaxial linear acceleration in g-units ($1g \approx 9.81\text{ m/s}^2$).
- `gyroX`, `gyroY`, `gyroZ`: Optional rotational velocity in degrees/second.
- `sampleRateHz`: Sampling frequency in Hz.

### Sleep Sessions (`SleepSession`)
- `startMs`, `endMs`: Session boundaries in epoch milliseconds.
- `durationMinutes`, `inBedMinutes`, `awakeMinutes`, `lightMinutes`, `deepMinutes`, `remMinutes`.
- `cycles`: Estimated non-REM/REM cycle count.
- `stages`: Array of 30-second epoch classifications (`"awake" | "light" | "deep" | "rem" | "unknown"`).
- `isEstimate`: Flag indicating algorithmic estimation.

### Activity Sessions (`ActivitySession`)
- `type`: Activity classification (`"rest" | "walk" | "run" | "cycling" | ...`).
- `durationMinutes`: Elapsed active duration.
- `strain`: Computed cardio strain on a 0.0–21.0 scale.
- `hrZones`: Time spent across Zones 1–5 based on personal max heart rate.

