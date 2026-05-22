import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface NewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  staffToEdit?: any | null;
}

export function NewStaffModal({ isOpen, onClose, onSuccess, staffToEdit }: NewStaffModalProps) {
  const { token } = useAuth();
  const { t } = useSettings();
  const { toast } = useToast();
  const createStaff = useMutation(api.staff.createStaff);
  const updateStaff = useMutation(api.staff.updateStaff as any);
  const deleteStaff = useMutation(api.staff.deleteStaff);

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CLIENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];
  const PRESET_AVATARS = [
    '/avatars/doctor_male.png', '/avatars/doctor_female.png', '/avatars/engineer_male.png', '/avatars/engineer_female.png', '/avatars/business_male.png', '/avatars/business_female.png'];

  React.useEffect(() => {
    if (isOpen && staffToEdit) {
      setName(staffToEdit.name || '');
      setPlatform(staffToEdit.platform || '');
      setAvatarUrl(staffToEdit.avatarUrl || '');
      setColor(staffToEdit.color || '#8b5cf6');
    } else if (isOpen) {
      setName('');
      setPlatform('');
      setAvatarUrl(PRESET_AVATARS[0]);
      setColor('#8b5cf6');
    }
  }, [isOpen, staffToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name) return;
    
    setIsSubmitting(true);
    try {
      if (staffToEdit) {
        await updateStaff({
          token,
          staffId: staffToEdit._id,
          name,
          avatarUrl,
          platform,
          color,
        });
        toast('Staff updated successfully!', 'success');
      } else {
        await createStaff({
          token,
          name,
          avatarUrl,
          platform,
          color,
        });
        toast('Staff added successfully!', 'success');
      }
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast('Failed to save staff', 'error');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !staffToEdit) return;
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    setIsSubmitting(true);
    try {
      await deleteStaff({ token, staffId: staffToEdit._id });
      toast('Staff deleted', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (e) {
      toast('Failed to delete', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg shadow-2xl overflow-hidden relative border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl" padding="none">
        
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {t('addNewStaff') || 'Add New Staff'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] rounded-full transition-colors"
          >
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col items-center justify-center gap-4 mb-2">
              <div className="w-24 h-24 rounded-full p-1 shadow-2xl shadow-indigo-500/20 transition-all duration-300" style={{ backgroundImage: `linear-gradient(to top right, ${color}, #4f46e5)` }}>
                <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center relative">
                  <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-2xl font-black text-[var(--text-muted)] uppercase absolute inset-0 z-0">
                    {name ? name.slice(0, 2) : '?'}
                  </div>
                  {avatarUrl && (
                    <img 
                      src={avatarUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-full absolute inset-0 z-10" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {PRESET_AVATARS.map((url, _i) => (
                  <button 
                    key={url} 
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 overflow-hidden",
                      avatarUrl === url ? 'border-[var(--color-brand)] scale-110 shadow-lg shadow-[var(--color-brand-glow)]' : 'border-[var(--border-default)]'
                    )}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2 mb-2">
                {CLIENT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setColor(c); setAvatarUrl(''); }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                      color === c && !avatarUrl ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-60'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Input
              label={t("clientNameLabel") || "Name *"}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed Ali"
            />

            <Input
              label={t("platformLabel") || "Platform"}
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g. Upwork, Freelancer, Local"
            />

            <div className="flex justify-between gap-4 pt-6 mt-4 border-t border-[var(--border-subtle)]">
              {staffToEdit ? (
                <Button type="button" variant="danger" onClick={handleDelete} disabled={isSubmitting}>
                  Delete
                </Button>
              ) : <div />}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="uppercase font-bold text-xs"
                  onClick={onClose}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="uppercase font-bold text-xs"
                  disabled={isSubmitting || !name}
                  loading={isSubmitting}
                >
                  {staffToEdit ? 'Save Changes' : (t('addStaff') || 'Add Staff')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
