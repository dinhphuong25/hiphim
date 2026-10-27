import { getSiteConfig, saveSiteConfig } from "./site-config";

export interface MaintenanceState {
  enabled: boolean;
  reason?: string;
  startedAt?: string;
  estimatedEndTime?: string;
  updatedAt?: string;
}

export const DEFAULT_MAINTENANCE_TOKEN = process.env.SYSTEM_MAINTENANCE_TOKEN || "hiphim_secret_2026";
export const BYPASS_COOKIE_NAME = "hiphim_maintenance_bypass";
export const MAINTENANCE_COOKIE_NAME = "hiphim_maintenance_active";

declare global {
  // eslint-disable-next-line no-var
  var __HIPHIM_MAINTENANCE__: MaintenanceState | undefined;
}

export function getMaintenanceState(): MaintenanceState {
  const isEnvEnabled = process.env.MAINTENANCE_MODE === "true" || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  let configMaintenance = false;
  let reason = "Hệ thống đang được nâng cấp định kỳ để cải thiện trải nghiệm xem phim.";
  let estimatedEndTime = "";

  try {
    const config = getSiteConfig();
    configMaintenance = Boolean(config?.maintenance?.enabled);
    if (config?.maintenance?.reason) {
      reason = config.maintenance.reason;
    }
    if (config?.maintenance?.estimatedEndTime) {
      estimatedEndTime = config.maintenance.estimatedEndTime;
    }
  } catch (err) {
    console.warn("Could not read site config in getMaintenanceState:", err);
  }

  const isEnabled = isEnvEnabled || configMaintenance || Boolean(globalThis.__HIPHIM_MAINTENANCE__?.enabled);

  return {
    enabled: isEnabled,
    reason,
    estimatedEndTime,
    updatedAt: globalThis.__HIPHIM_MAINTENANCE__?.updatedAt,
  };
}

export function setMaintenanceState(newState: Partial<MaintenanceState>): MaintenanceState {
  const current = getMaintenanceState();
  const isEnabled = newState.enabled !== undefined ? Boolean(newState.enabled) : current.enabled;
  const reason = newState.reason || current.reason || "Hệ thống đang được nâng cấp định kỳ để cải thiện trải nghiệm xem phim.";
  const estimatedEndTime = newState.estimatedEndTime || current.estimatedEndTime || "";

  // 1. Persist to disk via saveSiteConfig
  try {
    saveSiteConfig({
      maintenance: {
        enabled: isEnabled,
        reason,
        estimatedEndTime,
      },
    });
  } catch (err) {
    console.error("Could not persist maintenance config:", err);
  }

  const updated: MaintenanceState = {
    ...current,
    ...newState,
    enabled: isEnabled,
    reason,
    estimatedEndTime,
    updatedAt: new Date().toISOString(),
  };

  globalThis.__HIPHIM_MAINTENANCE__ = updated;
  return updated;
}

export function verifyMaintenanceToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token === DEFAULT_MAINTENANCE_TOKEN;
}
