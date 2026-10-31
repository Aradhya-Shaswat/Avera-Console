import type { DeviceInfo, BatteryStatus, ConnectionState } from "@/lib/contracts/device";
import type {
  HeartRateRecord,
  PulseIntervalRecord,
  PpgSample,
  ImuSample,
  SpO2Record,
  TemperatureRecord,
  RespiratoryRateRecord,
} from "@/lib/contracts/measurement";

export type DeviceEvent =
  | { type: "heart_rate"; data: HeartRateRecord }
  | { type: "pulse_interval"; data: PulseIntervalRecord }
  | { type: "ppg_sample"; data: PpgSample }
  | { type: "imu_sample"; data: ImuSample }
  | { type: "spo2"; data: SpO2Record }
  | { type: "temperature"; data: TemperatureRecord }
  | { type: "respiratory_rate"; data: RespiratoryRateRecord }
  | { type: "battery"; data: BatteryStatus }
  | { type: "connection_state"; data: ConnectionState }
  | { type: "error"; data: { message: string; code?: string } };

export type DeviceEventHandler = (event: DeviceEvent) => void;

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

export interface BluetoothGATTCharacteristic {
  readValue(): Promise<DataView>;
  startNotifications(): Promise<BluetoothGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothGATTCharacteristic>;
  addEventListener(type: string, listener: (this: this, ev: Event) => void): void;
  removeEventListener(type: string, listener: (this: this, ev: Event) => void): void;
}

export interface BluetoothGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothGATTCharacteristic>;
}

export interface BluetoothRemoteGATTServer {
  readonly connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothGATTService>;
}

export interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: (this: this, ev: Event) => void): void;
}

