import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import {
  CanvasTexture,
  FrontSide,
  Group,
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace
} from "three";

type CubeFace = "right" | "left" | "top" | "bottom" | "front" | "back";

interface FaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CubeSkinMap = Record<CubeFace, FaceRect>;

interface SkinSet {
  head: MeshStandardMaterial[];
  helmet: MeshStandardMaterial[];
  body: MeshStandardMaterial[];
  jacket: MeshStandardMaterial[];
  rightArm: MeshStandardMaterial[];
  rightSleeve: MeshStandardMaterial[];
  leftArm: MeshStandardMaterial[];
  leftSleeve: MeshStandardMaterial[];
  rightLeg: MeshStandardMaterial[];
  rightPants: MeshStandardMaterial[];
  leftLeg: MeshStandardMaterial[];
  leftPants: MeshStandardMaterial[];
}

interface MinecraftPlayerProps {
  initialPosition: [number, number, number];
  skinSrc: string | null;
  targetPosition: [number, number, number];
  interaction:
    | {
        type: "sit" | "lie";
        position: [number, number, number];
        rotationY: number;
      }
    | null;
  onPositionChange: (position: [number, number, number]) => void;
  shadowsEnabled: boolean;
}

const MATERIAL_ORDER: CubeFace[] = ["right", "left", "top", "bottom", "front", "back"];

const HEAD: CubeSkinMap = {
  right: { x: 0, y: 8, width: 8, height: 8 },
  left: { x: 16, y: 8, width: 8, height: 8 },
  top: { x: 8, y: 0, width: 8, height: 8 },
  bottom: { x: 16, y: 0, width: 8, height: 8 },
  front: { x: 8, y: 8, width: 8, height: 8 },
  back: { x: 24, y: 8, width: 8, height: 8 }
};

const HELMET: CubeSkinMap = {
  right: { x: 32, y: 8, width: 8, height: 8 },
  left: { x: 48, y: 8, width: 8, height: 8 },
  top: { x: 40, y: 0, width: 8, height: 8 },
  bottom: { x: 48, y: 0, width: 8, height: 8 },
  front: { x: 40, y: 8, width: 8, height: 8 },
  back: { x: 56, y: 8, width: 8, height: 8 }
};

const BODY: CubeSkinMap = {
  right: { x: 16, y: 20, width: 4, height: 12 },
  left: { x: 28, y: 20, width: 4, height: 12 },
  top: { x: 20, y: 16, width: 8, height: 4 },
  bottom: { x: 28, y: 16, width: 8, height: 4 },
  front: { x: 20, y: 20, width: 8, height: 12 },
  back: { x: 32, y: 20, width: 8, height: 12 }
};

const JACKET: CubeSkinMap = {
  right: { x: 16, y: 36, width: 4, height: 12 },
  left: { x: 28, y: 36, width: 4, height: 12 },
  top: { x: 20, y: 32, width: 8, height: 4 },
  bottom: { x: 28, y: 32, width: 8, height: 4 },
  front: { x: 20, y: 36, width: 8, height: 12 },
  back: { x: 32, y: 36, width: 8, height: 12 }
};

const RIGHT_ARM: CubeSkinMap = {
  right: { x: 40, y: 20, width: 4, height: 12 },
  left: { x: 48, y: 20, width: 4, height: 12 },
  top: { x: 44, y: 16, width: 4, height: 4 },
  bottom: { x: 48, y: 16, width: 4, height: 4 },
  front: { x: 44, y: 20, width: 4, height: 12 },
  back: { x: 52, y: 20, width: 4, height: 12 }
};

const RIGHT_SLEEVE: CubeSkinMap = {
  right: { x: 40, y: 36, width: 4, height: 12 },
  left: { x: 48, y: 36, width: 4, height: 12 },
  top: { x: 44, y: 32, width: 4, height: 4 },
  bottom: { x: 48, y: 32, width: 4, height: 4 },
  front: { x: 44, y: 36, width: 4, height: 12 },
  back: { x: 52, y: 36, width: 4, height: 12 }
};

const LEFT_ARM: CubeSkinMap = {
  right: { x: 32, y: 52, width: 4, height: 12 },
  left: { x: 40, y: 52, width: 4, height: 12 },
  top: { x: 36, y: 48, width: 4, height: 4 },
  bottom: { x: 40, y: 48, width: 4, height: 4 },
  front: { x: 36, y: 52, width: 4, height: 12 },
  back: { x: 44, y: 52, width: 4, height: 12 }
};

