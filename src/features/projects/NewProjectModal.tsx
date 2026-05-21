import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { NewClientModal } from '../clients/NewClientModal';
import { SmartDropdown } from '@/components/ui/SmartDropdown';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { token } = useAuth();
  const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');
  const createProject = useMutation(api.projects.createProject);

  const [title, setTitle] = useLocalStorage('draft-project-title', '');
  const [description, setDescription] = useLocalStorage('draft-project-description', '');
  const [clientId, setClientId] = useLocalStorage('draft-project-clientId', '');
  const [deadline, setDeadline] = useLocalStorage('draft-project-deadline', '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  if (!isOpen) return null;

  const clients = clientsData?.page || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title || !clientId) return;
    
    setIsSubmitting(true);
    try {
      await createProject({
        token,
        title,
        description,
        clientId: clientId as any,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
      });
      setTitle('');
      setDescription('');
      setClientId('');
      setDeadline('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden relative border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl" padding="none">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">New Project</h2>
          <button onClick={onClose} className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] rounded-full transition-colors">
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Title *"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project Title"
          />

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
            <Select
              label="Client *"
              required
              value={clientId}
              onChange={(e) => {
                if (e.target.value === 'NEW_CLIENT') {
                  setIsNewClientModalOpen(true);
                  // Reset select value to empty string so 'Create New Client...' isn't actually selected
                  setClientId('');
                } else {
                  setClientId(e.target.value);
                }
              }}
            >
              <option value="" disabled>Select a client...</option>
              <option value="NEW_CLIENT" className="font-bold text-[var(--color-brand)] bg-brand/10">
                + Create New Client...
              </option>
              {clients?.map((client) => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </Select>
          </div>

          <SmartDropdown label="Advanced Options (Description & Deadline)">
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about the project..."
            />

            <DatePicker
              label="Deadline"
              value={deadline}
              onChange={setDeadline}
            />
          </SmartDropdown>

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !clientId} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white shadow-lg shadow-[var(--color-brand-glow)]">
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
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
