import type { DeviceAdapter, DeviceEvent, DeviceEventHandler, BluetoothDevice } from "./types";
import type { DeviceInfo, BatteryStatus } from "@/lib/contracts/device";

interface NavigatorWithBluetooth {
  bluetooth?: {
    requestDevice(options: {
      filters: { namePrefix: string }[];
      optionalServices: string[];
    }): Promise<BluetoothDevice>;
  };
}

export class WebBluetoothAdapter implements DeviceAdapter {
  readonly deviceId: string;
  readonly isSimulated = false;

  private handlers: Set<DeviceEventHandler> = new Set();
  private bluetoothDevice: BluetoothDevice | null = null;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  async connect(): Promise<void> {
    const nav = typeof navigator !== "undefined" ? (navigator as unknown as NavigatorWithBluetooth) : null;
    if (!nav?.bluetooth) {
      throw new Error("Web Bluetooth API is not supported in this browser.");
    }

    this.emit({ type: "connection_state", data: "scanning" });

    try {
      this.bluetoothDevice = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: "AEVRA" }],
        optionalServices: [
          "heart_rate",
          "battery_service",
          "device_information",
          "0000fe00-0000-1000-8000-00805f9b34fb",
        ],
      });

      this.emit({ type: "connection_state", data: "connecting" });

      if (!this.bluetoothDevice.gatt) {
        throw new Error("GATT not available on device");
      }

      await this.bluetoothDevice.gatt.connect();
      this.emit({ type: "connection_state", data: "connected" });

      this.bluetoothDevice.addEventListener("gattserverdisconnected", () => {
        this.emit({ type: "connection_state", data: "disconnected" });
      });
    } catch (error) {
      this.emit({
        type: "error",
        data: {
          message: error instanceof Error ? error.message : "Connection failed",
        },
      });
      this.emit({ type: "connection_state", data: "error" });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.stopStreaming();
    if (this.bluetoothDevice?.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    this.emit({ type: "connection_state", data: "disconnected" });
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.bluetoothDevice?.gatt?.connected) {
      throw new Error("Device not connected");
    }
    return {
      id: this.deviceId,
      name: this.bluetoothDevice.name ?? "AEVRA Device",
      manufacturer: "AEVRA",
    };
  }

  async getBatteryStatus(): Promise<BatteryStatus> {
    if (!this.bluetoothDevice?.gatt?.connected) {
      throw new Error("Device not connected");
    }
    const server = await this.bluetoothDevice.gatt.connect();
    const service = await server.getPrimaryService("battery_service");
    const characteristic = await service.getCharacteristic("battery_level");
    const value = await characteristic.readValue();
    return {
      percent: value.getUint8(0),
      isCharging: false,
      measuredAt: Date.now(),
    };
  }

  async startStreaming(): Promise<void> {
    throw new Error("BLE streaming not yet implemented — hardware in development");
  }

  async stopStreaming(): Promise<void> {
    // Awaits implementation when GATT streaming characteristics are finalized
  }

  addEventListener(handler: DeviceEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(event: DeviceEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
