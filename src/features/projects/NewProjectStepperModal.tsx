import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronRight, ChevronLeft, Calendar, Monitor, Smartphone, LayoutTemplate, Video, Share2, ShoppingCart, Code, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { NewClientModal } from '../clients/NewClientModal';

interface NewProjectStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROJECT_TYPES = [
  { id: 'web', labelKey: 'website', icon: Monitor },
  { id: 'mobile', labelKey: 'mobileApp', icon: Smartphone },
  { id: 'uiux', labelKey: 'uiuxDesign', icon: LayoutTemplate },
  { id: 'video', labelKey: 'youtubeVideo', icon: Video },
  { id: 'social', labelKey: 'socialMedia', icon: Share2 },
  { id: 'ecommerce', labelKey: 'ecommerce', icon: ShoppingCart },
  { id: 'custom', labelKey: 'customDev', icon: Code },
  { id: 'other', labelKey: 'other', icon: MoreHorizontal },
];

const COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 
  'bg-pink-500', 'bg-orange-500', 'bg-red-500', 
  'bg-yellow-500', 'bg-cyan-500'
];

const MOCK_EMPLOYEES = [
  { id: 'emp_1', name: 'أحمد', avatar: '👨‍💻' },
  { id: 'emp_2', name: 'سارة', avatar: '👩‍🎨' },
  { id: 'emp_3', name: 'محمد', avatar: '👨‍💼' },
  { id: 'emp_4', name: 'عمر', avatar: '👨‍🔧' },
];

