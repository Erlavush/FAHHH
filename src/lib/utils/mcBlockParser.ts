import * as THREE from 'three';

export interface MCBlockElementFace {
  uv?: [number, number, number, number];
  texture: string;
  cullface?: string;
  rotation?: number;
  tintindex?: number;
}

export interface MCBlockElement {
  from: [number, number, number];
  to: [number, number, number];
  rotation?: {
    origin: [number, number, number];
    axis: 'x' | 'y' | 'z';
    angle: number;
    rescale?: boolean;
  };
  shade?: boolean;
  faces: {
    down?: MCBlockElementFace;
    up?: MCBlockElementFace;
    north?: MCBlockElementFace;
    south?: MCBlockElementFace;
    west?: MCBlockElementFace;
    east?: MCBlockElementFace;
  };
}

export interface MCBlockModel {
  parent?: string;
  ambientocclusion?: boolean;
  display?: any;
  textures?: Record<string, string>;
  elements?: MCBlockElement[];
}

/**
 * Sets UV coordinates for a specific face of a BoxGeometry.
 * Minecraft UVs are [x1, y1, x2, y2] from 0 to 16, with 0,0 being top-left.
 */
function setFaceUVs(geometry: THREE.BufferGeometry, faceIndex: number, uv: [number, number, number, number]) {
  const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const vertexOffset = faceIndex * 4;

  const xMin = uv[0] / 16;
  const yMin = 1 - uv[3] / 16; // Minecraft y2 is bottom
  const xMax = uv[2] / 16;
  const yMax = 1 - uv[1] / 16; // Minecraft y1 is top

  // BoxGeometry face vertex order: Top-Left, Top-Right, Bottom-Left, Bottom-Right
  uvAttribute.setXY(vertexOffset + 0, xMin, yMax);
  uvAttribute.setXY(vertexOffset + 1, xMax, yMax);
  uvAttribute.setXY(vertexOffset + 2, xMin, yMin);
  uvAttribute.setXY(vertexOffset + 3, xMax, yMin);
  
  uvAttribute.needsUpdate = true;
}

/**
 * Converts a Minecraft Block JSON model into a Three.js Group.
 */
export function parseMCBlockModel(
  model: MCBlockModel, 
  textureLoader?: (texturePath: string) => THREE.Texture
): THREE.Group {
  const group = new THREE.Group();

  if (!model.elements) {
    return group;
  }

  // Texture resolution: handle #texture references
  const resolveTexture = (ref: string): string => {
    if (ref.startsWith('#') && model.textures) {
      const key = ref.substring(1);
      const resolved = model.textures[key];
      if (resolved) return resolveTexture(resolved);
    }
    return ref;
  };

  for (const element of model.elements) {
    const from = element.from;
    const to = element.to;

    const size = [
      Math.abs(to[0] - from[0]),
      Math.abs(to[1] - from[1]),
      Math.abs(to[2] - from[2])
    ];

    const center = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      (from[2] + to[2]) / 2
    ];

    const geometry = new THREE.BoxGeometry(
      size[0] / 16,
      size[1] / 16,
      size[2] / 16
    );

    const materials: THREE.Material[] = [];
    const faceKeys: (keyof MCBlockElement['faces'])[] = ['east', 'west', 'up', 'down', 'south', 'north'];
    
    faceKeys.forEach((key, index) => {
      const face = element.faces[key];
      if (face) {
        const texturePath = resolveTexture(face.texture);
        const texture = textureLoader ? textureLoader(texturePath) : null;
        
        const material = new THREE.MeshStandardMaterial({ 
          map: texture,
          transparent: true,
          alphaTest: 0.5, // Minecraft often uses cutout textures
        });
        
        materials.push(material);

        // Apply UVs if defined, otherwise default to full texture
        const uv = face.uv || getDefaultUV(key, from, to);
        setFaceUVs(geometry, index, uv);
      } else {
        materials.push(new THREE.MeshBasicMaterial({ visible: false }));
      }
    });

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(
      (center[0] - 8) / 16,
      (center[1] - 8) / 16,
      (center[2] - 8) / 16
    );

    if (element.rotation) {
      const { origin, axis, angle } = element.rotation;
      const pivot = new THREE.Vector3(
        (origin[0] - 8) / 16,
        (origin[1] - 8) / 16,
        (origin[2] - 8) / 16
      );

      const pivotGroup = new THREE.Group();
      pivotGroup.position.copy(pivot);
      pivotGroup.add(mesh);
      mesh.position.sub(pivot);

      const rad = (angle * Math.PI) / 180;
      // Minecraft rotations: positive angle is clockwise around the axis?
      // Actually MC rotation is a bit special (only -45 to 45 degrees)
      if (axis === 'x') pivotGroup.rotation.x = rad;
      if (axis === 'y') pivotGroup.rotation.y = -rad; 
      if (axis === 'z') pivotGroup.rotation.z = rad;

      group.add(pivotGroup);
    } else {
      group.add(mesh);
    }
  }

  return group;
}

/**
 * Calculates default UVs based on element coordinates if not explicitly provided.
 */
function getDefaultUV(face: string, from: [number, number, number], to: [number, number, number]): [number, number, number, number] {
  switch (face) {
    case 'down':
    case 'up':
      return [from[0], from[2], to[0], to[2]];
    case 'north':
    case 'south':
      return [from[0], 16 - to[1], to[0], 16 - from[1]];
    case 'west':
    case 'east':
      return [from[2], 16 - to[1], to[2], 16 - from[1]];
    default:
      return [0, 0, 16, 16];
  }
}
