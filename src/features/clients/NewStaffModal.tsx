import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMutation, useQuery } from 'convex/react';
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const staffList = useQuery(api.staff.getStaff, token ? { token } : "skip");
  const allTags = React.useMemo(() => {
    const ts = new Set<string>();
    if (staffList) {
      staffList.forEach((s: any) => {
        if (s.tags) s.tags.forEach((t: string) => ts.add(t));
      });
    }
    return Array.from(ts);
  }, [staffList]);

  const toggleTag = (tagId: string) => {
    setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const CLIENT_COLORS = ['#3b82f6', '#10b981', '#14b8a6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444', '#f59e0b', '#64748b'];
  const PRESET_AVATARS = [
    '/avatars/doctor_male.png', '/avatars/doctor_female.png', '/avatars/engineer_male.png', '/avatars/engineer_female.png', '/avatars/business_male.png', '/avatars/business_female.png'];

  React.useEffect(() => {
    if (isOpen && staffToEdit) {
      setName(staffToEdit.name || '');
      setPlatform(staffToEdit.platform || '');
      setAvatarUrl(staffToEdit.avatarUrl || '');
      setColor(staffToEdit.color || '#8b5cf6');
      setTags(staffToEdit.tags || []);
    } else if (isOpen) {
      setName('');
      setPlatform('');
      setAvatarUrl(PRESET_AVATARS[0]);
      setColor('#8b5cf6');
      setTags([]);
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
          color,
          tags,
        });
        toast('Staff updated successfully!', 'success');
      } else {
        await createStaff({
          token,
          name,
          avatarUrl,
          color,
          tags,
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

            {/* Tags Area */}
            <div className="w-full border border-emerald-500/20 rounded-2xl p-4 bg-[#0a0a0b] text-left relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mb-3">التصنيفات (Categories)</p>
                  
                  <div className="mb-4 relative">
                    <input 
                      type="text" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="اكتب تصنيفاً واضغط Enter أو اختر من القائمة" 
                      className="w-full bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl pr-4 pl-12 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--color-brand)] placeholder:text-[var(--text-muted)] transition-colors shadow-inner"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = tagInput.trim();
                          if (val && !tags.includes(val)) {
                            toggleTag(val);
                            setTagInput('');
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                      onClick={() => {
                        const val = tagInput.trim();
                        if (val && !tags.includes(val)) {
                          toggleTag(val);
                          setTagInput('');
                        }
                      }}
                    >
                      <Plus size={18} />
                    </button>
                    
                    {allTags.filter(t => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())).length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {allTags
                            .filter(t => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase()))
                            .map(tag => {
                            return (
                              <button 
                                key={tag}
                                onClick={(e) => { e.preventDefault(); toggleTag(tag); setTagInput(''); }}
                                className="text-xs font-bold px-3 py-1.5 rounded border bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-emerald-500/50 transition-colors"
                              >
                                + {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {tags.map(tagId => (
                      <div 
                        key={tagId} 
                        className="text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl flex items-center justify-between transition-all border bg-white/10 border-white/10 text-white/90"
                      >
                        <span>{tagId}</span>
                        <button onClick={(e) => { e.preventDefault(); toggleTag(tagId); }} className="hover:text-red-400 bg-black/20 rounded-full p-1 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-xs text-white/20 font-bold italic">No tags added</p>
                    )}
                  </div>
               </div>
            </div>

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
