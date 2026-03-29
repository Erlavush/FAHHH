export type AppRuntimeMode = "default" | "showcase";

const rawAppRuntimeMode = import.meta.env.VITE_APP_MODE;
const appRuntimeModeValue =
  typeof rawAppRuntimeMode === "string" ? rawAppRuntimeMode.trim().toLowerCase() : "";

export function getAppRuntimeMode(): AppRuntimeMode {
  return appRuntimeModeValue === "showcase" ? "showcase" : "default";
}

export function isShowcaseRuntimeMode(): boolean {
  return getAppRuntimeMode() === "showcase";
}
