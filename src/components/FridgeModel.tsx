import type { ThreeEvent } from "@react-three/fiber";
import { PackAssetModel } from "./PackAssetModel";

interface FridgeModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function FridgeModel(props: FridgeModelProps) {
  return (
    <PackAssetModel
      {...props}
      nodeNames={["Fridge"]}
      targetSize={{
        width: 0.92,
        height: 2.1,
        depth: 0.92
      }}
      overlaySize={[0.98, 2.12, 0.98]}
      ringSize={[0.5, 0.64]}
      fallbackColor="#d9dee8"
    />
  );
}
