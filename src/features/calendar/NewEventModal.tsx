import { useSettings } from "@/hooks/useSettings";
import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '../../lib/utils';
import { SmartDropdown } from '@/components/ui/SmartDropdown';
import { NewClientModal } from '../clients/NewClientModal';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any | null;
  initialCategory?: 'calendar' | 'project' | 'task' | 'publishing';
  initialClientId?: string;
}

export function NewEventModal({ isOpen, onClose, eventToEdit, initialCategory, initialClientId }: NewEventModalProps) {
  const { t } = useSettings();
  const { token } = useAuth();
  
  // Queries
  const clients = useQuery(api.clients.getAllClients, token ? { token } : 'skip') || [];
  const projects = useQuery(api.projects.getAllProjects, token ? { token } : 'skip') || [];

  // Mutations - Calendar
  const createEvent = useMutation(api.calendar.createEvent);
  const updateEvent = useMutation(api.calendar.updateEvent);
  const deleteEvent = useMutation(api.calendar.deleteEvent);

  // Mutations - Projects
  const createProject = useMutation(api.projects.createProject);
  const updateProject = useMutation(api.projects.updateProject);
  const deleteProject = useMutation(api.projects.deleteProject);

  // Mutations - Tasks
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  // Mutations - Publishing
  const schedulePost = useMutation(api.publishing.schedulePost);
  const deletePost = useMutation(api.publishing.deletePost);

  // States
  const [itemCategory, setItemCategory] = useState<'calendar' | 'project' | 'task' | 'publishing'>(initialCategory || 'calendar');
  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [notes, setNotes] = useState('');
  
  // Calendar-specific state
  const [type, setType] = useState('other');

  // Project-specific state
  const [budget, setBudget] = useState('');
  const [projectType, setProjectType] = useState('other');
  const [projectStatus, setProjectStatus] = useState('current');
  const [projectColor, setProjectColor] = useState('bg-emerald-500');

  // Task-specific state
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');

  // Publishing-specific state
  const [platform, setPlatform] = useState('facebook');

  // Shared references
  const [clientId, setClientId] = useState(initialClientId || '');
  const [projectId, setProjectId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Reset or load event to edit
  useEffect(() => {
    if (eventToEdit && isOpen) {
      setTitle(eventToEdit.title || '');
      setItemCategory(eventToEdit.eventSource || 'calendar');
      setStartAt(eventToEdit.startAt ? new Date(eventToEdit.startAt).toISOString().slice(0, 16) : '');
      setNotes(eventToEdit.notes || '');
      setType(eventToEdit.type || 'other');
      setClientId(eventToEdit.clientId || '');
      setProjectId(eventToEdit.projectId || '');
      setPriority(eventToEdit.priority || 'medium');
      setStatus(eventToEdit.status || 'todo');
      setBudget(eventToEdit.budgetCents ? (eventToEdit.budgetCents / 100).toString() : '');
      setProjectType(eventToEdit.projectType || 'other');
      setProjectStatus(eventToEdit.status || 'current');
      setProjectColor(eventToEdit.color || 'bg-emerald-500');
      setPlatform(eventToEdit.platform || 'facebook');
    } else if (!eventToEdit && isOpen) {
      setTitle('');
      setItemCategory(initialCategory || 'calendar');
      setStartAt(new Date().toISOString().slice(0, 16));
      setNotes('');
      setType('other');
      setClientId(initialClientId || '');
      setProjectId('');
      setPriority('medium');
      setStatus('todo');
      setBudget('');
      setProjectType('other');
      setProjectStatus('current');
      setProjectColor('bg-emerald-500');
      setPlatform('facebook');
    }
  }, [eventToEdit, isOpen, initialCategory, initialClientId]);

  if (!isOpen) return null;

  // Filter projects by selected client
  const filteredProjects = clientId 
    ? projects.filter(p => p.clientId === clientId)
    : projects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title || !startAt) return;

    setIsSubmitting(true);
    try {
      const timeMs = new Date(startAt).getTime();

      if (eventToEdit) {
        // Editing flows
        if (itemCategory === 'calendar') {
          await updateEvent({
            token,
            eventId: eventToEdit._id,
            title,
            type,
            startAt: timeMs,
            notes,
          });
        } else if (itemCategory === 'task') {
          await updateTask({
            token,
            taskId: eventToEdit._id,
            title,
            description: notes,
            dueDate: timeMs,
            priority,
            status,
          });
        } else if (itemCategory === 'project') {
          await updateProject({
            token,
            projectId: eventToEdit._id,
            title,
            description: notes,
            deadline: timeMs,
            budget: budget ? parseFloat(budget) : undefined,
            status: projectStatus,
            projectType,
            color: projectColor,
          });
        }
      } else {
        // Creation flows
        if (itemCategory === 'calendar') {
          await createEvent({
            token,
            title,
            type,
            startAt: timeMs,
            notes,
            clientId: clientId ? (clientId as any) : undefined,
            projectId: projectId ? (projectId as any) : undefined,
          });
        } else if (itemCategory === 'project') {
          if (!clientId) {
            alert('Please select a client for the project.');
            setIsSubmitting(false);
            return;
          }
          await createProject({
            token,
            title,
            description: notes,
            clientId: clientId as any,
            deadline: timeMs,
            budget: budget ? parseFloat(budget) : undefined,
            status: projectStatus,
            projectType,
            color: projectColor,
          });
        } else if (itemCategory === 'task') {
          await createTask({
            token,
            title,
            description: notes,
            dueDate: timeMs,
            clientId: clientId ? (clientId as any) : undefined,
            projectId: projectId ? (projectId as any) : undefined,
            priority,
            status,
            order: 0,
          });
        } else if (itemCategory === 'publishing') {
          await schedulePost({
            token,
            title,
            platform,
            publishDate: timeMs,
            clientId: clientId ? (clientId as any) : undefined,
            projectId: projectId ? (projectId as any) : undefined,
          });
        }
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !eventToEdit) return;
    if (!window.confirm("Are you sure you want to delete this permanently?")) return;

    setIsSubmitting(true);
    try {
      if (itemCategory === 'calendar') {
        await deleteEvent({ token, eventId: eventToEdit._id });
      } else if (itemCategory === 'task') {
        await deleteTask({ token, taskId: eventToEdit._id });
      } else if (itemCategory === 'project') {
        await deleteProject({ token, projectId: eventToEdit._id });
      } else if (itemCategory === 'publishing') {
        await deletePost({ token, postId: eventToEdit._id });
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg shadow-2xl overflow-hidden relative border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl" padding="none">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {eventToEdit ? `Edit ${itemCategory.charAt(0).toUpperCase() + itemCategory.slice(1)}` : t('createNewEntry')}
          </h2>
          <button onClick={onClose} className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] rounded-full transition-colors">
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Select (only visible when creating) */}
          {!eventToEdit && (
            <div>
              <label className="form-label">{t("categoryHeader")} *</label>
              <div className="grid grid-cols-4 gap-2 bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)]">
                {(['calendar', 'project', 'task', 'publishing'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setItemCategory(cat);
                      // Clear type/platform/priority values if transitioning
                    }}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      itemCategory === cat 
                        ? "bg-brand text-white shadow" 
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {cat === 'calendar' ? 'Event' : cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="form-label">{t("titleLabelUppercase")} *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder={
                itemCategory === 'project' ? t("projectName") :
                itemCategory === 'task' ? t("taskTitleLabel") :
                itemCategory === 'publishing' ? t("postTitle") : t("eventTitle")
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <DatePicker
                label={
                  itemCategory === 'project' ? "Deadline *" :
                  itemCategory === 'task' ? "Due Date *" :
                  itemCategory === 'publishing' ? "Publish Date *" : "Date & Time *"
                }
                value={startAt}
                onChange={setStartAt}
                withTime={itemCategory !== 'project' && itemCategory !== 'task'}
              />
            </div>

            {/* Category specific primary input */}
            {itemCategory === 'calendar' && (
              <div>
                <label className="form-label">{t("eventTypeLabel")} *</label>
                <select
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="montage">مونتاج</option>
                  <option value="dish_ad">اعلان دش</option>
                  <option value="match_ad">اعلان مباريات</option>
                  <option value="fb_image">صورة فيس</option>
                  <option value="collection">تحصيل</option>
                  <option value="send_money">ابعت فلوس</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="booking">Booking</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {itemCategory === 'project' && (
              <>
                <div>
                  <label className="form-label">{t("budgetAmount") || "الميزانية"}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="input-field"
                    placeholder="Budget Amount"
                  />
                </div>
                <div>
                  <label className="form-label">النوع</label>
                  <select value={projectType} onChange={e => setProjectType(e.target.value)} className="input-field select-field">
                    <option value="editing">مونتاج</option>
                    <option value="financing">تمويل</option>
                    <option value="photography">تصوير</option>
                    <option value="publishing">نشر</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">الحالة</label>
                  <select value={projectStatus} onChange={e => setProjectStatus(e.target.value)} className="input-field select-field">
                    <option value="current">حالي</option>
                    <option value="future">مستقبلي</option>
                    <option value="postponed">مؤجل</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">لون المشروع</label>
                  <div className="flex gap-2 mt-1">
                    {['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500'].map(c => (
                      <button key={c} type="button" onClick={() => setProjectColor(c)} className={cn("w-8 h-8 rounded-full border-2 transition-all", projectColor === c ? "border-[var(--color-brand)] scale-110" : "border-transparent hover:scale-105", c)} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {itemCategory === 'task' && (
              <div>
                <label className="form-label">{t("priorityLabel")}</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}

            {itemCategory === 'publishing' && (
              <div>
                <label className="form-label">{t("platformLabel")} *</label>
                <select
                  required
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
          </div>

          {/* Conditional CRM options */}
          {itemCategory !== 'project' && (
            <SmartDropdown label={t("advancedOptionsClientProject")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute right-3 top-1.5 z-10">
                    <button 
                      type="button" 
                      onClick={() => setIsNewClientModalOpen(true)}
                      className="text-[10px] font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-dim)] bg-[var(--color-brand)]/10 hover:bg-[var(--color-brand)]/20 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                    >
                      <Plus size={10} /> جديد
                    </button>
                  </div>
                  <label className="form-label">{t("clientRelationship")}</label>
                  <select
                    value={clientId}
                    onChange={(e) => {
                      if (e.target.value === 'NEW_CLIENT') {
                        setIsNewClientModalOpen(true);
                        setClientId('');
                        setProjectId('');
                      } else {
                        setClientId(e.target.value);
                        setProjectId(''); // reset project on client change
                      }
                    }}
                    className="input-field select-field"
                  >
                    <option value="">{t("noClientAssoc")}</option>
                    <option value="NEW_CLIENT" className="font-bold text-[var(--color-brand)] bg-brand/10">
                      + Create New Client...
                    </option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">{t("associatedProject")}</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="input-field select-field"
                    disabled={!clientId && projects.length === 0}
                  >
                    <option value="">{t("noProjectAssoc")}</option>
                    {filteredProjects.map((p) => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </SmartDropdown>
          )}

          {/* Project Specific Client dropdown (required for Project) */}
          {itemCategory === 'project' && (
            <div className="relative">
              <div className="absolute right-3 top-1.5 z-10">
                <button 
                  type="button" 
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="text-[10px] font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-dim)] bg-[var(--color-brand)]/10 hover:bg-[var(--color-brand)]/20 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <Plus size={10} /> جديد
                </button>
              </div>
              <label className="form-label">{t("clientNameLabel")} *</label>
              <select
                required
                value={clientId}
                onChange={(e) => {
                  if (e.target.value === 'NEW_CLIENT') {
                    setIsNewClientModalOpen(true);
                    setClientId('');
                  } else {
                    setClientId(e.target.value);
                  }
                }}
                className="input-field select-field"
                disabled={!!eventToEdit} // cannot change client of existing project here
              >
                <option value="" disabled>Select Client...</option>
                <option value="NEW_CLIENT" className="font-bold text-[var(--color-brand)] bg-brand/10">
                  + Create New Client...
                </option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Task Status field if editing */}
          {eventToEdit && itemCategory === 'task' && (
            <div>
              <label className="form-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field select-field"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>
          )}

          {/* Description/Notes textarea */}
          {itemCategory !== 'publishing' && (
            <SmartDropdown label={t("notesDescriptionLabel")}>
              <div>
                <label className="form-label">Description / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="Details..."
                />
              </div>
            </SmartDropdown>
          )}

          <div className="pt-4 flex justify-between gap-3 border-t border-[var(--border-subtle)]">
            {eventToEdit ? (
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDelete} 
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting || !title || !startAt}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
      
      <NewClientModal 
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSuccess={(newClientId) => {
          setClientId(newClientId);
          setIsNewClientModalOpen(false);
        }}
      />
    </div>
  );
}
