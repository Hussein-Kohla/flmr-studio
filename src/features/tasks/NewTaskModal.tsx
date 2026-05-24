import { useSettings } from "@/hooks/useSettings";
import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { useAuth } from '@/hooks/useAuth'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'

import { useLocalStorage } from '@/hooks/useLocalStorage'
import { SmartDropdown } from '@/components/ui/SmartDropdown'
import { NewClientModal } from '../clients/NewClientModal'
import { TASK_PRIORITIES, type TaskPriority } from './taskOptions'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  status?: string
}

export function NewTaskModal({ isOpen, onClose, status = 'todo' }: NewTaskModalProps) {
  const { t } = useSettings();
  const { token } = useAuth()
  const createTask = useMutation(api.tasks.createTask)
  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const clients = clientsData?.page || []

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)

  const [formData, setFormData] = useLocalStorage('draft-task-form', {
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    clientId: '',
    dueDate: '',
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !formData.title) return

    await createTask({
      token,
      title: formData.title,
      description: formData.description || undefined,
      status,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
      clientId: formData.clientId ? (formData.clientId as Id<'clients'>) : undefined,
      order: 0, // Will be handled by the backend or updated later
    })
    
    setFormData({ title: '', description: '', priority: 'medium', clientId: '', dueDate: '' })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-in zoom-in-95">
          <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-lg font-bold">{t('newTaskTitle')}</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="form-label">Task Title</label>
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
            <SmartDropdown label="Advanced Options (Description, Priority, Client)">
              <div>
                <label className="form-label">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="input-field h-24 resize-none"
                  placeholder="Add some details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('priorityLabel')}</label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                    className="input-field select-field"
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{t(p)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <DatePicker 
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={date => setFormData({...formData, dueDate: date})}
                    withTime={true}
                  />
                </div>
              </div>
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
                <label className="form-label">Assign to Client</label>
                <select 
                  value={formData.clientId}
                  onChange={e => {
                    if (e.target.value === 'NEW_CLIENT') {
                      setIsNewClientModalOpen(true);
                      setFormData({...formData, clientId: ''});
                    } else {
                      setFormData({...formData, clientId: e.target.value});
                    }
                  }}
                  className="input-field select-field"
                >
                   <option value="">{t("none")}</option>
                   <option value="NEW_CLIENT" className="font-bold text-[var(--color-brand)] bg-brand/10">
                     + Create New Client...
                   </option>
                  {clients.map(c => <option key={c._id} value={c._id} className="bg-[var(--bg-surface)]">{c.name}</option>)}
                </select>
              </div>
            </SmartDropdown>
            <div className="pt-2">
              <Button type="submit" className="w-full">{t('createTask')}</Button>
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
