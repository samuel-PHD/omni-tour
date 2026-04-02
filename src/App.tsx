import React, { useState } from 'react';
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
}
