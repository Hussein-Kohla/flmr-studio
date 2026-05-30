import { useSettings } from "@/hooks/useSettings";
import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { useAuth } from '@/hooks/useAuth'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { CustomSelect } from '@/components/ui/CustomSelect'

import { NewClientModal } from '../clients/NewClientModal'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  status?: string
  taskToEdit?: any | null
}

export function NewTaskModal({ isOpen, onClose, status = 'todo', taskToEdit }: NewTaskModalProps) {
  const { t } = useSettings();
  const { token } = useAuth()
  const createTask = useMutation(api.tasks.createTask)
  const updateTask = useMutation(api.tasks.updateTask)
  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const clients = clientsData?.page || []
  const projects = useQuery(api.projects.getAllProjects, token ? { token } : 'skip') || []
  const stages = useQuery(api.task_stages.getStages, token ? { token } : 'skip') || []
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    projectId: '',
    dueDate: '',
    status: status,
  })

  // Update form when status changes
  useEffect(() => {
    if (!taskToEdit && isOpen) {
      setFormData(prev => ({ ...prev, status }))
    }
  }, [status, isOpen, taskToEdit])

  useEffect(() => {
    if (taskToEdit && isOpen) {
      setFormData({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        clientId: taskToEdit.clientId || '',
        projectId: taskToEdit.projectId || '',
        dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 16) : '',
        status: taskToEdit.status || status,
      })
    } else if (!taskToEdit && isOpen) {
      setFormData({ title: '', description: '', clientId: '', projectId: '', dueDate: '', status })
    }
  }, [taskToEdit, isOpen, status])
  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !formData.title) return

    if (taskToEdit) {
      await updateTask({
        token,
        taskId: taskToEdit._id,
        title: formData.title,
        description: formData.description || undefined,
        status: taskToEdit.status || formData.status,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
      })
    } else {
      await createTask({
        token,
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status || status,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        clientId: formData.clientId ? (formData.clientId as Id<'clients'>) : undefined,
        projectId: formData.projectId ? (formData.projectId as Id<'projects'>) : undefined,
        order: 0,
      })
    }
    
    setFormData({ title: '', description: '', clientId: '', projectId: '', dueDate: '', status })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-in zoom-in-95">
          <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-lg font-bold">{taskToEdit ? 'تعديل المهمة' : t('newTaskTitle')}</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="form-label">{t("titleLabelUppercase") || "العنوان"}</label>
              <input 
                autoFocus
                type="text" 
                required
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="input-field"
                placeholder={t("whatNeedsToBeDone")}
              />
            </div>
            
            {/* Status / List Selection - Only for new tasks */}
            {!taskToEdit && stages.length > 0 && (
              <div>
                <label className="form-label">القائمة</label>
                <CustomSelect 
                  value={formData.status}
                  onChange={(val) => setFormData({...formData, status: val as string})}
                  options={stages.map((s: any) => ({ label: s.name, value: s.slug }))}
                />
              </div>
            )}
            
            <div className="space-y-4">
            {/* Client & Project Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="form-label">{t("clientRelationship") || "العميل"}</label>
                <CustomSelect 
                  value={formData.clientId}
                  onChange={(val) => {
                    if (val === 'NEW_CLIENT') {
                      setIsNewClientModalOpen(true);
                      setFormData({...formData, clientId: '', projectId: ''});
                    } else {
                      setFormData({...formData, clientId: val as string, projectId: ''});
                    }
                  }}
                  options={[
                    { label: t("noClientAssoc") || "بدون عميل", value: '' },
                    { label: <span className="font-bold text-[var(--color-brand)] bg-brand/10">+ إضافة عميل جديد...</span>, value: 'NEW_CLIENT' },
                    ...clients.map((c: any) => ({ label: c.name, value: c._id }))
                  ]}
                />
              </div>
              <div className="flex-1">
                <label className="form-label">{t("associatedProject") || "المشروع"}</label>
                <CustomSelect 
                  value={formData.projectId}
                  onChange={(val) => setFormData({...formData, projectId: val as string})}
                  options={[
                    { label: t("noProjectAssoc") || "بدون مشروع", value: '' },
                    ...projects.map((p: any) => ({ label: p.title, value: p._id }))
                  ]}
                />
              </div>
            </div>
            
            {/* Due Date */}
            <div>
              <DatePicker 
                label="تاريخ الاستحقاق"
                value={formData.dueDate}
                onChange={date => setFormData({...formData, dueDate: date})}
                withTime={true}
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="form-label">الوصف</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="input-field h-20 resize-none"
                placeholder="أضف تفاصيل..."
              />
            </div>
          </div>
            <div className="pt-2">
              <Button type="submit" className="w-full">{taskToEdit ? 'حفظ التغييرات' : t('createTask')}</Button>
            </div>
          </form>
        </div>
      </div>
      
      <NewClientModal 
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSuccess={(newClientId) => {
          setFormData({ ...formData, clientId: newClientId });
          setIsNewClientModalOpen(false);
        }}
      />
    </>
  )
}