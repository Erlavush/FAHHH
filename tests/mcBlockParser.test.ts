import { describe, test, expect } from 'vitest';
import { MCBlockModel, parseMCBlockModel } from '../src/lib/utils/mcBlockParser';
import * as THREE from 'three';

describe('mcBlockParser', () => {
  test('should parse a simple slab model', () => {
    const slabModel: MCBlockModel = {
      textures: {
        "bottom": "block/oak_planks",
        "top": "block/oak_planks",
        "side": "block/oak_planks"
      },
      elements: [
        {
          "from": [ 0, 0, 0 ],
          "to": [ 16, 8, 16 ],
          "faces": {
            "down":  { "uv": [ 0, 0, 16, 16 ], "texture": "#bottom" },
            "up":    { "uv": [ 0, 0, 16, 16 ], "texture": "#top" },
            "north": { "uv": [ 0, 8, 16, 16 ], "texture": "#side" },
            "south": { "uv": [ 0, 8, 16, 16 ], "texture": "#side" },
            "west":  { "uv": [ 0, 8, 16, 16 ], "texture": "#side" },
            "east":  { "uv": [ 0, 8, 16, 16 ], "texture": "#side" }
          }
        }
      ]
    };

    const group = parseMCBlockModel(slabModel);
    
    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.children.length).toBe(1);
    
    const mesh = group.children[0] as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    
    const geometry = mesh.geometry as THREE.BoxGeometry;
    // Minecraft units: 16x8x16. Three.js units: 1x0.5x1.
    expect(geometry.parameters.width).toBeCloseTo(1);
    expect(geometry.parameters.height).toBeCloseTo(0.5);
    expect(geometry.parameters.depth).toBeCloseTo(1);
    
    // Position should be centered. Slab from 0,0,0 to 16,8,16.
    // Center is 8,4,8.
    // Three.js position relative to 8,8,8 center is:
    // (8-8)/16 = 0, (4-8)/16 = -0.25, (8-8)/16 = 0.
    expect(mesh.position.x).toBeCloseTo(0);
    expect(mesh.position.y).toBeCloseTo(-0.25);
    expect(mesh.position.z).toBeCloseTo(0);
  });

  test('should parse a rotated element', () => {
    const model: MCBlockModel = {
      elements: [
        {
          "from": [ 4, 4, 4 ],
          "to": [ 12, 12, 12 ],
          "rotation": { "origin": [ 8, 8, 8 ], "axis": "y", "angle": 45 },
          "faces": {
            "up": { "texture": "block/stone" }
          }
        }
      ]
    };

    const group = parseMCBlockModel(model);
    expect(group.children.length).toBe(1);
    
    // Rotated elements should be wrapped in a pivot group
    const pivot = group.children[0] as THREE.Group;
    expect(pivot).toBeInstanceOf(THREE.Group);
    expect(pivot.rotation.y).toBeCloseTo(-(45 * Math.PI) / 180);
  });
});
