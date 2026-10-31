"use client";

import { useDeviceStore } from "@/store";
import { deviceManager } from "@/lib/devices/device-manager";
import { MetricRow } from "@/components/metrics/metric-card";
import { formatRelativeTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { DeviceInfo } from "@/lib/contracts/device";

export default function DevicesPage() {
  const { deviceState, setDeviceState } = useDeviceStore();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const unsub = deviceManager.onStateChange(setDeviceState);
    return unsub;
  }, [setDeviceState]);

  useEffect(() => {
    if (deviceState.connectionState === "connected") {
      deviceManager.getAdapter()?.getDeviceInfo().then(setDeviceInfo).catch(() => {});
    }
  }, [deviceState.connectionState]);

  const isConnected = deviceState.connectionState === "connected";

  async function handleConnect() {
    deviceManager.useSimulator();
    await deviceManager.connect();
    await deviceManager.startStreaming();
  }

  async function handleDisconnect() {
    await deviceManager.stopStreaming();
    await deviceManager.disconnect();
    setDeviceInfo(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-foreground">
          Hardware & Adapters
        </h1>
      </div>

      <div className="flex-1 golden-ratio-grid overflow-hidden min-h-0">
        <div className="p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden h-full">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                Active Adapter
              </span>
              <span className="text-xs font-mono tracking-widest uppercase px-3 py-1 rounded border border-border-subtle text-foreground">
                {isConnected ? (deviceState.isSimulated ? "SIMULATOR" : "HARDWARE BLE") : "DISCONNECTED"}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-4">
              <span className="text-4xl md:text-5xl font-display font-normal tracking-tight text-foreground">
                {deviceInfo?.name ?? (isConnected ? "AVERA Synthetic Sensor" : "No Peripheral")}
              </span>
            </div>

            <p className="text-sm text-muted font-mono mb-6">
              STATUS: {deviceState.connectionState.toUpperCase()}
              {deviceState.lastSyncAt && ` · SYNC ${formatRelativeTime(deviceState.lastSyncAt).toUpperCase()}`}
            </p>
          </div>

          <div className="pt-6 border-t border-border-subtle flex items-center gap-4">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="text-xs font-mono uppercase tracking-wider px-5 py-2.5 rounded bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Connect Simulator
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="text-xs font-mono uppercase tracking-wider px-5 py-2.5 rounded border border-border hover:border-foreground transition-colors"
              >
                Disconnect Feed
              </button>
            )}
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-start overflow-hidden h-full">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted font-medium">
                Device Registry
              </span>
            </div>

            <div className="space-y-2">
              <MetricRow label="Peripheral Identifier" value={deviceInfo?.id ?? "—"} />
              <MetricRow label="Model" value={deviceInfo?.model ?? "AVERA-V1"} />
              <MetricRow label="Firmware" value={deviceInfo?.firmwareVersion ?? "0.1.0"} />
              <MetricRow label="Battery Charge" value={deviceState.battery ? `${deviceState.battery.percent}%` : "—"} />
              <MetricRow label="Transport Layer" value={deviceState.isSimulated ? "Simulator" : "Web Bluetooth GATT"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