const LEFT_SLEEVE: CubeSkinMap = {
  right: { x: 48, y: 52, width: 4, height: 12 },
  left: { x: 56, y: 52, width: 4, height: 12 },
  top: { x: 52, y: 48, width: 4, height: 4 },
  bottom: { x: 56, y: 48, width: 4, height: 4 },
  front: { x: 52, y: 52, width: 4, height: 12 },
  back: { x: 60, y: 52, width: 4, height: 12 }
};

const RIGHT_LEG: CubeSkinMap = {
  right: { x: 0, y: 20, width: 4, height: 12 },
  left: { x: 8, y: 20, width: 4, height: 12 },
  top: { x: 4, y: 16, width: 4, height: 4 },
  bottom: { x: 8, y: 16, width: 4, height: 4 },
  front: { x: 4, y: 20, width: 4, height: 12 },
  back: { x: 12, y: 20, width: 4, height: 12 }
};

const RIGHT_PANTS: CubeSkinMap = {
  right: { x: 0, y: 36, width: 4, height: 12 },
  left: { x: 8, y: 36, width: 4, height: 12 },
  top: { x: 4, y: 32, width: 4, height: 4 },
  bottom: { x: 8, y: 32, width: 4, height: 4 },
  front: { x: 4, y: 36, width: 4, height: 12 },
  back: { x: 12, y: 36, width: 4, height: 12 }
};

const LEFT_LEG: CubeSkinMap = {
  right: { x: 16, y: 52, width: 4, height: 12 },
  left: { x: 24, y: 52, width: 4, height: 12 },
  top: { x: 20, y: 48, width: 4, height: 4 },
  bottom: { x: 24, y: 48, width: 4, height: 4 },
  front: { x: 20, y: 52, width: 4, height: 12 },
  back: { x: 28, y: 52, width: 4, height: 12 }
};

const LEFT_PANTS: CubeSkinMap = {
  right: { x: 0, y: 52, width: 4, height: 12 },
  left: { x: 8, y: 52, width: 4, height: 12 },
  top: { x: 4, y: 48, width: 4, height: 4 },
  bottom: { x: 8, y: 48, width: 4, height: 4 },
  front: { x: 4, y: 52, width: 4, height: 12 },
  back: { x: 12, y: 52, width: 4, height: 12 }
};

function fillRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function createDefaultSkin(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");

  if (!context) {
    return "";
  }

  context.clearRect(0, 0, 64, 64);

  const fillCube = (map: CubeSkinMap, color: string) => {
    MATERIAL_ORDER.forEach((face) => {
      const rect = map[face];
      fillRect(context, rect.x, rect.y, rect.width, rect.height, color);
    });
  };

  fillCube(HEAD, "#e1b792");
  fillCube(BODY, "#d1833e");
  fillCube(RIGHT_ARM, "#e1b792");
  fillCube(LEFT_ARM, "#e1b792");
  fillCube(RIGHT_LEG, "#2f628f");
  fillCube(LEFT_LEG, "#2f628f");

  fillRect(context, 8, 8, 8, 8, "#deb38d");
  fillRect(context, 10, 10, 2, 2, "#2d241f");
  fillRect(context, 13, 10, 2, 2, "#2d241f");
  fillRect(context, 10, 11, 1, 1, "#8bb7d6");
  fillRect(context, 14, 11, 1, 1, "#8bb7d6");
  fillRect(context, 11, 13, 3, 1, "#b07263");

  fillRect(context, 0, 8, 32, 8, "#6a4537");
  fillRect(context, 8, 0, 8, 8, "#825542");

  return canvas.toDataURL("image/png");
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the skin image."));
    image.src = source;
  });
}

function createSkinCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare the skin canvas.");
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0);

  return canvas;
}

function createFaceMaterial(
  skinCanvas: HTMLCanvasElement,
  rect: FaceRect,
  transparent: boolean
): MeshStandardMaterial {
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = rect.width;
  faceCanvas.height = rect.height;
  const context = faceCanvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare a face texture.");
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, rect.width, rect.height);
  context.drawImage(
    skinCanvas,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  );

  const texture = new CanvasTexture(faceCanvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;

  return new MeshStandardMaterial({
    map: texture,
    transparent,
    alphaTest: transparent ? 0.05 : 0,
    side: FrontSide
  });
}

function createMaterialSet(
  skinCanvas: HTMLCanvasElement,
  map: CubeSkinMap,
  transparent: boolean
): MeshStandardMaterial[] {
  return MATERIAL_ORDER.map((face) => createFaceMaterial(skinCanvas, map[face], transparent));
}

