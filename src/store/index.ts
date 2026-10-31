import { create } from "zustand";
import type { DeviceState } from "@/lib/contracts/device";
import type { HeartRateRecord, PulseIntervalRecord, HrvMetrics } from "@/lib/contracts/measurement";
import type { SimulatorScenario } from "@/lib/simulator/scenarios";

interface DeviceStore {
  deviceState: DeviceState;
  scenario: SimulatorScenario;
  isStreaming: boolean;
  setDeviceState: (state: DeviceState) => void;
  setScenario: (scenario: SimulatorScenario) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  deviceState: {
    deviceId: "",
    connectionState: "disconnected",
    battery: null,
    lastSyncAt: null,
    isSimulated: true,
    errorMessage: null,
  },
  scenario: "resting",
  isStreaming: false,
  setDeviceState: (deviceState) => set({ deviceState }),
  setScenario: (scenario) => set({ scenario }),
  setStreaming: (isStreaming) => set({ isStreaming }),
}));

interface MetricsStore {
  recentHeartRate: HeartRateRecord[];
  recentPulseIntervals: PulseIntervalRecord[];
  recentHrv: HrvMetrics[];
  liveHr: number | null;
  addHeartRate: (record: HeartRateRecord) => void;
  addPulseInterval: (record: PulseIntervalRecord) => void;
  addHrv: (hrv: HrvMetrics) => void;
  setLiveHr: (bpm: number | null) => void;
  clear: () => void;
}

const MAX_LIVE_RECORDS = 300;

export const useMetricsStore = create<MetricsStore>((set) => ({
  recentHeartRate: [],
  recentPulseIntervals: [],
  recentHrv: [],
  liveHr: null,

  addHeartRate: (record) =>
    set((state) => ({
      recentHeartRate: [...state.recentHeartRate, record].slice(-MAX_LIVE_RECORDS),
      liveHr: record.bpm,
    })),

  addPulseInterval: (record) =>
    set((state) => ({
      recentPulseIntervals: [...state.recentPulseIntervals, record].slice(-MAX_LIVE_RECORDS),
    })),

  addHrv: (hrv) =>
    set((state) => ({
      recentHrv: [...state.recentHrv, hrv].slice(-50),
    })),

  setLiveHr: (liveHr) => set({ liveHr }),

  clear: () =>
    set({
      recentHeartRate: [],
      recentPulseIntervals: [],
      recentHrv: [],
      liveHr: null,
    }),
}));

interface UIStore {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  darkMode: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setDarkMode: (darkMode) => set({ darkMode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

