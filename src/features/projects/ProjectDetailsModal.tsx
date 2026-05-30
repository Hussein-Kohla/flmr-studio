import React, { useState, useEffect } from 'react';
import { X, Edit2, Calendar as CalendarIcon, FileText, CheckCircle2, Clock, FolderGit2, Plus, Trash2, Check, ListTodo } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDate, cn, calculateProjectProgress } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
}

const STATUS_META: Record<string, { label: string; variant: 'muted' | 'info' | 'warning' | 'brand' | 'success' }> = {
  draft:     { label: 'Draft',      variant: 'muted'   },
  in_review: { label: 'In Review',  variant: 'info'    },
  revision:  { label: 'Revision',   variant: 'warning' },
  approved:  { label: 'Approved',   variant: 'brand'   },
  done:      { label: 'Done',       variant: 'success' },
};

export function ProjectDetailsModal({ isOpen, onClose, project }: ProjectDetailsModalProps) {
  const { token } = useAuth();
  const updateProject = useMutation(api.projects.updateProject);
  const updateProjectSteps = useMutation(api.projects.updateProjectSteps);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    deadlineDate: '',
  });

  const hasCelebrated = React.useRef(false);

  React.useEffect(() => {
    if (project && !isEditing) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        status: project.status || 'draft',
        deadlineDate: (() => {
          if (!project.deadline) return '';
          try {
            const d = new Date(project.deadline);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
          } catch (e) {
            return '';
          }
        })(),
      });
    }
  }, [project?._id, isEditing]);

  const steps = project?.steps || [];
  const progress = calculateProjectProgress(project);

  useEffect(() => {
    let interval: any;
    if (progress === 100 && project?.status === 'done') {
      if (!hasCelebrated.current) {
        hasCelebrated.current = true;
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          try {
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          } catch (e) {
            console.error("Confetti error:", e);
          }
        }, 250);
      }
    } else {
      hasCelebrated.current = false;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progress, project?.status]);

  if (!isOpen || !project) return null;

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await updateProject({
        token,
        projectId: project._id,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        deadline: formData.deadlineDate ? new Date(formData.deadlineDate).getTime() : undefined,
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!token || !newStepTitle.trim()) return;
    const steps = project.steps || [];
    const newSteps = [
      ...steps,
      { id: Math.random().toString(36).substr(2, 9), title: newStepTitle.trim(), isCompleted: false }
    ];
    await updateProjectSteps({ token, projectId: project._id, steps: newSteps });
    setNewStepTitle('');
  };

  const toggleStep = async (stepId: string) => {
    if (!token) return;
    const newSteps = project.steps.map((s: any) => 
      s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    await updateProjectSteps({ token, projectId: project._id, steps: newSteps });
  };

  const deleteStep = async (stepId: string) => {
    if (!token) return;
    const newSteps = project.steps.filter((s: any) => s.id !== stepId);
    await updateProjectSteps({ token, projectId: project._id, steps: newSteps });
  };

  const handleToggleMaster = async () => {
    if (!token) return;
    const isDone = project.status === 'done';
    const newStatus = isDone ? 'approved' : 'done';
    
    // If marking as done, also complete all existing steps for consistency
    if (newStatus === 'done' && project.steps?.length > 0) {
      const updatedSteps = project.steps.map((s: any) => ({ ...s, isCompleted: true }));
      await updateProjectSteps({ token, projectId: project._id, steps: updatedSteps });
    }
    
    await updateProject({
      token,
      projectId: project._id,
      status: newStatus,
    });
  };

  const meta = STATUS_META[project.status] || STATUS_META['draft'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" className="p-0 border-none bg-transparent shadow-none max-w-4xl overflow-visible">
      <div className="w-full bg-[var(--bg-card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border-subtle)] flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-6 md:p-8 relative shrink-0">
          <div className="absolute top-4 right-4 flex gap-2">
            {isEditing ? (
              <button disabled={isSaving} onClick={handleSave} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-bold transition-colors shadow-lg">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-md transition-colors flex items-center gap-2 px-4">
                <Edit2 size={18} /> <span className="font-medium text-sm">Edit</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-md transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 mt-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand to-blue-500 flex items-center justify-center text-white shadow-xl border border-white/20 overflow-hidden shrink-0">
              <FolderGit2 size={36} />
            </div>
            
            <div className="text-white text-center md:text-left flex-1 w-full">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                {isEditing ? (
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="text-3xl font-bold bg-black/20 border border-white/20 rounded-xl px-4 py-2 outline-none focus:border-white w-full transition-colors text-center md:text-left" placeholder="Project Title" />
                ) : (
                  <h2 className="text-3xl font-bold">{project.title}</h2>
                )}
                
                {!isEditing && (
                  <Badge variant={meta.variant} className="border-none bg-white/20 backdrop-blur-md text-white whitespace-nowrap mt-2 md:mt-0">
                    {meta.label}
                  </Badge>
                )}
              </div>

              {/* Progress Bar in Header */}
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-[10px] text-white/70 font-black uppercase tracking-widest mb-1.5">
                  <span>Production Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[var(--bg-surface)]">
          <div className="grid md:grid-cols-2 gap-6">
            
            <Card className="p-5 shadow-sm md:col-span-2">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={18} /> Project Description
              </h3>
              {isEditing ? (
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full h-32 bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--color-brand)] rounded-xl p-4 text-sm outline-none resize-none transition-colors"
                  placeholder="Enter project details, objectives, requirements..."
                />
              ) : (
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {project.description || "No description provided for this project. Click edit to add one."}
                </p>
              )}
            </Card>

            <Card className="p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <ListTodo size={18} /> Project Steps & Progress
              </h3>
              
              <div className="space-y-3 mb-6 pr-2">
                {steps.length > 0 && (
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {steps.map((step: any) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl group/step transition-all hover:border-[var(--color-brand)]/30">
                        <button 
                          onClick={() => toggleStep(step.id)}
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                            step.isCompleted 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-[var(--border-strong)] text-transparent hover:border-[var(--color-brand)]"
                          )}
                        >
                          <Check size={12} strokeWidth={4} />
                        </button>
                        <span className={cn(
                          "text-sm font-medium flex-1 truncate transition-all",
                          step.isCompleted ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
                        )}>
                          {step.title}
                        </span>
                        <button 
                          onClick={() => deleteStep(step.id)}
                          className="opacity-0 group-hover/step:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className={cn(
                  "flex flex-col items-center gap-4 py-6 rounded-2xl transition-all duration-500",
                  steps.length === 0 ? "border-2 border-dashed border-[var(--border-subtle)] bg-white/[0.02]" : "bg-white/[0.01] border border-[var(--border-subtle)]/50"
                )}>
                  {steps.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">No steps added yet</p>
                  )}
                  <button 
                    onClick={handleToggleMaster}
                    className={cn(
                      "w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 group/master",
                      project.status === 'done'
                        ? "bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                        : "bg-white/5 border-white/10 hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-brand)]/5"
                    )}
                  >
                    {project.status === 'done' ? (
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    ) : (
                      <Check size={32} className="text-white/10 group-hover/master:text-[var(--color-brand)]/50 transition-colors" />
                    )}
                  </button>
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter text-center">
                    {project.status === 'done' ? 'Project Completed!' : 'Mark entire project as done'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newStepTitle}
                  onChange={e => setNewStepTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddStep()}
                  placeholder="Add a new step..."
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--color-brand)] transition-colors"
                />
                <button 
                  onClick={handleAddStep}
                  disabled={!newStepTitle.trim()}
                  className="p-2 bg-[var(--color-brand)] hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            </Card>

            <Card className="p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <CalendarIcon size={18} /> Timeline & Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-muted)]">Deadline</p>
                    {isEditing ? (
                      <div className="mt-2">
                        <DatePicker 
                          value={formData.deadlineDate}
                          onChange={date => setFormData({...formData, deadlineDate: date})}
                        />
                      </div>
                    ) : (
                      <p className={`text-sm font-medium ${project.deadline ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                        {project.deadline ? formatDate(project.deadline) : 'No deadline set'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-muted)]">Current Stage</p>
                    {isEditing ? (
                      <CustomSelect
                        value={formData.status}
                        onChange={(val) => setFormData({...formData, status: val as string})}
                        options={[
                          { label: 'Draft', value: 'draft' },
                          { label: 'In Review', value: 'in_review' },
                          { label: 'Revision', value: 'revision' },
                          { label: 'Approved', value: 'approved' },
                          { label: 'Done', value: 'done' },
                        ]}
                        className="w-full mt-2"
                      />
                    ) : (
                      <div className="mt-1">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </Modal>
  );
}
