import React, { useState, useEffect, useRef } from 'react';
import { Project, Scene, Hotspot } from '../types';
import { ProjectService } from '../services/projectService';
import { Viewer3D } from './Viewer3D';
import { Viewer2D } from './Viewer2D';
import { clsx } from 'clsx';
import { 
  Save, 
  Plus, 
  Trash2, 
  Settings, 
  Image as ImageIcon, 
  Box, 
  RotateCw, 
  ChevronLeft,
  Download,
  Edit3,
  Link as LinkIcon,
  Info as InfoIcon,
  Upload,
  PlayCircle,
  Sun
} from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';

interface EditorProps {
  projectId: string;
  onBack: () => void;
}

export function Editor({ projectId, onBack }: EditorProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sceneUploadRef = useRef<HTMLInputElement>(null);
  const mediaUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = ProjectService.getProject(projectId);
    if (p) {
      setProject(p);
      setActiveSceneId(p.startSceneId || p.scenes[0]?.id || null);
    }
  }, [projectId]);

  const activeScene = project?.scenes.find(s => s.id === activeSceneId);

  const handleSave = () => {
    if (!project) return;
    setIsSaving(true);
    ProjectService.saveProject(project);
    setTimeout(() => {
      setIsSaving(false);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 500);
  };

  const addScene = (type: '360' | '2D' | '3D') => {
    if (!project) return;
    const newScene: Scene = {
      id: Math.random().toString(36).substr(2, 9),
      name: `New ${type} Scene`,
      type,
      assetUrl: type === '360' 
        ? 'https://picsum.photos/seed/tour1/2048/1024' 
        : type === '3D' 
          ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb'
          : 'https://picsum.photos/seed/tour2/800/600',
      hotspots: []
    };
    const updated = { ...project, scenes: [...project.scenes, newScene] };
    if (!updated.startSceneId) updated.startSceneId = newScene.id;
    setProject(updated);
    setActiveSceneId(newScene.id);
  };

  const updateSceneConfig = (config: Partial<Scene['config']>) => {
    if (!project || !activeSceneId) return;
    const updatedScenes = project.scenes.map(s => 
      s.id === activeSceneId ? { ...s, config: { ...s.config, ...config } } : s
    );
    setProject({ ...project, scenes: updatedScenes });
  };

  useEffect(() => {
    if (editingHotspot) {
      setIsPlacementMode(false);
    }
  }, [editingHotspot]);

  useEffect(() => {
    if (isPlacementMode) {
      setEditingHotspot(null);
    }
  }, [isPlacementMode]);

  const addHotspot = (pos: [number, number, number]) => {
    if (!project || !activeSceneId || !isPlacementMode) return;
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'info',
      position: pos,
      scale: 1,
      label: 'New Hotspot',
      content: 'Enter information here...'
    };
    
    const updatedScenes = project.scenes.map(s => {
      if (s.id === activeSceneId) {
        return { ...s, hotspots: [...s.hotspots, newHotspot] };
      }
      return s;
    });
    
    setProject({ ...project, scenes: updatedScenes });
    setEditingHotspot(newHotspot);
    setIsPlacementMode(false);
  };

  const updateHotspot = (updated: Hotspot) => {
    if (!project || !activeSceneId) return;
    const updatedScenes = project.scenes.map(s => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          hotspots: s.hotspots.map(h => h.id === updated.id ? updated : h)
        };
      }
      return s;
    });
    setProject({ ...project, scenes: updatedScenes });
    setEditingHotspot(null);
  };

  const deleteHotspot = (id: string) => {
    if (!project || !activeSceneId) return;
    const updatedScenes = project.scenes.map(s => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          hotspots: s.hotspots.filter(h => h.id !== id)
        };
      }
      return s;
    });
    setProject({ ...project, scenes: updatedScenes });
    setEditingHotspot(null);
  };

  const exportProject = async () => {
    if (!project) return;
    const zip = new JSZip();
    
    // 1. Project Data
    zip.file('project.json', JSON.stringify(project, null, 2));
    
    // 2. Metadata/README
    const readme = `OmniTour Project Bundle
=======================
Project Name: ${project.name}
Export Date: ${new Date().toLocaleString()}
Scenes: ${project.scenes.length}
Total Hotspots: ${project.scenes.reduce((acc, s) => acc + s.hotspots.length, 0)}

INSTRUCTIONS:
This bundle contains your virtual tour project data in 'project.json' AND the full source code for the OmniTour Builder.

To run locally:
1. Extract this ZIP file.
2. Ensure you have Node.js installed.
3. Run 'npm install' to install dependencies.
4. Run 'npm run dev' to start the development server.
5. Open the browser to the provided local URL.

Generated by OmniTour Builder.`;
    
    zip.file('README.txt', readme);
    
    // 3. Source Code Files
    // Root files
    zip.file('package.json', `{
  "name": "omnitour-bundle",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.5.0",
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "jszip": "^3.10.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.5.0",
    "three": "^0.183.2"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.183.1",
    "@vitejs/plugin-react": "^5.0.4",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}`);
    zip.file('vite.config.ts', `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});`);
    zip.file('tsconfig.json', `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}`);
    zip.file('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.name} - OmniTour</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

    // src/
    const src = zip.folder('src');
    src.file('main.tsx', `import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);`);
    src.file('App.tsx', `import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { Viewer } from './components/Viewer';

type ViewState = 
  | { type: 'dashboard' }
  | { type: 'editor'; projectId: string }
  | { type: 'viewer'; projectId: string };

export default function App() {
  const [view, setView] = useState<ViewState>({ type: 'dashboard' });

  return (
    <div className="w-full h-screen">
      {view.type === 'dashboard' && (
        <Dashboard 
          onEdit={(id) => setView({ type: 'editor', projectId: id })}
          onView={(id) => setView({ type: 'viewer', projectId: id })}
        />
      )}
      
      {view.type === 'editor' && (
        <Editor 
          projectId={view.projectId} 
          onBack={() => setView({ type: 'dashboard' })} 
        />
      )}

      {view.type === 'viewer' && (
        <Viewer 
          projectId={view.projectId} 
          onBack={() => setView({ type: 'dashboard' })} 
        />
      )}
    </div>
  );
}`);
    src.file('index.css', `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  body {
    @apply bg-neutral-950 text-neutral-100 antialiased;
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}`);
    src.file('types.ts', `export type SceneType = '360' | '2D' | '3D';

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
}`);

    const projectServiceCode = `import { Project } from '../types';

const STORAGE_KEY = 'omnitour_projects';

export const ProjectService = {
  getProjects: (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProject: (project: Project) => {
    const projects = ProjectService.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  deleteProject: (id: string) => {
    const projects = ProjectService.getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },

  getProject: (id: string): Project | undefined => {
    return ProjectService.getProjects().find(p => p.id === id);
  }
};`;

    const services = src.folder('services');
    services.file('projectService.ts', projectServiceCode);

    // src/components/
    const components = src.folder('components');
    
    // Dashboard.tsx
    components.file('Dashboard.tsx', `import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { ProjectService } from '../services/projectService';
import { Plus, Folder, Trash2, Play, Edit3, Clock, LayoutGrid, List, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface DashboardProps {
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

export function Dashboard({ onEdit, onView }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setProjects(ProjectService.getProjects());
  }, []);

  const createProject = () => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Untitled Tour',
      description: 'A new virtual tour project',
      scenes: [],
      startSceneId: '',
      createdAt: Date.now()
    };
    ProjectService.saveProject(newProject);
    onEdit(newProject.id);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      ProjectService.deleteProject(id);
      setProjects(ProjectService.getProjects());
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              OMNITOUR
            </h1>
            <p className="text-neutral-500 mt-1">Virtual Tour Studio</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-neutral-900 p-1 rounded-xl flex gap-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={clsx("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={clsx("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}
              >
                <List size={18} />
              </button>
            </div>
            <button 
              onClick={createProject}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>
        </header>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-900/20">
            <Folder size={64} className="text-neutral-800 mb-4" />
            <h2 className="text-xl font-bold text-neutral-400">No projects yet</h2>
            <p className="text-neutral-600 mb-8">Create your first virtual tour to get started</p>
            <button 
              onClick={createProject}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2"
            >
              <Plus size={18} /> Create Project
            </button>
          </div>
        ) : (
          <div className={clsx(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
          )}>
            <AnimatePresence mode="popLayout">
              {projects.map((project) => (
                <motion.div
                  layout
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={clsx(
                    "group relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden transition-all hover:border-neutral-700",
                    viewMode === 'list' && "flex items-center p-4"
                  )}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                        {project.thumbnail ? (
                          <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-700">
                            <RotateCw size={48} className="animate-pulse-slow" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                          <button 
                            onClick={() => onView(project.id)}
                            className="bg-white text-black p-4 rounded-full hover:scale-110 transition-transform"
                          >
                            <Play size={24} fill="currentColor" />
                          </button>
                          <button 
                            onClick={() => onEdit(project.id)}
                            className="bg-blue-600 text-white p-4 rounded-full hover:scale-110 transition-transform"
                          >
                            <Edit3 size={24} />
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1 truncate">{project.name}</h3>
                            <p className="text-neutral-500 text-sm line-clamp-2">{project.description}</p>
                          </div>
                          <button 
                            onClick={(e) => deleteProject(project.id, e)}
                            className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="mt-6 pt-6 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-md bg-neutral-800">{project.scenes.length} Scenes</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-neutral-800 rounded-xl flex-shrink-0 mr-4 flex items-center justify-center">
                        <Folder size={24} className="text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{project.name}</h3>
                        <p className="text-xs text-neutral-500 truncate">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button onClick={() => onView(project.id)} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"><Play size={18} /></button>
                        <button onClick={() => onEdit(project.id)} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"><Edit3 size={18} /></button>
                        <button onClick={(e) => deleteProject(project.id, e)} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}`);

    // Viewer.tsx
    components.file('Viewer.tsx', `import React, { useState, useEffect } from 'react';
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

      <div className="absolute inset-0 pointer-events-none flex flex-col">
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
}`);

    // Viewer2D.tsx
    components.file('Viewer2D.tsx', `import React, { useState, useRef } from 'react';
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
                left: h.position[0] + "%", 
                top: h.position[1] + "%",
                transform: "translate(-50%, -50%) scale(" + scale + ")"
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
}`);

    // Viewer3D.tsx
    components.file('Viewer3D.tsx', `import React, { Suspense, useState } from 'react';
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
        style={{ transform: "scale(" + scale + ")" }}
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
}`);

    // Editor.tsx (Simplified version for the bundle)
    components.file('Editor.tsx', `import React, { useState, useEffect, useRef } from 'react';
import { Project, Scene, Hotspot } from '../types';
import { ProjectService } from '../services/projectService';
import { Viewer3D } from './Viewer3D';
import { Viewer2D } from './Viewer2D';
import { clsx } from 'clsx';
import { 
  Save, Plus, Trash2, Settings, Image as ImageIcon, Box, RotateCw, ChevronLeft,
  Download, Edit3, Link as LinkIcon, Info as InfoIcon, Upload, PlayCircle, Sun
} from 'lucide-react';

interface EditorProps {
  projectId: string;
  onBack: () => void;
}

export function Editor({ projectId, onBack }: EditorProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  
  useEffect(() => {
    const p = ProjectService.getProject(projectId);
    if (p) {
      setProject(p);
      setActiveSceneId(p.startSceneId || p.scenes[0]?.id || null);
    }
  }, [projectId]);

  const saveProject = () => {
    if (!project) return;
    setIsSaving(true);
    ProjectService.saveProject(project);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const activeScene = project?.scenes.find(s => s.id === activeSceneId);

  if (!project) return null;

  return (
    <div className="flex h-screen bg-neutral-950 text-white font-sans">
      {/* Sidebar */}
      <div className="w-80 border-r border-neutral-800 flex flex-col bg-neutral-900/50 backdrop-blur-xl">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button onClick={saveProject} className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-blue-400">
              <Save size={20} className={clsx(isSaving && "animate-spin")} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 px-2">Scenes</h3>
            <div className="space-y-2">
              {project.scenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => setActiveSceneId(scene.id)}
                  className={clsx(
                    "w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left group",
                    activeSceneId === scene.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "hover:bg-neutral-800 text-neutral-400"
                  )}
                >
                  {scene.type === '360' ? <RotateCw size={18} /> : scene.type === '3D' ? <Box size={18} /> : <ImageIcon size={18} />}
                  <span className="font-medium truncate flex-1">{scene.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {activeScene ? (
          activeScene.type === '2D' ? (
            <Viewer2D scene={activeScene} isEditor />
          ) : (
            <Viewer3D scene={activeScene} isEditor />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-700">
            Select a scene to start editing
          </div>
        )}
      </div>
    </div>
  );
}`);
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_bundle.zip`;
    link.click();
    
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#ffffff', '#60a5fa']
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project || !activeSceneId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updatedScenes = project.scenes.map(s => {
        if (s.id === activeSceneId) {
          return { ...s, assetUrl: base64 };
        }
        return s;
      });
      setProject({ ...project, scenes: updatedScenes });
    };
    reader.readAsDataURL(file);
  };

  const handleSceneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newScene: Scene = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Uploaded 360 Scene`,
        type: '360',
        assetUrl: base64,
        hotspots: []
      };
      const updated = { ...project, scenes: [...project.scenes, newScene] };
      if (!updated.startSceneId) updated.startSceneId = newScene.id;
      setProject(updated);
      setActiveSceneId(newScene.id);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingHotspot) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditingHotspot({
        ...editingHotspot,
        mediaUrl: base64,
        mediaType: file.type.startsWith('audio/') ? 'audio' : 'image'
      });
    };
    reader.readAsDataURL(file);
  };

  if (!project) return null;

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-72 border-r border-neutral-800 flex flex-col bg-neutral-900/50 backdrop-blur-xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold truncate px-2">{project.name}</h2>
          <button onClick={handleSave} disabled={isSaving} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-blue-400">
            <Save className={clsx("w-5 h-5", isSaving && "animate-spin")} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {editingHotspot ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => setEditingHotspot(null)} 
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-400">Edit Hotspot</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Label</label>
                  <input 
                    value={editingHotspot.label}
                    onChange={e => setEditingHotspot({ ...editingHotspot, label: e.target.value })}
                    className="w-full bg-neutral-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Scale ({editingHotspot.scale || 1}x)</label>
                  <input 
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={editingHotspot.scale || 1}
                    onChange={e => setEditingHotspot({ ...editingHotspot, scale: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setEditingHotspot({ ...editingHotspot, type: 'info' })}
                      className={clsx(
                        "p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                        editingHotspot.type === 'info' ? "bg-orange-600/20 border-orange-500 text-orange-400" : "bg-neutral-800 border-transparent text-neutral-400"
                      )}
                    >
                      <InfoIcon size={18} /> <span className="text-[10px] font-bold">Info</span>
                    </button>
                    <button 
                      onClick={() => setEditingHotspot({ ...editingHotspot, type: 'link' })}
                      className={clsx(
                        "p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                        editingHotspot.type === 'link' ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-neutral-800 border-transparent text-neutral-400"
                      )}
                    >
                      <LinkIcon size={18} /> <span className="text-[10px] font-bold">Link</span>
                    </button>
                    <button 
                      onClick={() => setEditingHotspot({ ...editingHotspot, type: 'video' })}
                      className={clsx(
                        "p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                        editingHotspot.type === 'video' ? "bg-red-600/20 border-red-500 text-red-400" : "bg-neutral-800 border-transparent text-neutral-400"
                      )}
                    >
                      <PlayCircle size={18} /> <span className="text-[10px] font-bold">Video</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Animation</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['none', 'pulse', 'bounce'].map((anim) => (
                      <button
                        key={anim}
                        onClick={() => setEditingHotspot({ ...editingHotspot, animation: anim as any })}
                        className={clsx(
                          "p-2 rounded-lg border text-[10px] uppercase font-bold transition-all",
                          editingHotspot.animation === anim ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-neutral-800 border-transparent text-neutral-500"
                        )}
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </div>

                {editingHotspot.type === 'info' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Content</label>
                      <textarea 
                        value={editingHotspot.content}
                        onChange={e => setEditingHotspot({ ...editingHotspot, content: e.target.value })}
                        className="w-full bg-neutral-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Media</label>
                      <div className="flex gap-2">
                        <input type="file" ref={mediaUploadRef} className="hidden" onChange={handleMediaUpload} accept="image/*,audio/*" />
                        <button 
                          onClick={() => mediaUploadRef.current?.click()}
                          className="flex-1 bg-neutral-800 hover:bg-neutral-700 p-3 rounded-xl border border-neutral-700 flex items-center justify-center gap-2 text-xs"
                        >
                          <Upload size={14} /> {editingHotspot.mediaUrl ? 'Change' : 'Upload'}
                        </button>
                        {editingHotspot.mediaUrl && (
                          <button 
                            onClick={() => setEditingHotspot({ ...editingHotspot, mediaUrl: undefined, mediaType: undefined })}
                            className="p-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : editingHotspot.type === 'link' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Link Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setEditingHotspot({ ...editingHotspot, targetUrl: undefined })}
                          className={clsx(
                            "p-2 rounded-lg border text-[10px] uppercase font-bold transition-all",
                            !editingHotspot.targetUrl ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-neutral-800 border-transparent text-neutral-500"
                          )}
                        >
                          Scene
                        </button>
                        <button 
                          onClick={() => setEditingHotspot({ ...editingHotspot, targetUrl: editingHotspot.targetUrl || 'https://' })}
                          className={clsx(
                            "p-2 rounded-lg border text-[10px] uppercase font-bold transition-all",
                            editingHotspot.targetUrl ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-neutral-800 border-transparent text-neutral-500"
                          )}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    {!editingHotspot.targetUrl ? (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Target Scene</label>
                        <select 
                          value={editingHotspot.targetSceneId}
                          onChange={e => setEditingHotspot({ ...editingHotspot, targetSceneId: e.target.value })}
                          className="w-full bg-neutral-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Select...</option>
                          {project.scenes.filter(s => s.id !== activeSceneId).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">External URL</label>
                        <input 
                          value={editingHotspot.targetUrl}
                          onChange={e => setEditingHotspot({ ...editingHotspot, targetUrl: e.target.value })}
                          placeholder="https://example.com"
                          className="w-full bg-neutral-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">YouTube URL</label>
                    <input 
                      value={editingHotspot.targetUrl}
                      onChange={e => setEditingHotspot({ ...editingHotspot, targetUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full bg-neutral-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => deleteHotspot(editingHotspot.id)}
                    className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 p-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                  <button 
                    onClick={() => updateHotspot(editingHotspot)}
                    className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors font-bold uppercase text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeScene && (
                <div className="p-6 border-t border-neutral-800">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4 flex items-center gap-2">
                    <Settings size={14} /> Scene Settings
                  </h3>
                  
                  <div className="space-y-4">
                    {activeScene.type === '360' && (
                      <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                        <div className="flex items-center gap-2">
                          <RotateCw size={16} className="text-blue-400" />
                          <span className="text-sm font-medium">Auto-rotate</span>
                        </div>
                        <button 
                          onClick={() => updateSceneConfig({ autoRotate: !activeScene.config?.autoRotate })}
                          className={clsx(
                            "w-10 h-5 rounded-full transition-all relative",
                            activeScene.config?.autoRotate ? "bg-blue-600" : "bg-neutral-600"
                          )}
                        >
                          <div className={clsx(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                            activeScene.config?.autoRotate ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                    )}

                    {activeScene.type === '3D' && (
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                          <Sun size={12} /> Environment
                        </label>
                        <select 
                          value={activeScene.config?.environment || 'city'}
                          onChange={e => updateSceneConfig({ environment: e.target.value as any })}
                          className="w-full bg-neutral-800 border-none rounded-xl p-2 text-xs focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="city">City</option>
                          <option value="sunset">Sunset</option>
                          <option value="night">Night</option>
                          <option value="warehouse">Warehouse</option>
                          <option value="forest">Forest</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Scenes</h3>
                  <div className="flex gap-1">
                    <input type="file" ref={sceneUploadRef} className="hidden" onChange={handleSceneUpload} accept="image/*" />
                    <button onClick={() => sceneUploadRef.current?.click()} title="Upload & Add 360°" className="p-1 hover:bg-neutral-800 rounded text-blue-400"><Upload size={16} /></button>
                    <button onClick={() => addScene('360')} title="Add 360°" className="p-1 hover:bg-neutral-800 rounded text-blue-400"><RotateCw size={16} /></button>
                    <button onClick={() => addScene('3D')} title="Add 3D" className="p-1 hover:bg-neutral-800 rounded text-purple-400"><Box size={16} /></button>
                    <button onClick={() => addScene('2D')} title="Add 2D" className="p-1 hover:bg-neutral-800 rounded text-green-400"><ImageIcon size={16} /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  {project.scenes.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSceneId(s.id)}
                      className={clsx(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                        activeSceneId === s.id ? "bg-blue-600/20 border border-blue-500/50 text-blue-400" : "hover:bg-neutral-800 text-neutral-400"
                      )}
                    >
                      {s.type === '360' && <RotateCw size={18} />}
                      {s.type === '3D' && <Box size={18} />}
                      {s.type === '2D' && <ImageIcon size={18} />}
                      <span className="flex-1 truncate text-sm font-medium">{s.name}</span>
                      {project.startSceneId === s.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {activeScene && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Hotspots ({activeScene.hotspots.length})</h3>
                    <button 
                      onClick={() => setIsPlacementMode(!isPlacementMode)}
                      className={clsx(
                        "p-1 rounded transition-colors",
                        isPlacementMode ? "bg-blue-600 text-white" : "hover:bg-neutral-800 text-blue-400"
                      )}
                      title="Place Hotspot"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeScene.hotspots.map(h => (
                      <button
                        key={h.id}
                        onClick={() => setEditingHotspot(h)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800 text-neutral-400 text-left group"
                      >
                        {h.type === 'link' ? <LinkIcon size={16} /> : h.type === 'video' ? <PlayCircle size={16} /> : <InfoIcon size={16} />}
                        <span className="flex-1 truncate text-sm">{h.label}</span>
                        <Edit3 size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-neutral-800">
          <button 
            onClick={exportProject}
            className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 p-3 rounded-xl transition-colors text-sm font-medium"
          >
            <Download size={18} />
            Download Bundle
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex flex-col">
        {activeScene ? (
          <div className="flex-1 relative">
            {activeScene.type === '2D' ? (
              <Viewer2D 
                scene={activeScene} 
                isEditor={isPlacementMode} 
                onAddHotspot={addHotspot}
                onEditHotspot={setEditingHotspot}
                onNavigate={setActiveSceneId}
              />
            ) : (
              <Viewer3D 
                scene={activeScene} 
                isEditor={isPlacementMode} 
                onAddHotspot={addHotspot}
                onEditHotspot={setEditingHotspot}
                onNavigate={setActiveSceneId}
              />
            )}
            
            {/* Scene Header */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
              <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 pointer-events-auto flex items-center gap-4">
                <div className="flex-1">
                  <input 
                    value={activeScene.name}
                    onChange={(e) => {
                      const updated = project.scenes.map(s => s.id === activeScene.id ? { ...s, name: e.target.value } : s);
                      setProject({ ...project, scenes: updated });
                    }}
                    className="bg-transparent border-none focus:ring-0 text-xl font-bold p-0 w-48"
                  />
                  <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 uppercase tracking-tighter">{activeScene.type}</span>
                    <span>{activeScene.hotspots.length} Hotspots</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept={activeScene.type === '3D' ? '.glb,.gltf' : 'image/*'}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                    title="Upload Asset"
                  >
                    <Upload size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Delete this scene?')) {
                        const updated = project.scenes.filter(s => s.id !== activeSceneId);
                        setProject({ ...project, scenes: updated });
                        setActiveSceneId(updated[0]?.id || null);
                      }
                    }}
                    className="p-3 bg-red-600/20 hover:bg-red-600/30 rounded-xl transition-colors text-red-400"
                    title="Delete Scene"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-4">
            <RotateCw size={48} className="opacity-20" />
            <p>Select or add a scene to begin editing</p>
          </div>
        )}

        {/* Hotspot Editor Modal removed - moved to sidebar */}
      </div>
    </div>
  );
}
