import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronRight, ChevronLeft, Calendar, Video, Share2, DollarSign, Camera, CheckCircle2 } from 'lucide-react';
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
  defaultDate?: string;
  defaultClientId?: string;
}

const PROJECT_TYPES = [
  { id: 'editing', labelFallback: 'مونتاج', icon: Video },
  { id: 'financing', labelFallback: 'تمويل', icon: DollarSign },
  { id: 'photography', labelFallback: 'تصوير', icon: Camera },
  { id: 'publishing', labelFallback: 'نشر', icon: Share2 },
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

export function NewProjectStepperModal({ isOpen, onClose, defaultDate, defaultClientId }: NewProjectStepperModalProps) {
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
  const [tasks, setTasks] = useState<{id: string, title: string, assignedTo: string, deadline: string, description: string}[]>([]);
  const [budget, setBudget] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [status, setStatus] = useState('current');
  const [showErrors, setShowErrors] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setClientId(defaultClientId || '');
      setAssignedTo('');
      setProjectType('');
      setTitle('');
      setDescription('');
      setStartDate(defaultDate || '');
      setDeadline(defaultDate || '');
      setTasks([]);
      setBudget('');
      setColor(COLORS[0]);
      setStatus('current');
      setShowErrors(false);
    }
  }, [isOpen, defaultDate, defaultClientId]);

  if (!isOpen) return null;

  const clients = clientsData?.page || [];

  const handleNext = () => {
    if (step === 1 && !clientId) {
      setShowErrors(true);
      return;
    }
    if (step === 2 && (!title || !projectType)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(s => Math.min(4, s + 1));
  };
  const handlePrev = () => {
    setShowErrors(false);
    setStep(s => Math.max(1, s - 1));
  };

  const handleAddTask = () => {
    setTasks([...tasks, { id: Math.random().toString(), title: '', assignedTo: '', deadline: '', description: '' }]);
  };

  const handleUpdateTask = (id: string, field: string, value: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
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
        status,
        assignedTo,
        steps: tasks.map(t => ({
          id: t.id,
          title: t.title,
          assignedTo: t.assignedTo || undefined,
          deadline: t.deadline ? new Date(t.deadline).getTime() : undefined,
          isCompleted: false,
          description: t.description || undefined
        })),
      });

      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'حدث خطأ أثناء إضافة المشروع');
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
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">👤 {t('selectClient')} <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={clientId}
                    className={cn(showErrors && !clientId && "border-red-500 ring-1 ring-red-500")}
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
              {showErrors && !clientId && <p className="text-red-500 text-xs mt-1">يرجى اختيار العميل للمتابعة</p>}
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
                    <span className="text-xs font-bold">{pt.labelFallback}</span>
                  </button>
                );
              })}
            </div>
            {showErrors && !projectType && <p className="text-red-500 text-xs mt-1">يرجى اختيار نوع المشروع للمتابعة</p>}

            <div className="space-y-4 pt-4">
              <div>
                <Input
                  label={t('projectName') + ' *'}
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('enterProjectName')}
                  className={cn(showErrors && !title && "border-red-500 ring-1 ring-red-500")}
                />
                {showErrors && !title && <p className="text-red-500 text-xs mt-1">يرجى إدخال اسم المشروع للمتابعة</p>}
              </div>
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
                  <div key={task.id} className="flex flex-col gap-2 bg-[var(--bg-base)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <div className="flex gap-2 items-center">
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
                    <Textarea 
                      placeholder={t('description')}
                      value={task.description || ''}
                      onChange={e => handleUpdateTask(task.id, 'description', e.target.value)}
                      className="text-xs min-h-[40px] py-1"
                    />
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
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">حالة المشروع <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'current', label: 'حالي', color: 'text-blue-500 bg-blue-500/10 border-blue-500/50' },
                    { id: 'future', label: 'مستقبلي', color: 'text-purple-500 bg-purple-500/10 border-purple-500/50' },
                    { id: 'postponed', label: 'مؤجل', color: 'text-orange-500 bg-orange-500/10 border-orange-500/50' },
                    { id: 'completed', label: 'مكتمل', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-sm font-bold transition-all",
                        status === s.id ? s.color : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
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
                <button 
                  key={i} 
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    step === i ? "w-8 bg-[var(--color-brand)]" : step > i ? "w-4 bg-[var(--color-brand)]/50" : "w-4 bg-white/10"
                  )} 
                />
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
              <Button type="button" onClick={handleNext} className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white px-8 rounded-xl">
                {t('next')} <ChevronLeft size={16} className="mr-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white px-8 rounded-xl shadow-[0_0_20px_var(--color-brand-glow)]">
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
