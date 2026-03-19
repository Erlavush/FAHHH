import type { ThreeEvent } from "@react-three/fiber";
import { PackAssetModel } from "./PackAssetModel";

interface OfficePackModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function OfficeDeskModel(props: OfficePackModelProps) {
  return (
    <PackAssetModel
      {...props}
      nodeNames={["OfficeTable", "Conputer"]}
      targetSize={{
        width: 2.85,
        height: 1.45,
        depth: 0.95
      }}
      overlaySize={[2.96, 1.48, 1.02]}
      ringSize={[0.54, 0.68]}
      fallbackColor="#b88a65"
    />
  );
}

export function OfficeChairModel(props: OfficePackModelProps) {
  return (
    <PackAssetModel
      {...props}
      nodeNames={["OfficeChair"]}
      targetSize={{
        width: 0.92,
        height: 1.18,
        depth: 0.92
      }}
      overlaySize={[0.98, 1.22, 0.98]}
      ringSize={[0.44, 0.58]}
      modelOffset={[0, -0.03, 0]}
      fallbackColor="#4b526f"
    />
  );
}
