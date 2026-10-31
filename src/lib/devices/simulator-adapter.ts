import type { DeviceAdapter, DeviceEvent, DeviceEventHandler } from "./adapter";
import type { DeviceInfo, BatteryStatus } from "@/lib/contracts/device";
import { generateSimulatedSession, type SimulatorScenario } from "@/lib/simulator/scenarios";

export class SimulatorAdapter implements DeviceAdapter {
  readonly deviceId = "sim-aevra-001";
  readonly isSimulated = true;

  private handlers: Set<DeviceEventHandler> = new Set();
  private streamInterval: ReturnType<typeof setInterval> | null = null;
  private scenario: SimulatorScenario = "resting";
  private connected = false;

  setScenario(scenario: SimulatorScenario): void {
    this.scenario = scenario;
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.emit({ type: "connection_state", data: "connected" });
    this.emit({
      type: "battery",
      data: {
        percent: 78,
        isCharging: false,
        estimatedMinutesRemaining: 1440,
        measuredAt: Date.now(),
      },
    });
  }

  async disconnect(): Promise<void> {
    this.stopStreaming();
    this.connected = false;
    this.emit({ type: "connection_state", data: "disconnected" });
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      id: this.deviceId,
      name: "AEVRA Sim",
      model: "AEVRA-SIM-1",
      firmwareVersion: "0.1.0-sim",
      hardwareVersion: "N/A",
      manufacturer: "AEVRA (Simulated)",
    };
  }

  async getBatteryStatus(): Promise<BatteryStatus> {
    return {
      percent: 78,
      isCharging: false,
      estimatedMinutesRemaining: 1440,
      measuredAt: Date.now(),
    };
  }

  async startStreaming(): Promise<void> {
    if (!this.connected) throw new Error("Not connected");
    if (this.streamInterval) return;

    this.streamInterval = setInterval(() => {
      const events = generateSimulatedSession(this.scenario, this.deviceId);
      for (const event of events) {
        this.emit(event);
      }
    }, 1000);
  }

  async stopStreaming(): Promise<void> {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
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

