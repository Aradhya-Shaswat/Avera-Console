# AEVRA Device Protocol & Hardware Integration

The AEVRA device abstraction decouples the user interface from low-level communication protocols.

## DeviceAdapter Interface

```typescript
export interface DeviceAdapter {
  readonly deviceId: string;
  readonly isSimulated: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getDeviceInfo(): Promise<DeviceInfo>;
  getBatteryStatus(): Promise<BatteryStatus>;
  startStreaming(): Promise<void>;
  stopStreaming(): Promise<void>;
  addEventListener(handler: DeviceEventHandler): () => void;
}
```

## Supported Adapters

### 1. SimulatorAdapter
Deterministic synthetic sensor generator simulating multiple physiological states:
- `resting`: Low resting heart rate (~54–62 bpm), high HRV (~55–75 ms), stable contact.
- `exercising`: Elevated heart rate (~130–165 bpm), elevated strain, dynamic motion signals.
- `motion_artifact`: High accelerometer variance, baseline wander, tagged ectopic intervals.
- `poor_contact`: Degraded optical SNR, low confidence metrics.
- `disconnected`: Sensor disengaged state.

### 2. WebBluetoothAdapter
Interfaces with physical BLE devices using the Web Bluetooth API (`navigator.bluetooth`).

### Custom AEVRA GATT Specification

When connected to physical hardware, AEVRA utilizes standard Bluetooth SIG profiles supplemented by a custom vendor service:

| Service | UUID | Description |
|---|---|---|
| Heart Rate Service | `0x180D` | Real-time heart rate and RR-intervals |
| Battery Service | `0x180F` | Battery charge percentage and charging state |
| Device Information | `0x180A` | Manufacturer, Model, Firmware version |
| AEVRA Custom Telemetry | `0000FE00-0000-1000-8000-00805F9B34FB` | High-frequency PPG, raw IMU, sync batches |

#### AEVRA Custom Characteristics
- `0xFE01` (Notify): High-frequency green/red/IR PPG sample packets.
- `0xFE02` (Notify): 3-axis accelerometer and gyroscope bursts.
- `0xFE03` (Write/Indicate): Offline flash memory batch synchronization command.
- `0xFE04` (Write): Firmware update chunk transport.

