import React, { useState, useRef, useEffect } from 'react';
import { Scene, Hotspot } from '../types';
import { PlayCircle, Info, ArrowRightCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Viewer2DProps {
  scene: Scene;
  onNavigate?: (sceneId: string) => void;
  onShowInfo?: (hotspot: Hotspot) => void;
  isEditor?: boolean;
  onAddHotspot?: (pos: [number, number, number]) => void;
  onEditHotspot?: (h: Hotspot) => void;
}

export function Viewer2D({ scene, onNavigate, onShowInfo, isEditor, onAddHotspot, onEditHotspot }: Viewer2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditor || !onAddHotspot || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onAddHotspot([x, y, 0]);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900 p-8 overflow-hidden">
      <div 
        ref={containerRef}
        className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden cursor-crosshair"
        onClick={handleImageClick}
      >
        <img 
          src={scene.assetUrl} 
          className="max-w-full max-h-full object-contain pointer-events-none" 
          alt={scene.name} 
        />

        {scene.hotspots.map((h) => {
          const scale = h.scale || 1;
          return (
            <div
              key={h.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
              style={{ 
                left: `${h.position[0]}%`, 
                top: `${h.position[1]}%`,
                transform: `translate(-50%, -50%) scale(${scale})`
              }}
              onMouseEnter={() => setHoveredHotspotId(h.id)}
              onMouseLeave={() => setHoveredHotspotId(null)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditor && onEditHotspot) {
                    onEditHotspot(h);
                    return;
                  }
                  if (h.type === 'link') {
                    if (h.targetUrl) {
                      window.open(h.targetUrl, '_blank');
                    } else if (h.targetSceneId) {
                      onNavigate?.(h.targetSceneId);
                    }
                  }
                  if (h.type === 'info' || h.type === 'video') onShowInfo?.(h);
                }}
                className={clsx(
                  "p-2 rounded-full transition-all duration-300 shadow-lg",
                  h.type === 'link' ? "bg-blue-600 hover:bg-blue-500" : 
                  h.type === 'video' ? "bg-red-600 hover:bg-red-500" : "bg-orange-600 hover:bg-orange-500",
                  hoveredHotspotId === h.id ? "scale-125" : "scale-100",
                  h.animation === 'pulse' && "animate-pulse",
                  h.animation === 'bounce' && "animate-bounce"
                )}
              >
                {h.type === 'link' ? (
                  <ArrowRightCircle className="w-6 h-6 text-white" />
                ) : h.type === 'video' ? (
                  <PlayCircle className="w-6 h-6 text-white" />
                ) : (
                  <Info className="w-6 h-6 text-white" />
                )}
              </button>

              {(hoveredHotspotId === h.id || isEditor) && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap pointer-events-none z-20">
                  {h.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isEditor && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md px-6 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl animate-bounce pointer-events-none border border-blue-400 z-50">
          PLACEMENT MODE: Click on the image to add a hotspot
        </div>
      )}
    </div>
  );
}
