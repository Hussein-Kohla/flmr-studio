import { useSettings } from "@/hooks/useSettings";
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Select } from '@/components/ui/Select';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (clientId: string) => void;
}

export function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const { t, language } = useSettings();
  const { token } = useAuth();
  const { toast } = useToast();
  const createClient = useMutation(api.clients.createClient);

  const [name, setName] = useLocalStorage('draft-client-name', '');
  const [email, setEmail] = useLocalStorage('draft-client-email', '');
  const [company, setCompany] = useLocalStorage('draft-client-company', '');
  const [phone1, setPhone1] = useLocalStorage('draft-client-phone1', '');
  const [phone2, setPhone2] = useLocalStorage('draft-client-phone2', '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState([{key: "", value: ""}].filter(Boolean));
  const [avatarUrl, setAvatarUrl] = useLocalStorage('draft-client-avatarUrl', '');
  const [color, setColor] = useLocalStorage('draft-client-color', '#8b5cf6');
  const [tags, setTags] = useLocalStorage<string[]>('draft-client-tags', []);
  const [clientType, setClientType] = useLocalStorage('draft-client-clientType', 'other');
  const [accountManager, setAccountManager] = useLocalStorage('draft-client-accountManager', '');
  const [collectionOfficer, setCollectionOfficer] = useLocalStorage('draft-client-collectionOfficer', '');

  const CLIENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

const PRESET_AVATARS = [
    '/avatars/doctor_male.png', '/avatars/doctor_female.png', '/avatars/engineer_male.png', '/avatars/engineer_female.png', '/avatars/business_male.png', '/avatars/business_female.png'];

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
      if (clientType) payload.clientType = clientType;
      if (accountManager) payload.accountManager = accountManager;
      if (collectionOfficer) payload.collectionOfficer = collectionOfficer;
      if (customFields) payload.customFields = customFields.filter(f => f.key.trim() !== "");
      if (color) payload.color = color;

      const newClientId = await createClient(payload);
      
      toast('Client added successfully!', 'success');
      setName('');
      setEmail('');
      setCompany('');
      setPhone1('');
      setPhone2('');
      setAvatarUrl('');
      setTags([]);
      setClientType('other');
      setAccountManager('');
      setCollectionOfficer('');
      onClose();
      if (onSuccess && newClientId) {
        onSuccess(newClientId);
      }
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
      <Card className="w-full max-w-md shadow-2xl overflow-hidden relative border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[32px] animate-in zoom-in-95 duration-200" padding="none">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Add New Client</h2>
          <button onClick={onClose} className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] rounded-full transition-colors">
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-4 mb-2">
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
             <div className="flex flex-wrap justify-center gap-2 mt-4 mb-2">
                {CLIENT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                      color === c ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-60'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
             </div>
  </div>

          <Input
            label={`${t("clientNameLabel")} *`}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("egJohnDoe")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("companyLabel")}
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t("companyNamePlaceholder")}
            />
            <Input
              label={t("emailUppercase")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("phoneSim1Label")}
              type="tel"
              value={phone1}
              onChange={(e) => setPhone1(e.target.value)}
              placeholder={t("primaryNumber")}
            />
            <Input
              label={t("phoneSim2Label")}
              type="tel"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              placeholder={t("secondaryNumber")}
            />
          </div>

          
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              {language === 'ar' ? 'حقول إضافية' : 'Custom Fields'}
            </label>
            {customFields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input 
                  type="text"
                  placeholder={language === 'ar' ? "اسم الحقل" : "Field Name"}
                  value={field.key}
                  onChange={e => {
                    const newFields = [...customFields];
                    newFields[idx].key = e.target.value;
                    setCustomFields(newFields);
                  }}
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-[var(--color-brand)] outline-none"
                />
                <input 
                  type="text"
                  placeholder={language === 'ar' ? "القيمة" : "Value"}
                  value={field.value}
                  onChange={e => {
                    const newFields = [...customFields];
                    newFields[idx].value = e.target.value;
                    setCustomFields(newFields);
                  }}
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-[var(--color-brand)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                  className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCustomFields([...customFields, { key: '', value: '' }])}
              className="h-12 border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl flex items-center justify-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <Plus size={18} /> {language === 'ar' ? 'إضافة حقل جديد' : 'Add Custom Field'}
            </button>
          </div>
  

          {/* CRM Fields */}
          <div className="grid grid-cols-1 gap-4 border-t border-[var(--border-subtle)] pt-4">
            <Select
              label={t("clientTypeServiceLabel")}
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
            >
              <option value="fb_ads">Facebook Ads (إعلانات فيس بوك)</option>
              <option value="video_editing">Video Editing (مونتاج)</option>
              <option value="photography">Photography (تصوير)</option>
              <option value="design">Graphic Design (تصميم)</option>
              <option value="other">Other (أخرى)</option>
            </Select>

            
          </div>

          <div className="flex flex-col gap-1 w-full bg-[var(--bg-surface)] px-4 py-2.5 border border-[var(--border-default)] rounded-[18px]">
            <span className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-1">Categories / Tags</span>
            <div className="flex flex-wrap gap-2 py-1">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    tags.includes(tag.id) 
                      ? tag.color 
                      : "bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-[var(--color-brand)] hover:bg-[var(--color-brand-dim)] text-white shadow-lg shadow-[var(--color-brand-glow)]">
              {isSubmitting ? 'Saving...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
