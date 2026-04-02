import { Project } from '../types';

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
};
