import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sharedRoomDevPlugin } from "./scripts/sharedRoomDevPlugin.mjs";
import { inAppEditorPlugin } from "./scripts/inAppEditorPlugin.mjs";

function matchesPath(id, segment) {
  const windowsSegment = segment.split("/").join("\\");
  return id.includes(segment) || id.includes(windowsSegment);
}

export default defineConfig({
  plugins: [react(), sharedRoomDevPlugin(), inAppEditorPlugin()],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    watch: {
      ignored: ["**/.data/**"]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            matchesPath(id, "/src/components/mob-lab/") ||
            matchesPath(id, "/src/lib/mobLab") ||
            matchesPath(id, "/src/lib/mobLabState") ||
            matchesPath(id, "/src/lib/mobTextureLayout") ||
            matchesPath(id, "/src/lib/cemTransforms")
          ) {
            return "mob-lab";
          }

          if (!matchesPath(id, "/node_modules/")) {
            return undefined;
          }

          if (matchesPath(id, "/node_modules/react/") || matchesPath(id, "/node_modules/react-dom/")) {
            return "react-vendor";
          }

          if (
            matchesPath(id, "/node_modules/@react-three/postprocessing/") ||
            matchesPath(id, "/node_modules/postprocessing/")
          ) {
            return "postprocessing-vendor";
          }

          if (matchesPath(id, "/node_modules/@react-three/fiber/") || matchesPath(id, "/node_modules/@react-three/drei/")) {
            return "react-three-vendor";
          }

          if (matchesPath(id, "/node_modules/three/")) {
            return "three-vendor";
          }

          if (matchesPath(id, "/node_modules/leva/")) {
            return "leva-vendor";
          }

          return "vendor";
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true
  }
});
