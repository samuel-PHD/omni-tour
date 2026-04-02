import React, { useState, useEffect } from 'react';
import { Project, Scene, Hotspot } from '../types';
import { ProjectService } from '../services/projectService';
import { Viewer3D } from './Viewer3D';
import { Viewer2D } from './Viewer2D';
import { ChevronLeft, Maximize2, Info, X, ChevronRight, ChevronDown, Share2, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface ViewerProps {
  projectId: string;
  onBack: () => void;
}

export function Viewer({ projectId, onBack }: ViewerProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [showSceneList, setShowSceneList] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const p = ProjectService.getProject(projectId);
    if (p) {
      setProject(p);
      setActiveSceneId(p.startSceneId || p.scenes[0]?.id || null);
    }
  }, [projectId]);

  const handleNavigate = (sceneId: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSceneId(sceneId);
      setIsTransitioning(false);
    }, 500);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Project link copied to clipboard!');
  };

  const activeScene = project?.scenes.find(s => s.id === activeSceneId);

  if (!project || !activeScene) return null;

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden">
      {/* Main Viewport */}
      <div className="w-full h-full">
        <AnimatePresence mode="wait">
          {!isTransitioning && activeScene && (
            <motion.div
              key={activeScene.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              {activeScene.type === '2D' ? (
                <Viewer2D 
                  scene={activeScene} 
                  onNavigate={handleNavigate}
                  onShowInfo={setActiveHotspot}
                />
              ) : (
                <Viewer3D 
                  scene={activeScene} 
                  onNavigate={handleNavigate}
                  onShowInfo={setActiveHotspot}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {/* Top Bar */}
        <div className="p-6 flex justify-between items-start">
          <div className="flex gap-4 pointer-events-auto">
            <button 
              onClick={onBack}
              className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 hover:bg-black/60 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
              <h2 className="text-lg font-bold">{project.name}</h2>
              <p className="text-xs text-neutral-400">{activeScene.name}</p>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto">
             <button 
               onClick={handleShare}
               className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 hover:bg-black/60 transition-all"
               title="Share Project"
             >
                <Share2 size={24} />
             </button>
             <button className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 hover:bg-black/60 transition-all">
                <Maximize2 size={24} />
             </button>
          </div>
        </div>

        {/* Bottom Bar / Scene List */}
        <div className="mt-auto p-6 flex flex-col items-center gap-4">
          <AnimatePresence>
            {showSceneList && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 w-full max-w-4xl pointer-events-auto overflow-x-auto flex gap-4 no-scrollbar"
              >
                {project.scenes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSceneId(s.id)}
                    className={clsx(
                      "flex-shrink-0 w-32 aspect-video rounded-xl overflow-hidden relative group transition-all",
                      activeSceneId === s.id ? "ring-2 ring-blue-500 scale-105" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={s.assetUrl} className="w-full h-full object-cover" alt={s.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold truncate">{s.name}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setShowSceneList(!showSceneList)}
            className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2 hover:bg-black/60 transition-all text-sm font-medium"
          >
            {showSceneList ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Scenes
          </button>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 w-full max-w-lg rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "p-2 rounded-lg",
                    activeHotspot.type === 'video' ? "bg-red-600/20 text-red-400" : "bg-orange-600/20 text-orange-400"
                  )}>
                    {activeHotspot.type === 'video' ? <PlayCircle size={20} /> : <Info size={20} />}
                  </div>
                  <h3 className="text-lg font-bold">{activeHotspot.label}</h3>
                </div>
                <button 
                  onClick={() => setActiveHotspot(null)}
                  className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                {activeHotspot.type === 'video' && activeHotspot.targetUrl && (
                  <div className="w-full aspect-video bg-black">
                    <iframe 
                      src={activeHotspot.targetUrl.replace('watch?v=', 'embed/')} 
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                  </div>
                )}

                {activeHotspot.mediaUrl && (
                  <div className="w-full bg-black flex items-center justify-center">
                    {activeHotspot.mediaType === 'audio' ? (
                      <div className="p-12 w-full">
                        <audio controls className="w-full" src={activeHotspot.mediaUrl} />
                      </div>
                    ) : (
                      <img 
                        src={activeHotspot.mediaUrl} 
                        className="max-w-full h-auto object-contain" 
                        alt={activeHotspot.label}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                )}
                
                <div className="p-8 text-neutral-300 leading-relaxed">
                  {activeHotspot.content}
                </div>
              </div>

              <div className="p-6 bg-neutral-950/50 flex justify-end">
                <button 
                  onClick={() => setActiveHotspot(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 px-6 py-2 rounded-xl transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
