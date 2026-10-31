# AEVRA Synchronization Protocol

Cloud synchronization is completely optional and must be explicitly enabled by the user in Settings.

## Privacy & Ownership Guarantees

1. **Explicit Opt-in:** The client does not initiate network calls to synchronization endpoints unless `NEXT_PUBLIC_CLOUD_SYNC_ENABLED=true` and the user toggles sync on.
2. **Raw Telemetry Exclusion:** High-frequency PPG waveforms and sub-second IMU arrays are strictly retained locally and are never transmitted to cloud endpoints during regular sync. Only derived sessions, summaries, and interval metrics are synchronized.
3. **User Ownership:** All cloud sync records are bound to authenticated user records and verified on the server before write operations.

## Endpoint Specification

### `GET /api/sync?since=<epoch_ms>`
Retrieves remote changes committed since the provided timestamp.

**Response (200 OK):**
```json
{
  "summaries": [...],
  "serverTime": 1730338800000
}
```

### `POST /api/sync`
Transfers a batch of local updates to the server.

**Request Envelope:**
```json
{
  "deviceId": "device-uuid",
  "since": 1730335200000,
  "entities": [
    {
      "type": "daily_summary",
      "data": { ... },
      "localVersion": 1
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "accepted": ["entity-id-1"],
  "conflicts": [],
  "rejected": [],
  "serverTime": 1730338800000
}
```

## Conflict Resolution

- **Version Vectors:** Each record carries an incrementing `localVersion`.
- **Deterministic Resolution:** If a concurrent edit is detected on the same date for the same device ID, the record with the higher algorithm version or latest timestamp prevails.
- **Idempotency:** Re-sending an accepted record with an identical version ID is a no-op that returns status `accepted`.

