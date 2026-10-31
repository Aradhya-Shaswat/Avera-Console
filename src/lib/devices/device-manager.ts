import type { DeviceAdapter, DeviceEventHandler } from "./adapter";
import type { DeviceState } from "@/lib/contracts/device";
import { SimulatorAdapter } from "./simulator-adapter";

type StateChangeHandler = (state: DeviceState) => void;

class DeviceManager {
  private adapter: DeviceAdapter | null = null;
  private stateHandlers: Set<StateChangeHandler> = new Set();
  private adapterUnsubscribe: (() => void) | null = null;

  private state: DeviceState = {
    deviceId: "",
    connectionState: "disconnected",
    battery: null,
    lastSyncAt: null,
    isSimulated: false,
    errorMessage: null,
  };

  useSimulator(): void {
    const sim = new SimulatorAdapter();
    this.setAdapter(sim);
  }

  setAdapter(adapter: DeviceAdapter): void {
    if (this.adapter) {
      this.adapter.disconnect().catch(() => {});
    }
    if (this.adapterUnsubscribe) {
      this.adapterUnsubscribe();
    }

    this.adapter = adapter;
    this.updateState({
      deviceId: adapter.deviceId,
      isSimulated: adapter.isSimulated,
      connectionState: "disconnected",
      battery: null,
      errorMessage: null,
    });

    this.adapterUnsubscribe = adapter.addEventListener((event) => {
      if (event.type === "connection_state") {
        this.updateState({ connectionState: event.data });
      } else if (event.type === "battery") {
        this.updateState({ battery: event.data });
      } else if (event.type === "error") {
        this.updateState({ errorMessage: event.data.message });
      }
    });
  }

  async connect(): Promise<void> {
    if (!this.adapter) throw new Error("No adapter configured");
    this.updateState({ connectionState: "connecting", errorMessage: null });
    await this.adapter.connect();
  }

  async disconnect(): Promise<void> {
    if (!this.adapter) return;
    await this.adapter.disconnect();
  }

  async startStreaming(): Promise<void> {
    if (!this.adapter) throw new Error("No adapter configured");
    await this.adapter.startStreaming();
  }

  async stopStreaming(): Promise<void> {
    if (!this.adapter) return;
    await this.adapter.stopStreaming();
  }

  getAdapter(): DeviceAdapter | null {
    return this.adapter;
  }

  getState(): DeviceState {
    return this.state;
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  addDeviceEventListener(handler: DeviceEventHandler): (() => void) | null {
    return this.adapter?.addEventListener(handler) ?? null;
  }

  private updateState(partial: Partial<DeviceState>): void {
    this.state = { ...this.state, ...partial };
    this.state.lastSyncAt = partial.connectionState === "connected"
      ? this.state.lastSyncAt
      : this.state.lastSyncAt;
    for (const handler of this.stateHandlers) {
      handler(this.state);
    }
  }
}

export const deviceManager = new DeviceManager();

