import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, useTexture, Html, Gltf, Environment, ContactShadows, Stage } from '@react-three/drei';
import * as THREE from 'three';
import { Scene, Hotspot } from '../types';
import { PlayCircle, Info, ArrowRightCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface PanoramaProps {
  url: string;
  onAddHotspot?: (pos: [number, number, number]) => void;
}

function Panorama({ url, onAddHotspot }: PanoramaProps) {
  const texture = useTexture(url);
  return (
    <Sphere 
      args={[500, 60, 40]} 
      scale={[-1, 1, 1]}
      onClick={(e) => {
        if (onAddHotspot) {
          const point = e.point;
          onAddHotspot([point.x, point.y, point.z]);
        }
      }}
    >
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
}

interface HotspotMarkerProps {
  hotspot: Hotspot;
  onNavigate?: (sceneId: string) => void;
  onShowInfo?: (hotspot: Hotspot) => void;
  isEditor?: boolean;
  onEdit?: (h: Hotspot) => void;
}

function HotspotMarker({ hotspot, onNavigate, onShowInfo, isEditor, onEdit }: HotspotMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const scale = hotspot.scale || 1;

  return (
    <Html position={hotspot.position} center>
      <div 
        className="group relative flex items-center justify-center pointer-events-auto"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ transform: `scale(${scale})` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isEditor && onEdit) {
              onEdit(hotspot);
              return;
            }
            if (hotspot.type === 'link') {
              if (hotspot.targetUrl) {
                window.open(hotspot.targetUrl, '_blank');
              } else if (hotspot.targetSceneId) {
                onNavigate?.(hotspot.targetSceneId);
              }
            }
            if (hotspot.type === 'info' || hotspot.type === 'video') onShowInfo?.(hotspot);
          }}
          className={clsx(
            "p-2 rounded-full transition-all duration-300 shadow-lg",
            hotspot.type === 'link' ? "bg-blue-600 hover:bg-blue-500" : 
            hotspot.type === 'video' ? "bg-red-600 hover:bg-red-500" : "bg-orange-600 hover:bg-orange-500",
            hovered ? "scale-125" : "scale-100",
            hotspot.animation === 'pulse' && "animate-pulse",
            hotspot.animation === 'bounce' && "animate-bounce"
          )}
        >
          {hotspot.type === 'link' ? (
            <ArrowRightCircle className="w-6 h-6 text-white" />
          ) : hotspot.type === 'video' ? (
            <PlayCircle className="w-6 h-6 text-white" />
          ) : (
            <Info className="w-6 h-6 text-white" />
          )}
        </button>
        
        {(hovered || isEditor) && (
          <div className="absolute top-full mt-2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
            {hotspot.label}
          </div>
        )}
      </div>
    </Html>
  );
}

interface Viewer3DProps {
  scene: Scene;
  onNavigate?: (sceneId: string) => void;
  onShowInfo?: (hotspot: Hotspot) => void;
  isEditor?: boolean;
  onAddHotspot?: (pos: [number, number, number]) => void;
  onEditHotspot?: (h: Hotspot) => void;
}

export function Viewer3D({ scene, onNavigate, onShowInfo, isEditor, onAddHotspot, onEditHotspot }: Viewer3DProps) {
  const autoRotate = scene.config?.autoRotate || false;
  const autoRotateSpeed = scene.config?.autoRotateSpeed || 0.5;
  const environment = scene.config?.environment || 'city';

  return (
    <div className="w-full h-full bg-neutral-900 relative">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <OrbitControls 
          enableZoom={scene.type !== '360'} 
          enablePan={scene.type !== '360'}
          rotateSpeed={-0.5}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
        />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {scene.type === '360' && (
          <Suspense fallback={null}>
            <Panorama url={scene.assetUrl} onAddHotspot={isEditor ? onAddHotspot : undefined} />
          </Suspense>
        )}

        {scene.type === '3D' && (
          <Suspense fallback={null}>
            <Stage environment={environment} intensity={0.5}>
               <Gltf 
                src={scene.assetUrl} 
                position={[0, 0, 0]} 
                onClick={(e) => {
                  if (isEditor && onAddHotspot) {
                    const point = e.point;
                    onAddHotspot([point.x, point.y, point.z]);
                  }
                }}
              />
            </Stage>
            <Environment preset={environment} />
            <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          </Suspense>
        )}

        {scene.hotspots.map(h => (
          <HotspotMarker 
            key={h.id} 
            hotspot={h} 
            onNavigate={onNavigate} 
            onShowInfo={onShowInfo}
            isEditor={isEditor}
            onEdit={onEditHotspot}
          />
        ))}
      </Canvas>

      {isEditor && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md px-6 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl animate-bounce pointer-events-none border border-blue-400">
          PLACEMENT MODE: Click on the {scene.type === '360' ? 'panorama' : 'model'} to add a hotspot
        </div>
      )}
    </div>
  );
}
