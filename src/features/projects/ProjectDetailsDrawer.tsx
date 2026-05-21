import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, DollarSign, Flag, Tag as TagIcon, LayoutGrid, CheckCircle2, Circle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

interface ProjectDetailsDrawerProps {
  project: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailsDrawer({ project, isOpen, onClose }: ProjectDetailsDrawerProps) {
  const { token } = useAuth();
  const { t } = useSettings();
  const updateProjectSteps = useMutation(api.projects.updateProjectSteps);

  if (!project) return null;

  const steps = project.steps || [];
  const completedSteps = steps.filter((s: any) => s.isCompleted).length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  const handleToggleStep = async (stepId: string) => {
    if (!token) return;
    const updatedSteps = steps.map((s: any) => 
      s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    await updateProjectSteps({
      token,
      projectId: project._id,
      steps: updatedSteps
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[450px] max-w-[90vw] bg-[var(--bg-base)] border-l border-[var(--border-default)] shadow-2xl z-50 flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)] bg-[var(--bg-raised)]">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: project.color ? project.color.replace('bg-', '') : 'var(--color-brand)' }}
                >
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{project.title}</h2>
                  <span className="text-xs text-[var(--text-muted)]">{project.projectType ? t(project.projectType as any) : t('generalProject')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70">
                  <Edit size={16} />
                </button>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
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
                <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-muted)] mb-1 block flex items-center gap-1"><Flag size={14} /> {t('priority')}</span>
                  <div className="text-sm font-semibold text-white capitalize">{project.priority ? t(project.priority as any) : t('medium')}</div>
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

              {project.tags && project.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><TagIcon size={16} /> {t('tags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white">{t('subTasks')}</h3>
                  <span className="text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] px-2 py-1 rounded-full border border-[var(--border-default)]">
                    {completedSteps} / {steps.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {steps.map((step: any) => (
                    <div 
                      key={step.id} 
                      onClick={() => handleToggleStep(step.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        step.isCompleted 
                          ? "bg-[var(--color-brand)]/10 border-[var(--color-brand)]/30 opacity-70" 
                          : "bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--color-brand)]/50"
                      )}
                    >
                      {step.isCompleted ? (
                        <CheckCircle2 size={18} className="text-[var(--color-brand)] shrink-0" />
                      ) : (
                        <Circle size={18} className="text-[var(--text-muted)] shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm font-medium flex-1",
                        step.isCompleted ? "text-[var(--text-muted)] line-through" : "text-white"
                      )}>
                        {step.title}
                      </span>
                      {step.assignedTo && (
                        <span className="text-[10px] bg-black px-2 py-1 rounded-md text-[var(--text-muted)]">
                          👤: {step.assignedTo}
                        </span>
                      )}
                    </div>
                  ))}
                  {steps.length === 0 && (
                    <div className="text-center text-sm text-[var(--text-muted)] py-8 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl border-dashed">
                      {t('noTasksRecorded')}
                    </div>
                  )}
                </div>
              </div>

              {project.description && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">{t('notesAndDetails')}</h3>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-default)] text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                    {project.description}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[var(--border-default)] bg-[var(--bg-raised)]">
               <Button variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10">
                 <Trash2 size={16} className="mr-2" /> {t('deleteProject')}
               </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
