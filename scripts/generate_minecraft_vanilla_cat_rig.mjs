import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { Box3, Euler, Matrix4, Quaternion, Vector3 } from "three";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const PIXEL_TO_WORLD = 1 / 16;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const packRoot = process.argv[2] ?? "C:\\Users\\user\\Downloads\\Better Cats v4.0 1.21.10";

const outputPresetPath = path.join(repoRoot, "src", "lib", "mob-presets", "minecraft_vanilla_cat_rig.json");
const outputTextureDir = path.join(repoRoot, "public", "textures", "placeholders");
const outputTexturePath = path.join(outputTextureDir, "minecraft_cat_rig_green.png");

const BONE_IDS = [
  "head",
  "body",
  "tail",
  "tail2",
  "front_left_leg",
  "front_right_leg",
  "back_left_leg",
  "back_right_leg"
];

const BRANCH_MAPPINGS = [
  { sourceId: "headbase", parentBoneId: "head", id: "head_geo", label: "Head Geometry" },
  { sourceId: "baseears", parentBoneId: "head", id: "head_ears", label: "Head Ears" },
  { sourceId: "baseeyes", parentBoneId: "head", id: "head_eyes", label: "Head Eyes" },
  { sourceId: "muzzle", parentBoneId: "head", id: "head_muzzle", label: "Head Muzzle" },
  { sourceId: "whiskers", parentBoneId: "head", id: "head_whiskers", label: "Head Whiskers" },
  { sourceId: "base", parentBoneId: "body", id: "body_geo", label: "Body Geometry" },
  { sourceId: "normaltail", parentBoneId: "tail", id: "tail_geo", label: "Tail Geometry" },
  { sourceId: "normaltip", parentBoneId: "tail2", id: "tail_tip_geo", label: "Tail Tip Geometry" },
  { sourceId: "front_left_leg2", parentBoneId: "front_left_leg", id: "front_left_leg_geo", label: "Front Left Leg Geometry" },
  { sourceId: "front_right_leg2", parentBoneId: "front_right_leg", id: "front_right_leg_geo", label: "Front Right Leg Geometry" },
  { sourceId: "back_left_leg2", parentBoneId: "back_left_leg", id: "back_left_leg_geo", label: "Rear Left Leg Geometry" },
  { sourceId: "back_right_leg2", parentBoneId: "back_right_leg", id: "back_right_leg_geo", label: "Rear Right Leg Geometry" }
];

const PART_SPECS = [
  { id: "head", label: "Head", role: "head" },
  { id: "body", label: "Body", role: "body" },
  { id: "tail", label: "Tail Root", role: "tail" },
  { id: "tail2", label: "Tail Tip" },
  { id: "front_left_leg", label: "Front Left Leg", role: "front_left_leg" },
  { id: "front_right_leg", label: "Front Right Leg", role: "front_right_leg" },
  { id: "back_left_leg", label: "Rear Left Leg", role: "rear_left_leg" },
  { id: "back_right_leg", label: "Rear Right Leg", role: "rear_right_leg" }
];

function getCemAxisSigns(invertAxis = "") {
  return [
    invertAxis.includes("x") ? -1 : 1,
    invertAxis.includes("y") ? -1 : 1,
    invertAxis.includes("z") ? -1 : 1
  ];
}

function convertCemPosition(position, invertAxis = "") {
  const [signX, signY, signZ] = getCemAxisSigns(invertAxis);
  return [position[0] * signX, position[1] * signY, position[2] * signZ];
}

function convertCemRotation(rotation, invertAxis = "") {
  const x = invertAxis.includes("x") ? -rotation[0] : rotation[0];
  const y = invertAxis.includes("y") ? -rotation[1] : rotation[1];
  const z = invertAxis.includes("z") ? -rotation[2] : rotation[2];
  return [x * DEG_TO_RAD, y * DEG_TO_RAD, z * DEG_TO_RAD];
}

function getCemBoxGeometrySize(box) {
  const [, , , width, height, depth] = box.coordinates;
  const sizeAdd = box.sizeAdd ?? 0;
  return [width + sizeAdd * 2, height + sizeAdd * 2, depth + sizeAdd * 2];
}

function getCemBoxCenter(box, invertAxis = "") {
  const [x, y, z, width, height, depth] = box.coordinates;
  const [signX, signY, signZ] = getCemAxisSigns(invertAxis);
  return [
    (x + width / 2) * signX,
    (y + height / 2) * signY,
    (z + depth / 2) * signZ
  ];
}

function mapFaceUvs(box) {
  const mapping = {
    right: box.uvEast,
    left: box.uvWest,
    top: box.uvUp,
    bottom: box.uvDown,
    front: box.uvSouth,
    back: box.uvNorth
  };

  const hasAnyFaceUvs = Object.values(mapping).some((value) => Array.isArray(value));
  if (!hasAnyFaceUvs) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(mapping).filter(([, value]) => Array.isArray(value))
  );
}

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

