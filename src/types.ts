export type SceneType = '360' | '2D' | '3D';

export interface Hotspot {
  id: string;
  type: 'link' | 'info' | 'video';
  position: [number, number, number]; // x, y, z
  scale?: number;
  label: string;
  targetSceneId?: string; // For internal link
  targetUrl?: string; // For external link or video URL
  content?: string; // For info text
  mediaUrl?: string; // For image or audio
  mediaType?: 'image' | 'audio';
  animation?: 'none' | 'pulse' | 'bounce';
}

export interface Scene {
  id: string;
  name: string;
  type: SceneType;
  assetUrl: string;
  hotspots: Hotspot[];
  config?: {
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    environment?: 'city' | 'sunset' | 'night' | 'warehouse' | 'forest';
    transition?: 'fade' | 'zoom' | 'none';
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  scenes: Scene[];
  startSceneId: string;
  createdAt: number;
}
