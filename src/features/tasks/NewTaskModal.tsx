import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { useAuth } from '@/hooks/useAuth'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  status?: string
}

export function NewTaskModal({ isOpen, onClose, status = 'todo' }: NewTaskModalProps) {
  const { token } = useAuth()
  const createTask = useMutation(api.tasks.createTask)
  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip')
  const clients = clientsData?.page || []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-lg font-bold">New Task</h3>
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
              placeholder="What needs to be done?"
            />
          </div>
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
              <label className="form-label">Priority</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as any})}
                className="input-field select-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
          <div>
            <label className="form-label">Assign to Client</label>
            <select 
              value={formData.clientId}
              onChange={e => setFormData({...formData, clientId: e.target.value as any})}
              className="input-field select-field"
            >
               <option value="">None</option>
              {clients.map(c => <option key={c._id} value={c._id} className="bg-[var(--bg-surface)]">{c.name}</option>)}
            </select>
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full">Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