export function NewProjectStepperModal({ isOpen, onClose }: NewProjectStepperModalProps) {
  const { token } = useAuth();
  const { t } = useSettings();
  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');
  const staffQuery = useQuery(api.staff.getStaff as any, token ? { token } : 'skip');
  const staffList = staffQuery || [];
  const createProject = useMutation(api.projects.createProject);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  const [clientId, setClientId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectType, setProjectType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState<{id: string, title: string, assignedTo: string, deadline: string}[]>([]);
  const [budget, setBudget] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const clients = clientsData?.page || [];

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleAddTask = () => {
    setTasks([...tasks, { id: Math.random().toString(), title: '', assignedTo: '', deadline: '' }]);
  };

  const handleUpdateTask = (id: string, field: string, value: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title || !clientId) return;
    
    setIsSubmitting(true);
    try {
      const projectId = await createProject({
        token,
        title,
        description,
        clientId: clientId as any,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        projectType,
        platform: projectType,
        color,
        priority,
        tags,
        assignedTo,
      });

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6" dir="rtl">
            <h3 className="text-xl font-bold mb-4">{t('step1Title')}</h3>
            
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">👤 {t('selectClient')}</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={clientId}
                    onChange={(e) => {
                      if (e.target.value === 'NEW_CLIENT') {
                        setIsNewClientModalOpen(true);
                        setClientId('');
                      } else {
                        setClientId(e.target.value);
                      }
                    }}
                  >
                    <option value="" disabled>{t('selectClient')}...</option>
                    <option value="NEW_CLIENT" className="font-bold text-brand bg-brand/10">+ {t('addNewClient')}</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">👷 {t('assignee')}</label>
              <div className="flex gap-3 flex-wrap">
                {staffList.map((emp: any) => (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => setAssignedTo(emp._id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      assignedTo === emp._id 
                        ? "border-brand bg-brand/10" 
                        : "border-[var(--border-subtle)] hover:border-brand/50 hover:bg-[var(--bg-surface)]"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full border border-[var(--color-brand)] overflow-hidden">
                      <img src={emp.avatarUrl || '/avatars/avatar_1.png'} alt={emp.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-medium">{emp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6" dir="rtl">
            <h3 className="text-xl font-bold mb-4">{t('step2Title')}</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROJECT_TYPES.map(pt => {
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setProjectType(pt.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center",
                      projectType === pt.id 
                        ? "border-brand bg-brand/10 text-brand" 
                        : "border-[var(--border-subtle)] hover:border-brand/50 bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                    )}
                  >
                    <Icon size={24} />
                    <span className="text-xs font-bold">{t(pt.labelKey as any)}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 pt-4">
              <Input
                label={t('projectName') + ' *'}
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('enterProjectName')}
              />
              <Textarea
                label={t('briefDetails')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="..."
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6" dir="rtl">
            <h3 className="text-xl font-bold mb-4">{t('step3Title')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label={t('startDate')} value={startDate} onChange={setStartDate} />
              <DatePicker label={t('deliveryDate')} value={deadline} onChange={setDeadline} />
            </div>

            <div className="border border-[var(--border-subtle)] rounded-xl p-4 bg-[var(--bg-surface)]">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('subTasks')}</label>
                <Button type="button" size="sm" variant="ghost" onClick={handleAddTask} className="h-8 text-xs">
                  <Plus size={14} className="ml-1" /> {t('addTask')}
                </Button>
              </div>
              
              <div className="space-y-2">
                {tasks.map((task, idx) => (
                  <div key={task.id} className="flex gap-2 items-center bg-[var(--bg-base)] p-2 rounded-lg border border-[var(--border-subtle)]">
                    <Input
                      placeholder={t('taskName')}
                      value={task.title}
                      onChange={e => handleUpdateTask(task.id, 'title', e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <select
                      value={task.assignedTo}
                      onChange={e => handleUpdateTask(task.id, 'assignedTo', e.target.value)}
                      className="h-8 bg-transparent border-none text-xs text-[var(--text-secondary)] w-24 outline-none"
                    >
                      <option value="">👤 {t('assignee')}</option>
                      {staffList.map((emp: any) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                    </select>
                    <button type="button" onClick={() => handleRemoveTask(task.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center text-xs text-[var(--text-muted)] py-4">{t('noSubTasksYet')}</div>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6" dir="rtl">
            <h3 className="text-xl font-bold mb-4">{t('step4Title')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('projectValue')}
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="0.00"
                rightIcon={<span className="text-[var(--text-muted)] text-sm ml-2">EGP</span>}
              />
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('priorityLabel')}</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-sm focus:outline-none focus:border-brand"
                >
                  <option value="low">{t('low')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="high">{t('high')}</option>
                  <option value="critical">{t('critical')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('projectColor')}</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      c,
                      color === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('tagsLabel')}</label>
              <Input
                placeholder="..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              <div className="flex gap-2 flex-wrap mt-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-[var(--bg-surface)] px-2 py-1 rounded-md text-xs border border-[var(--border-subtle)]">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}><X size={12} className="hover:text-red-400" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-[var(--bg-surface)] rounded-[24px] shadow-2xl overflow-hidden border border-[var(--border-default)] flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-default)] bg-[var(--bg-raised)]">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
              <X size={16} />
            </button>
            
            <div className="flex gap-2" dir="rtl">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  step === i ? "w-8 bg-[var(--color-brand)]" : step > i ? "w-4 bg-[var(--color-brand)]/50" : "w-4 bg-white/10"
                )} />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </form>

          <div className="p-6 border-t border-[var(--border-default)] bg-[var(--bg-raised)] flex justify-between" dir="rtl">
            {step < 4 ? (
              <Button type="button" onClick={handleNext} className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white px-8 rounded-xl" disabled={step === 1 && !clientId}>
                {t('next')} <ChevronLeft size={16} className="mr-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !title || !clientId} className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white px-8 rounded-xl shadow-[0_0_20px_var(--color-brand-glow)]">
                {isSubmitting ? t('creating') : t('createProject')} <CheckCircle2 size={16} className="mr-2" />
              </Button>
            )}

            {step > 1 && (
              <Button type="button" variant="ghost" onClick={handlePrev} className="text-white/70 hover:text-white">
                <ChevronRight size={16} className="ml-2" /> {t('back')}
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      <NewClientModal 
        isOpen={isNewClientModalOpen} 
        onClose={() => setIsNewClientModalOpen(false)} 
        onSuccess={(newClientId) => {
          setClientId(newClientId);
          setIsNewClientModalOpen(false);
        }}
      />
    </>
  );
}
