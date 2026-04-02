import React, { useState, useEffect } from 'react';
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
}
