"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Plus, Trash2, Edit2, Users as UsersIcon, X } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', members: [] });
  
  // Delete confirm state
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Manager') {
      fetchProjects();
      fetchUsers();
    }
  }, [user]);

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        members: project.members?.map(m => m._id) || []
      });
    } else {
      setEditingProject(null);
      setFormData({ name: '', description: '', members: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', members: [] });
  };

  const handleToggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const url = editingProject 
      ? `http://localhost:5000/api/projects/${editingProject._id}`
      : 'http://localhost:5000/api/projects';
      
    const method = editingProject ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        handleCloseModal();
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (id) => {
    setProjectToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== 'Manager') {
    return <div className="p-8 text-center text-red-500">Access Denied. Managers only.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Projects</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove project categories for team reports.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="h-10 px-4 bg-primary text-primary-foreground rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="h-24 bg-card rounded-xl animate-pulse col-span-2"></div>
        ) : projects.length === 0 ? (
          <div className="col-span-2 bg-card p-12 text-center rounded-xl border border-border border-dashed">
            <FolderKanban size={48} className="mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">Create your first project to start tracking reports.</p>
            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
              Add New Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="bg-card p-5 rounded-xl border border-border flex justify-between items-start group hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg h-fit">
                  <FolderKanban size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg leading-tight mb-1">{project.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{project.description || 'No description provided'}</p>
                  <div className="flex flex-wrap gap-1">
                    {project.members && project.members.length > 0 ? (
                      project.members.map(member => (
                        <span key={member._id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          <UsersIcon size={12} />
                          {member.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No members assigned</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-card via-card to-transparent pl-6">
                <button onClick={() => handleOpenModal(project)} className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteClick(project._id)} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
      />

      {/* Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-all"
                    placeholder="e.g. Q3 Marketing Campaign"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(Optional)</span></label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-all resize-none"
                    placeholder="Brief description of the project"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Assign Team Members</label>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {formData.members.length} selected
                    </span>
                  </div>
                  <div className="border border-border rounded-md overflow-hidden bg-background max-h-[160px] overflow-y-auto">
                    {users.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No users available</div>
                    ) : (
                      users.map(u => (
                        <label key={u._id} className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer border-b border-border last:border-0 transition-colors">
                          <input 
                            type="checkbox"
                            checked={formData.members.includes(u._id)}
                            onChange={() => handleToggleMember(u._id)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none mb-1">{u.name}</span>
                            <span className="text-xs text-muted-foreground leading-none">{u.email}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-secondary hover:text-secondary-foreground transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