async function writeSolidPng(targetPath, width, height, rgba) {
  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * rowLength] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = y * rowLength + 1 + x * 4;
      raw[offset + 0] = rgba[0];
      raw[offset + 1] = rgba[1];
      raw[offset + 2] = rgba[2];
      raw[offset + 3] = rgba[3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);

  await fs.writeFile(targetPath, png);
}

function prettifyLabel(value) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function round(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function roundVector(vector, precision = 4) {
  return vector.map((value) => round(value, precision));
}

function decomposeToTransform(matrix) {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  matrix.decompose(position, quaternion, scale);
  const euler = new Euler().setFromQuaternion(quaternion, "XYZ");

  return {
    position: roundVector([position.x, position.y, position.z]),
    rotation: roundVector([euler.x * RAD_TO_DEG, euler.y * RAD_TO_DEG, euler.z * RAD_TO_DEG]),
    scale: roundVector([scale.x, scale.y, scale.z])
  };
}

function normalizeBox(box, effectiveInvertAxis) {
  const size = getCemBoxGeometrySize(box);
  const center = getCemBoxCenter(box, effectiveInvertAxis);
  return {
    coordinates: [
      round(center[0] - size[0] / 2),
      round(center[1] - size[1] / 2),
      round(center[2] - size[2] / 2),
      round(size[0]),
      round(size[1]),
      round(size[2])
    ],
    faceUvs: mapFaceUvs(box),
    sizeAdd: box.sizeAdd
  };
}

function toRawNode(rawNode, inheritedInvertAxis = "") {
  const effectiveInvertAxis = rawNode.invertAxis && rawNode.invertAxis.length > 0
    ? rawNode.invertAxis
    : inheritedInvertAxis;

  return {
    id: rawNode.id ?? rawNode.part,
    part: rawNode.part ?? null,
    effectiveInvertAxis,
    transform: {
      position: rawNode.translate ?? [0, 0, 0],
      rotation: rawNode.rotate ?? [0, 0, 0],
      scale: [1, 1, 1]
    },
    boxes: rawNode.boxes ?? [],
    children: (rawNode.submodels ?? []).map((child) => toRawNode(child, effectiveInvertAxis))
  };
}

function indexRawTree(node, parentId, nodeMap, parentMap) {
  nodeMap.set(node.id, node);
  parentMap.set(node.id, parentId);
  for (const child of node.children) {
    indexRawTree(child, node.id, nodeMap, parentMap);
  }
}

function computeWorldMatrices(node, parentWorldMatrix, matrixMap) {
  const position = convertCemPosition(node.transform.position, node.effectiveInvertAxis);
  const rotation = convertCemRotation(node.transform.rotation, node.effectiveInvertAxis);
  const localMatrix = new Matrix4().compose(
    new Vector3(position[0], position[1], position[2]),
    new Quaternion().setFromEuler(new Euler(rotation[0], rotation[1], rotation[2], "XYZ")),
    new Vector3(node.transform.scale[0], node.transform.scale[1], node.transform.scale[2])
  );
  const worldMatrix = parentWorldMatrix.clone().multiply(localMatrix);
  matrixMap.set(node.id, worldMatrix);
  for (const child of node.children) {
    computeWorldMatrices(child, worldMatrix, matrixMap);
  }
}

function cloneNormalizedBranch(node, parentWorldMatrix, matrixMap, nextId) {
  const worldMatrix = matrixMap.get(node.id);
  const localMatrix = parentWorldMatrix.clone().invert().multiply(worldMatrix);
  const children = node.children.map((child) => cloneNormalizedBranch(child, worldMatrix, matrixMap, nextId));

  return {
    id: nextId ?? node.id,
    label: prettifyLabel(nextId ?? node.id),
    transform: decomposeToTransform(localMatrix),
    boxes: node.boxes.map((box) => normalizeBox(box, node.effectiveInvertAxis)),
    children
  };
}

function collectBounds(node, parentMatrix, bounds) {
  const localTransform = node.transform;
  const localMatrix = new Matrix4().compose(
    new Vector3(localTransform.position[0], localTransform.position[1], localTransform.position[2]),
    new Quaternion().setFromEuler(new Euler(
      localTransform.rotation[0] * DEG_TO_RAD,
      localTransform.rotation[1] * DEG_TO_RAD,
      localTransform.rotation[2] * DEG_TO_RAD,
      "XYZ"
    )),
    new Vector3(localTransform.scale[0], localTransform.scale[1], localTransform.scale[2])
  );
  const worldMatrix = parentMatrix.clone().multiply(localMatrix);

  for (const box of node.boxes) {
    const [x, y, z, width, height, depth] = box.coordinates;
    const center = new Vector3(x + width / 2, y + height / 2, z + depth / 2);
    const half = new Vector3(width / 2, height / 2, depth / 2);
    for (const ox of [-half.x, half.x]) {
      for (const oy of [-half.y, half.y]) {
        for (const oz of [-half.z, half.z]) {
          const point = new Vector3(center.x + ox, center.y + oy, center.z + oz).applyMatrix4(worldMatrix);
          bounds.expandByPoint(point);
        }
      }
    }
  }

  for (const child of node.children) {
    collectBounds(child, worldMatrix, bounds);
  }
}

async function main() {
  await fs.mkdir(path.dirname(outputPresetPath), { recursive: true });
  await fs.mkdir(outputTextureDir, { recursive: true });
  await writeSolidPng(outputTexturePath, 64, 64, [32, 255, 96, 255]);

  const jemPath = path.join(packRoot, "assets", "minecraft", "optifine", "cem", "cat.jem");
  const jem = JSON.parse(await fs.readFile(jemPath, "utf8"));
  const rawRoots = (jem.models ?? []).map((rawNode) => toRawNode(rawNode));
  const nodeMap = new Map();
  const parentMap = new Map();
  const matrixMap = new Map();

  for (const rawRoot of rawRoots) {
    indexRawTree(rawRoot, null, nodeMap, parentMap);
    computeWorldMatrices(rawRoot, new Matrix4(), matrixMap);
  }

  const rootNodes = [];
  const partDefinitions = [];
  const bounds = new Box3();
  const identity = new Matrix4();

  for (const partSpec of PART_SPECS) {
    const rawBone = nodeMap.get(partSpec.id);
    if (!rawBone) {
      continue;
    }

    const boneWorldMatrix = matrixMap.get(partSpec.id);
    const children = BRANCH_MAPPINGS
      .filter((mapping) => mapping.parentBoneId === partSpec.id)
      .map((mapping) => {
        const rawBranch = nodeMap.get(mapping.sourceId);
        if (!rawBranch) {
          return null;
        }
        return cloneNormalizedBranch(rawBranch, boneWorldMatrix, matrixMap, mapping.id);
      })
      .filter(Boolean);

    const boneNode = {
      id: partSpec.id,
      label: partSpec.label,
      transform: decomposeToTransform(boneWorldMatrix),
      boxes: [],
      children
    };

    rootNodes.push(boneNode);
    partDefinitions.push({
      id: partSpec.id,
      label: partSpec.label,
      parentId: null,
      role: partSpec.role,
      geometry: {
        size: [1, 1, 1],
        offset: [0, 0, 0],
        textureOrigin: [0, 0]
      },
      transform: boneNode.transform
    });
    collectBounds(boneNode, identity, bounds);
  }

  const sizeVector = bounds.getSize(new Vector3()).multiplyScalar(PIXEL_TO_WORLD);
  const centerVector = bounds.getCenter(new Vector3()).multiplyScalar(PIXEL_TO_WORLD);
  const groundOffset = -bounds.min.y * PIXEL_TO_WORLD;
  const groundedCenterY = centerVector.y + groundOffset;
  const maxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);

  const preset = {
    id: "minecraft_vanilla_cat_rig",
    label: "Minecraft Vanilla Cat Rig",
    sourceLabel: "Vanilla Cat Skeleton",
    sourceMobPath: `${path.basename(packRoot)} -> assets/minecraft/optifine/cem/cat.jem parent bones`,
    presetRevision: 1,
    renderMode: "cem",
    editorTransformSpace: "local_absolute",
    textureSrc: "/textures/placeholders/minecraft_cat_rig_green.png",
    textureSize: [64, 64],
    parts: partDefinitions,
    animation: {
      idle: {
        frequency: 1.15,
        bodyBob: 0.02,
        headYaw: 3,
        headPitch: 2,
        tailYaw: 4,
        tailPitch: 3,
        earPitch: 0,
        earRoll: 0
      },
      walk: {
        strideRate: 7.5,
        limbSwing: 0.7,
        bodyBob: 0.04,
        bodyRoll: 1.5,
        headNod: 1.6,
        tailYaw: 3,
        tailPitch: 5
      }
    },
    locomotion: {
      mode: "idle",
      speed: 0.18,
      turnResponsiveness: 6,
      loopRadius: 0.9
    },
    physics: {
      groundOffset: round(groundOffset),
      colliderSize: roundVector([sizeVector.x, sizeVector.y, sizeVector.z]),
      colliderOffset: roundVector([centerVector.x, centerVector.y, centerVector.z]),
      showCollider: true
    },
    stage: {
      modelScale: PIXEL_TO_WORLD,
      cameraPosition: [
        round(centerVector.x + Math.max(2.4, maxDimension * 2.25)),
        round(groundedCenterY + Math.max(1.4, maxDimension * 1.35)),
        round(centerVector.z + Math.max(2.8, maxDimension * 2.6))
      ],
      cameraTarget: [round(centerVector.x), round(groundedCenterY), round(centerVector.z)]
    },
    cemModel: {
      animationProfile: "minecraft_cat",
      animationNodes: {
        bodyId: "body",
        headId: "head",
        tailRootId: "tail",
        tailLowerId: "tail2",
        frontLeftLegId: "front_left_leg",
        frontRightLegId: "front_right_leg",
        rearLeftLegId: "back_left_leg",
        rearRightLegId: "back_right_leg"
      },
      rootNodes
    }
  };

  await fs.writeFile(outputPresetPath, `${JSON.stringify(preset, null, 2)}\n`, "utf8");
  console.log(`Generated ${outputPresetPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
