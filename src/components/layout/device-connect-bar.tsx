"use client";

import { useDeviceStore } from "@/store";
import { deviceManager } from "@/lib/devices/device-manager";
import { Battery, RefreshCw, Power } from "lucide-react";
import { useEffect } from "react";

export function DeviceConnectBar() {
  const { deviceState, setDeviceState, setStreaming } = useDeviceStore();

  useEffect(() => {
    const unsub = deviceManager.onStateChange(setDeviceState);
    return unsub;
  }, [setDeviceState]);

  async function handleConnect() {
    deviceManager.useSimulator();
    await deviceManager.connect();
    await deviceManager.startStreaming();
    setStreaming(true);
  }

  async function handleDisconnect() {
    await deviceManager.stopStreaming();
    await deviceManager.disconnect();
    setStreaming(false);
  }

  const isConnected = deviceState.connectionState === "connected";
  const isConnecting =
    deviceState.connectionState === "connecting" ||
    deviceState.connectionState === "scanning";

  return (
    <header className="flex items-center justify-between h-11 md:h-12 px-6 md:px-8 border-b border-border-subtle bg-background text-xs font-mono select-none shrink-0">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
        <span className="text-xs text-muted tracking-wider uppercase font-medium">
          {isConnecting
            ? "Connecting..."
            : isConnected
            ? deviceState.isSimulated
              ? "Simulator"
              : deviceState.deviceId
            : "Standby"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && deviceState.battery && (
          <div className="flex items-center gap-1.5 text-muted text-xs">
            <Battery className="h-3.5 w-3.5" />
            <span className="font-numeric font-medium">{deviceState.battery.percent}%</span>
          </div>
        )}

        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-3 py-1 rounded border border-border hover:border-foreground/50 text-foreground transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Power className="h-3 w-3" />
            )}
            <span>Connect</span>
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded text-muted hover:text-foreground transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}