function createInvisibleMaterialSet(): MeshStandardMaterial[] {
  return MATERIAL_ORDER.map(
    () =>
      new MeshStandardMaterial({
        transparent: true,
        opacity: 0,
        alphaTest: 1
      })
  );
}

function disposeMaterialSet(materials: MeshStandardMaterial[]): void {
  materials.forEach((material) => {
    material.map?.dispose();
    material.dispose();
  });
}

function buildSkinSet(skinCanvas: HTMLCanvasElement): SkinSet {
  const modernSkin = skinCanvas.width === 64 && skinCanvas.height === 64;

  return {
    head: createMaterialSet(skinCanvas, HEAD, false),
    helmet: modernSkin ? createMaterialSet(skinCanvas, HELMET, true) : createInvisibleMaterialSet(),
    body: createMaterialSet(skinCanvas, BODY, false),
    jacket: modernSkin ? createMaterialSet(skinCanvas, JACKET, true) : createInvisibleMaterialSet(),
    rightArm: createMaterialSet(skinCanvas, RIGHT_ARM, false),
    rightSleeve: modernSkin
      ? createMaterialSet(skinCanvas, RIGHT_SLEEVE, true)
      : createInvisibleMaterialSet(),
    leftArm: modernSkin
      ? createMaterialSet(skinCanvas, LEFT_ARM, false)
      : createMaterialSet(skinCanvas, RIGHT_ARM, false),
    leftSleeve: modernSkin
      ? createMaterialSet(skinCanvas, LEFT_SLEEVE, true)
      : createInvisibleMaterialSet(),
    rightLeg: createMaterialSet(skinCanvas, RIGHT_LEG, false),
    rightPants: modernSkin
      ? createMaterialSet(skinCanvas, RIGHT_PANTS, true)
      : createInvisibleMaterialSet(),
    leftLeg: modernSkin
      ? createMaterialSet(skinCanvas, LEFT_LEG, false)
      : createMaterialSet(skinCanvas, RIGHT_LEG, false),
    leftPants: modernSkin
      ? createMaterialSet(skinCanvas, LEFT_PANTS, true)
      : createInvisibleMaterialSet()
  };
}

function disposeSkinSet(skinSet: SkinSet): void {
  Object.values(skinSet).forEach(disposeMaterialSet);
}

function lerpAngle(current: number, target: number, factor: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * factor;
}

