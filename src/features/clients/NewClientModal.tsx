import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const createClient = useMutation(api.clients.createClient);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const PRESET_AVATARS = [
    '/avatars/avatar_1.png',
    '/avatars/avatar_2.png',
    '/avatars/avatar_3.png',
    '/avatars/avatar_4.png',
    '/avatars/avatar_5.png',
    '/avatars/avatar_6.png',
    '/avatars/avatar_7.png',
    '/avatars/avatar_8.png',
    '/avatars/avatar_9.png',
    '/avatars/avatar_10.png',
  ];

  const PRESET_TAGS = [
    { id: 'تحصيل', label: 'تحصيل', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { id: 'فيس', label: 'فيس', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'مميزين', label: 'مميزين', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  ];

  if (!isOpen) return null;

  const toggleTag = (tagId: string) => {
    setTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        token,
        name,
      };
      
      if (email) payload.email = email;
      if (company) payload.company = company;
      
      const fullPhone = [phone1, phone2].filter(Boolean).join(', ');
      if (fullPhone) payload.phone = fullPhone;
      
      if (avatarUrl) payload.avatarUrl = avatarUrl;
      if (tags.length > 0) payload.tags = tags;

      await createClient(payload);
      
      toast('Client added successfully!', 'success');
      setName('');
      setEmail('');
      setCompany('');
      setPhone1('');
      setPhone2('');
      setAvatarUrl('');
      setTags([]);
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || 'Please try again.';
      toast(`Failed to add client: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden relative border border-white/5 bg-[#0a0a0b] rounded-[32px] animate-in zoom-in-95 duration-200" padding="none">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Add New Client</h2>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-white/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-4 mb-2">
             <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-2xl shadow-indigo-500/20">
                <div className="w-full h-full rounded-full bg-[#0a0a0b] p-1 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-2xl font-black text-white/20 uppercase">
                      {name ? name.slice(0, 2) : '?'}
                    </div>
                  )}
                </div>
             </div>
             <div className="flex flex-wrap justify-center gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button 
                    key={url} 
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 overflow-hidden",
                      avatarUrl === url ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-white/10'
                    )}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 ml-1">Client Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500/50 transition-colors font-medium text-sm"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 ml-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500/50 transition-colors font-medium text-sm"
                placeholder="Company Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500/50 transition-colors font-medium text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 ml-1">Phone (SIM 1)</label>
              <input
                type="tel"
                value={phone1}
                onChange={(e) => setPhone1(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500/50 transition-colors font-medium text-sm"
                placeholder="Primary Number"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 ml-1">Phone (SIM 2)</label>
              <input
                type="tel"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500/50 transition-colors font-medium text-sm"
                placeholder="Secondary Number"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 ml-1">Categories / Tags</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    tags.includes(tag.id) 
                      ? tag.color 
                      : "bg-white/5 text-white/40 border-white/5 hover:text-white/60"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20">
              {isSubmitting ? 'Saving...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
