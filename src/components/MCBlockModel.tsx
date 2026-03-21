import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { MCBlockModel, parseMCBlockModel } from '../lib/utils/mcBlockParser';

export interface MCBlockModelProps {
  model: MCBlockModel;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}

export const MCBlockModelView: React.FC<MCBlockModelProps> = ({
  model,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1
}) => {
  // Extract unique textures from the model
  const texturePaths = useMemo(() => {
    if (!model.textures) return [];
    return Object.values(model.textures).filter(path => !path.startsWith('#'));
  }, [model.textures]);

  // Load all textures
  // Note: In a real app, we'd need to resolve these paths to actual URLs
  const textures = useTexture(texturePaths.length > 0 ? texturePaths : ['/textures/placeholders/minecraft_cat_rig_green.png']);
  
  const textureLoader = (path: string) => {
    // This is a simple resolver. In a full implementation, 
    // we'd match the path to the loaded texture.
    if (Array.isArray(textures)) {
      const index = texturePaths.indexOf(path);
      return index !== -1 ? textures[index] : textures[0];
    }
    return textures as THREE.Texture;
  };

  const group = useMemo(() => {
    return parseMCBlockModel(model, textureLoader);
  }, [model, textures]);

  return (
    <primitive 
      object={group} 
      position={position} 
      rotation={[0, rotationY, 0]} 
      scale={[scale, scale, scale]} 
    />
  );
};