export function MinecraftPlayer({
  initialPosition,
  skinSrc,
  targetPosition,
  interaction,
  onPositionChange,
  shadowsEnabled
}: MinecraftPlayerProps) {
  const { moveSpeed } = useControls("Player", {
    moveSpeed: { value: 3.1, min: 0.5, max: 15, step: 0.1, label: "Movement Speed" }
  });
  const defaultSkin = useMemo(() => createDefaultSkin(), []);
  const [skinSet, setSkinSet] = useState<SkinSet | null>(null);
  const rootRef = useRef<Group>(null);
  const poseRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const stepTimeRef = useRef(0);
  const lastSentTimeRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let activeSkinSet: SkinSet | null = null;

    async function loadSkin(): Promise<void> {
      const image = await loadImage(skinSrc ?? defaultSkin);

      if (
        image.width !== 64 ||
        (image.height !== 32 && image.height !== 64)
      ) {
        throw new Error("Skins must use the standard Minecraft size: 64x64 or 64x32.");
      }

      const nextSkinSet = buildSkinSet(createSkinCanvas(image));

      if (cancelled) {
        disposeSkinSet(nextSkinSet);
        return;
      }

      activeSkinSet = nextSkinSet;
      setSkinSet((current) => {
        if (current) {
          disposeSkinSet(current);
        }

        return nextSkinSet;
      });
    }

    void loadSkin().catch(() => {
      if (skinSrc !== defaultSkin) {
        void loadImage(defaultSkin).then((image) => {
          if (cancelled) {
            return;
          }

          const fallbackSkinSet = buildSkinSet(createSkinCanvas(image));
          activeSkinSet = fallbackSkinSet;
          setSkinSet((current) => {
            if (current) {
              disposeSkinSet(current);
            }

            return fallbackSkinSet;
          });
        });
      }
    });

    return () => {
      cancelled = true;

      if (activeSkinSet) {
        disposeSkinSet(activeSkinSet);
      }
    };
  }, [defaultSkin, skinSrc]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const pose = poseRef.current;
    const head = headRef.current;
    const body = bodyRef.current;
    const rightArm = rightArmRef.current;
    const leftArm = leftArmRef.current;
    const rightLeg = rightLegRef.current;
    const leftLeg = leftLegRef.current;

    if (!root || !pose || !head || !body || !rightArm || !leftArm || !rightLeg || !leftLeg) {
      return;
    }

    const dx = targetPosition[0] - root.position.x;
    const dz = targetPosition[2] - root.position.z;
    const distance = Math.hypot(dx, dz);
    const isMoving = distance > 0.02;
    const interactionDistance = interaction
      ? Math.hypot(
          interaction.position[0] - root.position.x,
          interaction.position[2] - root.position.z
        )
      : Infinity;
    const interactionReady = interactionDistance < 0.035;
    const isSitting = interaction?.type === "sit" && interactionReady;
    const isLying = interaction?.type === "lie" && interactionReady;

    if (interaction?.type === "lie") {
      if (interactionReady) {
        root.position.x = interaction.position[0];
        root.position.z = interaction.position[2];
        root.rotation.y = interaction.rotationY;
      } else {
        root.position.x += (interaction.position[0] - root.position.x) * Math.min(1, delta * 16);
        root.position.z += (interaction.position[2] - root.position.z) * Math.min(1, delta * 16);

        const targetYaw = Math.atan2(
          interaction.position[0] - root.position.x,
          interaction.position[2] - root.position.z
        );
        root.rotation.y = lerpAngle(root.rotation.y, targetYaw, Math.min(1, delta * 12));
      }

      stepTimeRef.current += delta * 1.4;
    } else if (interaction) {
      root.position.x += (interaction.position[0] - root.position.x) * Math.min(1, delta * 16);
      root.position.z += (interaction.position[2] - root.position.z) * Math.min(1, delta * 16);
      root.rotation.y = lerpAngle(root.rotation.y, interaction.rotationY, Math.min(1, delta * 12));
      stepTimeRef.current += delta * 1.4;
    } else if (isMoving) {
      const moveStep = Math.min(distance, moveSpeed * delta);
      root.position.x += (dx / distance) * moveStep;
      root.position.z += (dz / distance) * moveStep;

      const targetYaw = Math.atan2(dx, dz);
      root.rotation.y = lerpAngle(root.rotation.y, targetYaw, Math.min(1, delta * 10));

      stepTimeRef.current += delta * 12;
    } else {
      stepTimeRef.current += delta * 2.3;
    }

    const walkSwing =
      !interactionReady && isMoving ? Math.sin(stepTimeRef.current) : 0;
    const walkSwingOpposite =
      !interactionReady && isMoving ? -Math.sin(stepTimeRef.current) : 0;
    const idleFloat = Math.sin(state.clock.elapsedTime * 1.8) * 0.015;
    const idleSway = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;

    root.position.y = targetPosition[1];

    if (isLying) {
      pose.position.set(0, 0.84, 0);
      pose.rotation.set(-Math.PI / 2, 0, 0);

      body.position.set(0, 1.125, 0);
      body.rotation.set(0, 0, 0);

      head.position.set(0, 1.75, 0);
      head.rotation.set(0, 0, 0);

      rightArm.position.set(-0.375, 1.5, 0);
      leftArm.position.set(0.375, 1.5, 0);
      rightArm.rotation.set(0, 0, 0);
      leftArm.rotation.set(0, 0, 0);

      rightLeg.position.set(-0.125, 0.75, 0);
      leftLeg.position.set(0.125, 0.75, 0);
      rightLeg.rotation.set(0, 0, 0);
      leftLeg.rotation.set(0, 0, 0);
    } else {
      pose.position.set(0, 0, 0);
      pose.rotation.set(0, 0, 0);
    }

    if (isSitting) {
      body.position.y = 0.98 + idleFloat * 0.2;
      body.rotation.x = -0.18 + idleSway * 0.08;
      body.rotation.z = idleSway * 0.06;

      head.position.y = 1.56 + idleFloat * 0.18;
      head.rotation.x = 0.06 + Math.sin(state.clock.elapsedTime * 1.2) * 0.02;
      head.rotation.z = idleSway * 0.18;

      rightArm.position.set(-0.37, 1.28, 0.08);
      leftArm.position.set(0.37, 1.28, 0.08);
      rightArm.rotation.x = -0.62;
      leftArm.rotation.x = -0.62;
      rightArm.rotation.z = 0.08;
      leftArm.rotation.z = -0.08;

      rightLeg.position.set(-0.125, 0.56, 0.08);
      leftLeg.position.set(0.125, 0.56, 0.08);
      rightLeg.rotation.x = -1.34;
      leftLeg.rotation.x = -1.34;
      rightLeg.rotation.z = 0;
      leftLeg.rotation.z = 0;
    } else {
      body.position.y =
        1.125 + (isMoving ? Math.abs(Math.sin(stepTimeRef.current)) * 0.04 : idleFloat * 0.5);
      body.rotation.x = isMoving ? Math.cos(stepTimeRef.current) * 0.04 : idleSway * 0.2;
      body.rotation.z = isMoving ? Math.sin(stepTimeRef.current * 0.5) * 0.035 : idleSway * 0.18;

      head.position.y =
        1.75 + (isMoving ? Math.abs(Math.sin(stepTimeRef.current * 0.5)) * 0.03 : idleFloat * 0.4);
      head.rotation.x = isMoving
        ? -Math.abs(Math.sin(stepTimeRef.current)) * 0.08
        : Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
      head.rotation.z = isMoving ? Math.sin(stepTimeRef.current * 0.45) * 0.05 : idleSway * 0.4;

      rightArm.position.set(-0.375, 1.5, 0);
      leftArm.position.set(0.375, 1.5, 0);
      rightArm.rotation.x = walkSwingOpposite * 0.72;
      leftArm.rotation.x = walkSwing * 0.72;
      rightArm.rotation.z = isMoving ? 0.08 : 0.03;
      leftArm.rotation.z = isMoving ? -0.08 : -0.03;

      rightLeg.position.set(-0.125, 0.75, 0);
      leftLeg.position.set(0.125, 0.75, 0);
      rightLeg.rotation.x = walkSwing * 0.72;
      leftLeg.rotation.x = walkSwingOpposite * 0.72;
      rightLeg.rotation.z = 0;
      leftLeg.rotation.z = 0;
    }

    if (state.clock.elapsedTime - lastSentTimeRef.current >= 0.1) {
      lastSentTimeRef.current = state.clock.elapsedTime;
      onPositionChange([root.position.x, root.position.y, root.position.z]);
    }
  });

  if (!skinSet) {
    return null;
  }

  return (
    <group ref={rootRef} position={initialPosition}>
      <group ref={poseRef}>
        <group ref={headRef} position={[0, 1.75, 0]}>
          <mesh castShadow={shadowsEnabled} material={skinSet.head}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
          </mesh>
          <mesh castShadow={shadowsEnabled} material={skinSet.helmet}>
            <boxGeometry args={[0.5625, 0.5625, 0.5625]} />
          </mesh>
        </group>

        <group ref={bodyRef} position={[0, 1.125, 0]}>
          <mesh castShadow={shadowsEnabled} material={skinSet.body}>
            <boxGeometry args={[0.5, 0.75, 0.25]} />
          </mesh>
          <mesh castShadow={shadowsEnabled} material={skinSet.jacket}>
            <boxGeometry args={[0.5625, 0.8125, 0.3125]} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[-0.375, 1.5, 0]}>
          <mesh castShadow={shadowsEnabled} material={skinSet.rightArm} position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
          </mesh>
          <mesh
            castShadow={shadowsEnabled}
            material={skinSet.rightSleeve}
            position={[0, -0.375, 0]}
          >
            <boxGeometry args={[0.3125, 0.8125, 0.3125]} />
          </mesh>
        </group>

        <group ref={leftArmRef} position={[0.375, 1.5, 0]}>
          <mesh castShadow={shadowsEnabled} material={skinSet.leftArm} position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
          </mesh>
          <mesh
            castShadow={shadowsEnabled}
            material={skinSet.leftSleeve}
            position={[0, -0.375, 0]}
          >
            <boxGeometry args={[0.3125, 0.8125, 0.3125]} />
          </mesh>
        </group>

        <group ref={rightLegRef} position={[-0.125, 0.75, 0]}>
          <mesh castShadow={shadowsEnabled} material={skinSet.rightLeg} position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
          </mesh>
          <mesh
            castShadow={shadowsEnabled}
            material={skinSet.rightPants}
            position={[0, -0.375, 0]}
          >
            <boxGeometry args={[0.3125, 0.8125, 0.3125]} />
          </mesh>
        </group>

        <group ref={leftLegRef} position={[0.125, 0.75, 0]}>
          <mesh castShadow={shadowsEnabled} material={skinSet.leftLeg} position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
          </mesh>
          <mesh
            castShadow={shadowsEnabled}
            material={skinSet.leftPants}
            position={[0, -0.375, 0]}
          >
            <boxGeometry args={[0.3125, 0.8125, 0.3125]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
