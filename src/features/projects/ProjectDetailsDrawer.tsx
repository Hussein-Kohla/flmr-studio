import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, DollarSign, Flag, Tag as TagIcon, LayoutGrid, CheckCircle2, Circle, MoreVertical, Edit, Trash2, CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/components/ui/Toast';

interface ProjectDetailsDrawerProps {
  project: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailsDrawer({ project, isOpen, onClose }: ProjectDetailsDrawerProps) {
  const { token } = useAuth();
  const { t } = useSettings();
  const { toast } = useToast();
  const updateProjectSteps = useMutation(api.projects.updateProjectSteps);
  const deleteProject = useMutation(api.projects.deleteProject);
  const updateProject = useMutation(api.projects.updateProject);
  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState('');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [localSteps, setLocalSteps] = useState<any[]>(project?.steps || []);

  React.useEffect(() => {
    if (project && isOpen && !isEditing) {
      setEditForm({
        title: project.title || '',
        description: project.description || '',
        projectType: project.projectType || 'other',
        status: project.status || 'current',
        color: project.color || 'bg-emerald-500',
        clientId: project.clientId || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        budget: (project.budgetCents || 0) / 100,
      });
    }
  }, [project, isOpen, isEditing]);

  React.useEffect(() => {
    if (project?.steps) {
      setLocalSteps(project.steps);
    } else {
      setLocalSteps([]);
    }
  }, [project?.steps]);

  if (!project) return null;

  const clients = clientsData?.page || [];
  const client = clients.find(c => c._id === project.clientId);

  const steps = localSteps;
  const completedSteps = steps.filter((s: any) => s.isCompleted).length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  const handleSave = async () => {
    if (!token || !project) return;
    setIsSaving(true);
    try {
      await updateProject({
        token,
        projectId: project._id,
        title: editForm.title,
        description: editForm.description,
        projectType: editForm.projectType,
        status: editForm.status,
        color: editForm.color,
        clientId: editForm.clientId || project.clientId,
        startDate: editForm.startDate ? new Date(editForm.startDate).getTime() : undefined,
        deadline: editForm.deadline ? new Date(editForm.deadline).getTime() : undefined,
        budget: Number(editForm.budget),
      });
      toast(t('projectUpdated' as any) || 'تم تحديث المشروع بنجاح', 'success');
      setIsEditing(false);
    } catch (e: any) {
      toast(e.message || 'حدث خطأ أثناء التحديث', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !project) return;
    if (!window.confirm(t('confirmDeleteProject' as any) || 'هل أنت متأكد من حذف هذا المشروع نهائياً؟')) return;
    
    try {
      await deleteProject({
        token,
        projectId: project._id,
      });
      toast('تم حذف المشروع بنجاح', 'success');
      onClose();
    } catch (error: any) {
      console.error(error);
      toast(error.message || 'حدث خطأ أثناء الحذف', 'error');
    }
  };

  const handleToggleStep = async (stepId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;
    const updatedSteps = steps.map((s: any) => 
      s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setLocalSteps(updatedSteps);
    try {
      await updateProjectSteps({
        token,
        projectId: project._id,
        steps: updatedSteps
      });
    } catch (err) {
      setLocalSteps(project?.steps || []);
    }
  };

  const handleSaveStep = async (stepId: string) => {
    if (!token) return;
    if (!editingStepTitle.trim()) {
      setEditingStepId(null);
      return;
    }
    const updatedSteps = steps.map((s: any) => 
      s.id === stepId ? { ...s, title: editingStepTitle } : s
    );
    setLocalSteps(updatedSteps);
    setEditingStepId(null);
    try {
      await updateProjectSteps({
        token,
        projectId: project._id,
        steps: updatedSteps
      });
    } catch (err) {
      setLocalSteps(project?.steps || []);
    }
  };

  const handleAddStep = async () => {
    if (!token || !newStepTitle.trim()) return;
    const newStep = {
      id: Math.random().toString(36).substring(2, 9),
      title: newStepTitle.trim(),
      isCompleted: false
    };
    const updatedSteps = [...steps, newStep];
    setLocalSteps(updatedSteps);
    setNewStepTitle('');
    try {
      await updateProjectSteps({
        token,
        projectId: project._id,
        steps: updatedSteps
      });
    } catch (err) {
      setLocalSteps(project?.steps || []);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl bg-[var(--bg-base)] rounded-[24px] shadow-2xl overflow-hidden border border-[var(--border-default)] flex flex-col max-h-[90vh] z-10 relative"
            dir="rtl"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)] bg-[var(--bg-raised)]">
              <div className="flex items-center gap-3">
                <div 
                  className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold", project.color || 'bg-[var(--color-brand)]')}
                >
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{project.title}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/80">{project.projectType ? t(project.projectType as any) : t('generalProject')}</span>
                    <span className="text-[10px] bg-[var(--color-brand)]/20 text-[var(--color-brand)] px-2 py-0.5 rounded-full">{t(project.status as any) || project.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <Button size="sm" onClick={handleSave} loading={isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-full px-4 h-10 shadow-lg font-bold">
                    حفظ التعديلات
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)} variant="secondary" className="rounded-full px-4 h-10 bg-white/5 hover:bg-white/10 text-white/90 border-white/5 font-bold shadow-sm">
                    <Edit size={14} className="mr-2 ml-1" /> تعديل المشروع
                  </Button>
                )}
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white flex items-center justify-center w-10 h-10">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              {isEditing ? (
                <div className="space-y-4 bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
                  <h3 className="font-bold text-white mb-4 text-lg">تعديل تفاصيل المشروع</h3>
                  
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">اسم المشروع</label>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">العميل</label>
                      <select value={editForm.clientId} onChange={e => setEditForm({...editForm, clientId: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)]">
                        <option value="">اختر العميل</option>
                        {clients.map((c: any) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">لون المشروع</label>
                      <div className="flex gap-2 pt-1">
                        {['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500'].map(c => (
                          <button key={c} onClick={() => setEditForm({...editForm, color: c})} className={cn("w-8 h-8 rounded-full border-2 transition-all", editForm.color === c ? "border-white scale-110" : "border-transparent hover:scale-105", c)} />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">النوع</label>
                      <select value={editForm.projectType} onChange={e => setEditForm({...editForm, projectType: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)]">
                        <option value="editing">مونتاج</option>
                        <option value="financing">تمويل</option>
                        <option value="photography">تصوير</option>
                        <option value="publishing">نشر</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">الحالة</label>
                      <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)]">
                        <option value="current">حالي</option>
                        <option value="future">مستقبلي</option>
                        <option value="postponed">مؤجل</option>
                        <option value="completed">مكتمل</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">تاريخ البداية</label>
                      <input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">تاريخ التسليم</label>
                      <input type="date" value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">الميزانية</label>
                      <input type="number" value={editForm.budget} onChange={e => setEditForm({...editForm, budget: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)]" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">الوصف</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--color-brand)] min-h-[100px]" />
                  </div>
                </div>
              ) : (
                <>
              {client && (
                <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center font-bold text-xl border border-[var(--color-brand)]/20">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">{client.name}</h4>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">👤 {t('client')}</span>
                  </div>
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="text-xs text-[var(--color-brand)] hover:underline" onClick={(e) => e.stopPropagation()}>
                      {client.phone}
                    </a>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-muted)] mb-1 block flex items-center gap-1"><Calendar size={14} /> {t('startDate')}</span>
                  <div className="text-sm font-semibold text-white">{project.startDate ? formatDate(project.startDate) : t('notSet')}</div>
                </div>
                <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-muted)] mb-1 block flex items-center gap-1"><Clock size={14} /> {t('deliveryDate')}</span>
                  <div className="text-sm font-semibold text-white">{project.deadline ? formatDate(project.deadline) : t('notSet')}</div>
                </div>
                <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-muted)] mb-1 block flex items-center gap-1"><DollarSign size={14} /> {t('budget')}</span>
                  <div className="text-sm font-semibold text-[var(--color-brand)]">{project.budgetCents ? formatCurrency(project.budgetCents) : '0'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">{t('overallProgress')}</span>
                  <span className="text-[var(--color-brand)] font-bold">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-default)]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[var(--color-brand)] rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white">{t('subTasks')}</h3>
                  <span className="text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] px-2 py-1 rounded-full border border-[var(--border-default)]">
                    {completedSteps} / {steps.length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {steps.map((step: any) => {
                    return (
                    <div 
                      key={step.id} 
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-xl border transition-all cursor-pointer",
                        step.isCompleted 
                          ? "bg-[var(--color-brand)]/5 border-[var(--color-brand)]/20" 
                          : "bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--color-brand)]/50"
                      )}
                      onClick={() => {
                        if (editingStepId !== step.id) {
                          handleToggleStep(step.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <button onClick={(e) => handleToggleStep(step.id, e)} className="mt-0.5 shrink-0">
                          {step.isCompleted ? (
                            <CheckCircle2 size={18} className="text-[var(--color-brand)]" />
                          ) : (
                            <Circle size={18} className="text-[var(--text-muted)] hover:text-white transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            {editingStepId === step.id ? (
                              <div className="flex w-full gap-2" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingStepTitle}
                                  onChange={(e) => setEditingStepTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveStep(step.id);
                                    if (e.key === 'Escape') setEditingStepId(null);
                                  }}
                                  className="flex-1 bg-[var(--bg-base)] border border-[var(--color-brand)] rounded px-2 py-1 text-sm text-white outline-none"
                                />
                                <Button size="sm" onClick={() => handleSaveStep(step.id)} className="h-7 px-2">حفظ</Button>
                              </div>
                            ) : (
                              <>
                                <span className={cn(
                                  "text-sm font-medium",
                                  step.isCompleted ? "text-[var(--text-muted)] line-through" : "text-white"
                                )}>
                                  {step.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  {step.assignedTo && (
                                    <span className="text-[10px] bg-black px-2 py-1 rounded-md text-[var(--text-muted)]">
                                      👤: {step.assignedTo}
                                    </span>
                                  )}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingStepId(step.id);
                                      setEditingStepTitle(step.title);
                                    }}
                                    className="text-[var(--text-muted)] hover:text-white p-1 rounded hover:bg-white/10"
                                  >
                                    <Edit size={14} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {step.description && editingStepId !== step.id && (
                            <p className="text-xs text-[var(--text-muted)] mt-1 mb-2 whitespace-pre-wrap leading-relaxed">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                  {steps.length === 0 && (
                    <div className="text-center text-sm text-[var(--text-muted)] py-8 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl border-dashed">
                      {t('noTasksRecorded')}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 items-center">
                    <input 
                      type="text" 
                      value={newStepTitle}
                      onChange={e => setNewStepTitle(e.target.value)}
                      placeholder="إضافة مهمة جديدة..."
                      className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--color-brand)] transition-colors"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddStep();
                      }}
                    />
                    <Button onClick={handleAddStep} disabled={!newStepTitle.trim()} className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white rounded-xl h-[42px] px-4 border-none flex items-center justify-center">
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              {!isEditing && project.description && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">{t('notesAndDetails')}</h3>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-default)] text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                    {project.description}
                  </div>
                </div>
              )}
              
              </>
              )}
            </div>
            
            <div className="p-6 border-t border-[var(--border-default)] bg-[var(--bg-raised)]">
               <Button onClick={handleDelete} variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10">
                 <Trash2 size={16} className="mr-2" /> {t('deleteProject')}
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
