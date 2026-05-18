import React, { useState } from 'react';
import { X, Phone, MapPin, CheckCircle2, MessageSquare, TrendingUp, 
User, Edit2, Mail, Briefcase, Pencil, Check, Trash2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { DatePicker } from '@/components/ui/DatePicker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PromptDialog } from '@/components/ui/PromptDialog';
import { motion } from 'framer-motion';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TABS = [
  { id: 'finance', label: 'Financial Records' },
  { id: 'monthly', label: 'Monthly Payments' },
] as const;

export function ClientDetailsModal({ isOpen, onClose, client }: ClientDetailsModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'finance' | 'monthly'>('finance');
  const [newPayment, setNewPayment] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], status: 'paid' as 'paid' | 'pending' });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentData, setEditingPaymentData] = useState({ amount: '' as string | number, description: '', date: '', status: 'paid' as 'paid' | 'pending' });
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthEditData, setMonthEditData] = useState({ amount: '' as string | number, status: 'pending', updateGlobal: false, year: new Date().getFullYear() });
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  
  // Use transactions instead of payments for subscription tracking
  const transactionsData = useQuery(api.transactions.getTransactions, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');
  const transactions = transactionsData?.page || [];
  
  const updateClient = useMutation(api.clients.updateClient);
  const generateUploadUrl = useMutation(api.clients.generateUploadUrl);
  const createPayment = useMutation(api.transactions.createTransaction);
  const updatePayment = useMutation(api.transactions.updateTransaction);
  const deletePayment = useMutation(api.transactions.deleteTransaction);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    tags: [] as string[],
    subscription: {
      amountCents: 0,
      dueDay: 1,
      paidMonths: [] as number[],
      monthAmounts: [] as { month: number, amountCents: number }[],
    },
    avatarUrl: '',
    avatarId: undefined as string | undefined,
    notes: '',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean,
    title: string,
    description: string,
    defaultValue: string,
    type: 'text' | 'number',
    onConfirm: (val: string) => void
  }>({
    isOpen: false,
    title: '',
    description: '',
    defaultValue: '',
    type: 'text',
    onConfirm: () => {}
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (client && !isEditing) {
      const sub = client.subscription || { amountCents: 0, dueDay: 1, paidMonths: [], monthAmounts: [] };
      // Handle legacy 'amount' field if amountCents is missing
      const amountCents = sub.amountCents ?? (sub.amount ? sub.amount * 100 : 0);
      const monthAmounts = (sub.monthAmounts || []).map((ma: any) => ({
        month: ma.month,
        amountCents: ma.amountCents ?? (ma.amount ? ma.amount * 100 : 0)
      }));

      setFormData({
        name: client.name || '',
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        tags: client.tags || [],
        subscription: {
          ...sub,
          amountCents,
          monthAmounts
        },
        avatarUrl: client.avatarUrl || '',
        avatarId: client.avatarId,
        notes: client.notes || '',
      });
    }
  }, [client, isEditing]);

  if (!isOpen || !client) return null;

  // Client-specific payments using transactions
  const clientPayments = transactions?.filter(p => p.clientId === client._id) || [];

  const totalPaid = clientPayments
    .filter(p => p.status === 'posted' || p.status === 'paid')
    .reduce((acc, p) => acc + (p.amountCents || 0), 0);
  const totalRecords = clientPayments.length;

  const filteredPayments = [...clientPayments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const handleAddPayment = async () => {
    if (!token || !newPayment.amount || isAddingPayment) return;
    setIsAddingPayment(true);
    try {
      await createPayment({
        token,
        clientId: client._id,
        type: newPayment.status === 'paid' ? 'income' : 'pending',
        amount: Number(newPayment.amount),
        description: newPayment.description || 'Manual Payment',
        category: 'Manual',
        date: new Date(newPayment.date).getTime(),
        source: 'Manual',
      });
      // Reset the form completely - each addition is independent
      setNewPayment({ amount: '', description: '', date: new Date().toISOString().split('T')[0], status: 'paid' });
      toast("Payment added successfully", "success");
    } catch (e) {
      toast("Failed to add payment", "error");
    } finally {
      setIsAddingPayment(false);
    }
  };

  const handleToggleStatus = async (_paymentId: any, _currentStatus: string) => {
    // Function disabled per user request to make statuses read-only
    return;
  };

  const handleStartEdit = (payment: any) => {
    setEditingPaymentId(payment._id);
    setEditingPaymentData({ 
      amount: payment.amountCents / 100, 
      description: payment.description || '',
      date: new Date(payment.date || payment.createdAt).toISOString().split('T')[0],
      status: payment.status || 'paid'
    });
  };

  const handleSaveEdit = async (paymentId: any) => {
    if (!token) return;
    try {
      await updatePayment({ 
        token, 
        transactionId: paymentId, 
        amount: Number(editingPaymentData.amount),
        description: editingPaymentData.description,
        status: editingPaymentData.status,
        date: new Date(editingPaymentData.date).getTime()
      });
      setEditingPaymentId(null);
      toast("Payment updated successfully", "success");
    } catch (e) {
      toast("Failed to update payment", "error");
    }
  };

  const handleMonthUpdate = async () => {
    if (!token || selectedMonthIndex === null) return;
    
    const isPaid = monthEditData.status === 'paid';
    const amountCentsToSave = Math.round(Number(monthEditData.amount) * 100) || 0;
    const targetYear = monthEditData.year || selectedYear;
    
    // Deduplication logic: Find if a payment for this month/year already exists
    const existingPayment = clientPayments.find(p => 
      p.subscriptionMonth === selectedMonthIndex && 
      p.subscriptionYear === targetYear
    );

    const currentPaidMonths = formData.subscription?.paidMonths || [];
    let newPaidMonths = isPaid 
      ? [...new Set([...currentPaidMonths, selectedMonthIndex])]
      : currentPaidMonths.filter(m => m !== selectedMonthIndex);

    const currentMonthAmounts = formData.subscription?.monthAmounts || [];
    let newMonthAmounts = [...currentMonthAmounts];
    
    const existingOverrideIndex = newMonthAmounts.findIndex(ma => ma.month === selectedMonthIndex);
    if (existingOverrideIndex > -1) {
      newMonthAmounts[existingOverrideIndex] = { month: selectedMonthIndex, amountCents: amountCentsToSave };
    } else {
      newMonthAmounts.push({ month: selectedMonthIndex, amountCents: amountCentsToSave });
    }

    const newSubscription = {
      ...formData.subscription,
      amountCents: monthEditData.updateGlobal ? amountCentsToSave : formData.subscription.amountCents,
      paidMonths: newPaidMonths,
      monthAmounts: newMonthAmounts
    };

    setFormData({
      ...formData,
      subscription: newSubscription
    });

    try {
      if (existingPayment) {
        // Update existing record
        await updatePayment({
          token,
          transactionId: existingPayment._id,
          amount: amountCentsToSave / 100, // API expects currency units for amount but saves in cents
          status: monthEditData.status,
          description: `Subscription - ${MONTHS[selectedMonthIndex]} ${targetYear}`
        });
      } else if (isPaid) {
        // Create new record only if it's being marked as paid for the first time
        await createPayment({
          token,
          clientId: client._id,
          amount: amountCentsToSave / 100,
          status: 'paid',
          type: 'income',
          category: 'Subscriptions',
          subscriptionMonth: selectedMonthIndex,
          subscriptionYear: targetYear,
          description: `Subscription - ${MONTHS[selectedMonthIndex]} ${targetYear}`,
          date: new Date(targetYear, selectedMonthIndex, formData.subscription.dueDay).getTime()
        });
      }
    } catch (e) {
      console.error("Failed to sync payment record:", e);
    }

    toast(`${MONTHS[selectedMonthIndex]} ${targetYear} updated successfully`, "success");
    setSelectedMonthIndex(null);
  };

  const handleMonthClick = (index: number) => {
    setSelectedMonthIndex(index);
    const monthOverride = (formData.subscription?.monthAmounts || []).find(ma => ma.month === index);
    const currentAmountCents = monthOverride ? monthOverride.amountCents : formData.subscription.amountCents;
    
    // Check if this month/year is paid based on payments (status is 'posted')
    clientPayments.some(p => 
      p.subscriptionMonth === index && 
      p.subscriptionYear === selectedYear && 
                      (p.status === 'posted' || p.status === 'paid')
    );
    
    setMonthEditData({
      amount: currentAmountCents / 100,
      status: 'paid',
      updateGlobal: false,
      year: selectedYear
    });
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Update month edit data with new year
    setMonthEditData(prev => ({ ...prev, year }));
  };



  const handleQuickSave = async (newSubscription: any) => {
    if (!token) return;
    try {
      await updateClient({
        token,
        clientId: client._id,
        subscription: newSubscription
      });
      toast("Subscription updated", "success");
    } catch (e) {
      toast("Failed to update subscription", "error");
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const payload: any = { token, clientId: client._id, ...formData };
      if (!payload.avatarId) delete payload.avatarId;
      await updateClient(payload);
      setIsEditing(false);
      toast("Client updated successfully", "success");
    } catch (e: any) {
      console.error(e);
      toast(e.message || "Failed to update client", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!token || !deleteConfirmId) return;
    setIsDeletingRecord(true);
    try {
      await deletePayment({ token, transactionId: deleteConfirmId as any });
      setDeleteConfirmId(null);
      toast("Record deleted successfully", "success");
    } catch (e) {
      toast("Failed to delete record", "error");
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    try {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatarUrl: previewUrl }));

      const postUrl = await generateUploadUrl({ token });
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setFormData(prev => ({ ...prev, avatarId: storageId }));
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const CLIENT_TAGS = [
    { id: 'تحصيل', label: 'تحصيل', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { id: 'فيس', label: 'فيس', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'مميزين', label: 'مميزين', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  ];

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) 
        ? prev.tags.filter(t => t !== tagId) 
        : [...prev.tags, tagId]
    }));
  };
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Split phones by comma or space
  const phoneNumbers = formData.phone.split(/[,/\s]+/).filter(p => p.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-10 animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl bg-[#0a0a0b] rounded-[40px] shadow-2xl overflow-hidden border border-white/5 flex flex-col max-h-full relative"
      >
        {/* Close & Edit Buttons */}
        <div className="absolute top-8 right-8 z-50 flex gap-3">
          {isEditing ? (
            <Button 
              size="sm" 
              className="rounded-full px-6 bg-emerald-500 hover:bg-emerald-600 h-10 font-bold shadow-lg shadow-emerald-500/20"
              onClick={handleSave}
              loading={isSaving}
            >
              Save Changes
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="secondary"
              className="rounded-full w-10 h-10 p-0 bg-white/5 border-white/5 hover:bg-white/10"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={18} />
            </Button>
          )}
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
          {/* Top Branding/Header */}
          <div className="flex items-center gap-3 mb-10 flex-wrap">
            <h2 className="text-4xl font-black text-white tracking-tight">Clients</h2>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
              <User size={18} />
            </div>
            
            <div className="flex gap-2 ml-4">
              {isEditing ? (
                CLIENT_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                      formData.tags.includes(tag.id) 
                        ? tag.color 
                        : "bg-white/5 text-white/20 border-white/5 hover:text-white/40"
                    )}
                  >
                    {tag.label}
                  </button>
                ))
              ) : (
                <>
                  {formData.tags.length > 0 ? (
                    formData.tags.map(tagId => {
                      const tag = CLIENT_TAGS.find(t => t.id === tagId);
                      return (
                        <Badge key={tagId} className={cn("border-none text-[10px] font-black uppercase tracking-widest px-3 py-1", tag?.color || "bg-white/5 text-white/40")}>
                          {tagId}
                        </Badge>
                      );
                    })
                  ) : (
                    <Badge variant="muted" className="bg-white/5 border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">General</Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Top Grid: 3 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Column 1: Profile Card */}
            <Card glass className="p-8 flex flex-col items-center text-center border-white/5 rounded-[32px] relative overflow-hidden group">
               <div className="absolute top-4 right-4">
                 <Badge variant="warning" className="bg-orange-500/10 text-orange-500 border-none text-[8px] font-black uppercase tracking-tighter">Repeated</Badge>
               </div>
               
               <div 
                 className={cn(
                   "w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[var(--color-brand)] to-purple-500 mb-6 transition-transform group-hover:scale-105 relative",
                   isEditing && "cursor-pointer hover:brightness-125"
                 )}
                 onClick={() => isEditing && fileInputRef.current?.click()}
               >
                 <div className="w-full h-full rounded-full bg-[#0a0a0b] p-1 overflow-hidden relative flex items-center justify-center">
                     {formData.avatarUrl ? (
                       <img 
                         src={formData.avatarUrl} 
                         alt={client.name} 
                         className="w-full h-full rounded-full object-cover"
                       />
                     ) : (
                       <div className={cn("w-full h-full rounded-full flex items-center justify-center text-4xl font-black text-white uppercase", getAvatarColor(formData.name || client.name))}>
                         {getInitials(formData.name || client.name)}
                       </div>
                     )}
                     {isEditing && (
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                         <Edit2 size={24} />
                       </div>
                     )}
                  </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
               </div>

               {isEditing ? (
                 <div className="space-y-3 w-full mb-6">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Quick Select Avatar</p>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {PRESET_AVATARS.map((url, i) => (
                        <button 
                          key={i} 
                          onClick={() => setFormData({...formData, avatarUrl: url, avatarId: undefined})}
                          className={cn(
                            "w-10 h-10 rounded-full border-2 transition-all hover:scale-110 overflow-hidden",
                            formData.avatarUrl === url ? "border-[var(--color-brand)] scale-110 shadow-lg shadow-[var(--color-brand)]/20" : "border-white/10"
                          )}
                        >
                          <img src={url} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                   <input 
                     type="text" 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center text-lg font-bold text-white outline-none focus:border-[var(--color-brand)]"
                     placeholder="Name"
                   />
                   <input 
                     type="email" 
                     value={formData.email} 
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-1 text-center text-xs text-white/60 outline-none focus:border-[var(--color-brand)]"
                     placeholder="Email"
                   />
                    <div className="flex flex-col gap-2 w-full">
                      <div className="relative">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest absolute -top-2 left-3 bg-[#0a0a0b] px-1">SIM 1</p>
                        <input 
                          type="tel" 
                          value={phoneNumbers[0] || ''} 
                          onChange={e => {
                            const nums = [...phoneNumbers];
                            nums[0] = e.target.value;
                            setFormData({...formData, phone: nums.filter(Boolean).join(', ')});
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center text-xs text-white outline-none focus:border-[var(--color-brand)]"
                          placeholder="Primary Phone"
                        />
                      </div>
                      <div className="relative">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest absolute -top-2 left-3 bg-[#0a0a0b] px-1">SIM 2</p>
                        <input 
                          type="tel" 
                          value={phoneNumbers[1] || ''} 
                          onChange={e => {
                            const nums = [phoneNumbers[0] || '', e.target.value];
                            setFormData({...formData, phone: nums.filter(Boolean).join(', ')});
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center text-xs text-white outline-none focus:border-[var(--color-brand)]"
                          placeholder="Secondary Phone"
                        />
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="mb-8">
                   <h3 className="text-2xl font-black text-white mb-2">{client.name}</h3>
                   <p className="text-white/40 text-sm font-medium mb-1">{client.email || 'no-email@studio.com'}</p>
                 </div>
               )}

               {!isEditing && (
                 <div className="flex flex-col gap-3 w-full">
                   <Button 
                     className="rounded-2xl h-12 font-bold bg-[#5850ec] hover:bg-[#4840cc] text-white border-none shadow-lg shadow-[#5850ec]/20" 
                     leftIcon={<Mail size={16} />}
                     onClick={() => window.location.href = `mailto:${formData.email}`}
                   >
                     Email Client
                   </Button>
                    <div className="flex flex-col gap-2">
                      {phoneNumbers.map((num, i) => (
                        <Button 
                          key={i}
                          variant="secondary" 
                          className="rounded-2xl h-12 font-bold bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-500" 
                          leftIcon={<MessageSquare size={16} />}
                          onClick={() => window.open(`https://wa.me/${num.replace(/\D/g, '')}`, '_blank')}
                        >
                          {phoneNumbers.length > 1 ? `WhatsApp (SIM ${i + 1})` : 'WhatsApp'}
                        </Button>
                      ))}
                    </div>
                 </div>
               )}
            </Card>

            {/* Column 2: Geographics Card */}
            <Card glass className="p-8 border-white/5 rounded-[32px] flex flex-col">
              <h4 className="text-2xl font-black text-white mb-8">Geographics</h4>
              
              <div className="space-y-6 flex-1">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Contact</p>
                    <div className="flex flex-wrap gap-2">
                      {phoneNumbers.length > 0 ? phoneNumbers.map((num, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs font-black text-white/90 shadow-sm">
                          {num}
                        </div>
                      )) : (
                        <p className="text-sm font-bold text-white/40 italic">No numbers set</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec] group-hover:scale-110 transition-transform shrink-0">
                    <Briefcase size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">Company Name</p>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.company} 
                        onChange={e => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:border-[var(--color-brand)]"
                        placeholder="Company Name"
                      />
                    ) : (
                      <p className="text-sm font-bold text-white/80">{formData.company || 'Not Specified'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">Address</p>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:border-[var(--color-brand)]"
                        placeholder="Client Address"
                      />
                    ) : (
                      <p className="text-sm font-bold text-white/80">{formData.address || 'No address provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-white/40">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Repeated Client</span>
              </div>
            </Card>

             {/* Column 3: Stats Cards */}
            <div className="flex flex-col gap-6">
                <Card glass className="p-8 border-white/5 rounded-[32px] flex flex-col justify-center relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-black text-white">Records</h4>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter">{totalRecords}</span>
                    <span className="text-white/40 font-bold">(Total)</span>
                  </div>
                  <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mt-4">Finance History</p>
               </Card>

               <Card glass className="p-8 border-white/5 rounded-[32px] flex flex-col justify-center relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-black text-white">Revenue</h4>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter">{formatCurrency(totalPaid)}</span>
                  </div>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-4">Total Collected</p>
               </Card>

               <Card glass className="p-8 border-white/5 rounded-[32px] flex flex-col justify-center relative overflow-hidden bg-brand/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-black text-white">Balance</h4>
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                      <Briefcase size={18} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-4xl font-black tracking-tighter",
                      (client.balanceCents || 0) >= 0 ? "text-emerald-400" : "text-rose-500"
                    )}>
                      {formatCurrency(client.balanceCents || 0)}
                    </span>
                  </div>
                  <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-4">Net Account Status</p>
               </Card>
            </div>

          </div>

          {/* Bottom Section: Tabs & Content */}
          <div className="mt-12">
            <div className="flex items-center gap-10 mb-8 border-b border-white/5 overflow-x-auto custom-scrollbar whitespace-nowrap">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "pb-6 text-sm font-black transition-all relative uppercase tracking-widest",
                    activeTab === tab.id ? "text-[#5850ec]" : "text-white/30 hover:text-white/50"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="clientTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#5850ec] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'finance' ? (
              <div className="space-y-8">
                {/* Add Payment Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Amount</p>
                     <input 
                       type="number" 
                       value={newPayment.amount}
                       onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                       placeholder="0.00"
                       className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-brand)]"
                     />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Description</p>
                     <input 
                       type="text" 
                       value={newPayment.description}
                       onChange={e => setNewPayment({...newPayment, description: e.target.value})}
                       placeholder="e.g. Logo Design"
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-brand)]"
                     />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Date</p>
                      <DatePicker 
                        value={newPayment.date}
                        onChange={(date) => setNewPayment(prev => ({...prev, date}))}
                      />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Status</p>
                      <div className="flex gap-2 p-1 bg-black/20 border border-white/10 rounded-xl h-[50px]">
                        <button 
                          onClick={() => setNewPayment({...newPayment, status: 'paid'})}
                          className={cn(
                            "flex-1 rounded-lg text-[10px] font-black uppercase transition-all",
                            newPayment.status === 'paid' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-white/20 hover:text-white/40"
                          )}
                        >
                          Paid
                        </button>
                        <button 
                          onClick={() => setNewPayment({...newPayment, status: 'pending'})}
                          className={cn(
                            "flex-1 rounded-lg text-[10px] font-black uppercase transition-all",
                            newPayment.status === 'pending' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-white/20 hover:text-white/40"
                          )}
                        >
                          Pending
                        </button>
                      </div>
                   </div>
                   <div className="flex items-end">
                     <Button 
                       className="w-full h-[50px] rounded-xl font-bold bg-[#5850ec] hover:bg-[#4840cc]" 
                       onClick={handleAddPayment}
                       loading={isAddingPayment}
                       disabled={!newPayment.amount}
                     >
                       Add Record
                     </Button>
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5">
                        <th className="py-6 px-4">Date</th>
                        <th className="py-6 px-4">Description</th>
                        <th className="py-6 px-4 text-right">Amount</th>
                        <th className="py-6 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-white/20 font-bold uppercase tracking-widest">No financial records found</td>
                        </tr>
                      ) : (
                        filteredPayments.map((p) => (
                          <tr key={p._id} className="group hover:bg-white/[0.02] transition-all">
                            <td className="py-6 px-4">
                              {editingPaymentId === p._id ? (
                                <DatePicker 
                                  value={editingPaymentData.date}
                                  onChange={date => setEditingPaymentData({...editingPaymentData, date})}
                                />
                              ) : (
                                <span className="text-white/80 font-bold text-sm">{formatDate(p.date || p.createdAt)}</span>
                              )}
                            </td>
                            <td className="py-6 px-4">
                              {editingPaymentId === p._id ? (
                                <input 
                                  type="text"
                                  value={editingPaymentData.description}
                                  onChange={e => setEditingPaymentData({...editingPaymentData, description: e.target.value})}
                                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-full text-white outline-none focus:border-indigo-500"
                                />
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-white font-bold text-sm">{p.description || 'Manual Payment'}</span>
                                  <span className="text-white/40 text-[10px] uppercase font-black mt-0.5 tracking-wider">Ref: {p._id.slice(-6)}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-6 px-4 text-right">
                              {editingPaymentId === p._id ? (
                                <input 
                                  type="number"
                                  value={editingPaymentData.amount}
                                  onChange={e => setEditingPaymentData({...editingPaymentData, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-24 text-right text-white outline-none focus:border-indigo-500"
                                />
                              ) : (
                                <span className="text-white font-bold text-sm">
                                  {formatCurrency(p.amountCents || 0)}
                                </span>
                              )}
                            </td>
                            <td className="py-6 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {editingPaymentId === p._id ? (
                                  <div className="flex gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
                                    <button 
                                      onClick={() => setEditingPaymentData({...editingPaymentData, status: 'paid'})}
                                      className={cn(
                                        "px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all",
                                        editingPaymentData.status === 'paid' ? "bg-emerald-500 text-white" : "text-white/20"
                                      )}
                                    >
                                      Paid
                                    </button>
                                    <button 
                                      onClick={() => setEditingPaymentData({...editingPaymentData, status: 'pending'})}
                                      className={cn(
                                        "px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all",
                                        editingPaymentData.status === 'pending' ? "bg-orange-500 text-white" : "text-white/20"
                                      )}
                                    >
                                      Pending
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleToggleStatus(p._id, p.status || 'posted')}
                                    disabled={false}
                                  >
                                    <Badge 
                                      variant={(p.status === 'paid' || p.status === 'posted') ? 'success' : 'warning'} 
                                      className={cn(
                                        "uppercase text-[10px] font-black px-4 py-1 rounded-xl border-none transition-all",
                                        (p.status !== 'paid' && p.status !== 'posted') && "cursor-pointer hover:scale-105 active:scale-95"
                                      )}
                                    >
                                      {(p.status === 'paid' || p.status === 'posted') ? 'PAID' : 'PENDING'}
                                    </Badge>
                                  </button>
                                )}
                                
                                {editingPaymentId === p._id ? (
                                  <button 
                                    onClick={() => handleSaveEdit(p._id)}
                                    className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                  >
                                    <Check size={14} />
                                  </button>
                                ) : (
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleStartEdit(p)}
                                    className="p-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setDeleteConfirmId(p._id)}
                                    className="p-2 bg-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                   <Card 
                     glass 
                     className="p-6 border-white/5 rounded-3xl flex flex-col gap-2 cursor-pointer hover:bg-white/5 transition-all group"
                     onClick={() => {
                      setPromptConfig({
                        isOpen: true,
                        title: 'Monthly Subscription',
                        description: 'Enter new monthly subscription amount',
                        defaultValue: (formData.subscription?.amountCents / 100 || 0).toString(),
                        type: 'number',
                        onConfirm: (val) => {
                          const newAmount = Number(val);
                          if (!isNaN(newAmount)) {
                            const newSub = { ...(formData.subscription || {amountCents: 0, dueDay: 1, paidMonths: []}), amountCents: Math.round(newAmount * 100) };
                            setFormData({ ...formData, subscription: newSub });
                            if (!isEditing) handleQuickSave(newSub);
                          }
                        }
                      });
                    }}
                   >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Monthly Subscription</p>
                        <Edit2 size={10} className="text-white/20 group-hover:text-white transition-colors" />
                      </div>
                      <h5 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">{formatCurrency(formData.subscription?.amountCents || 0)}</h5>
                   </Card>
                   <Card glass className="p-6 border-white/5 rounded-3xl flex flex-col gap-2 cursor-pointer hover:bg-white/5 transition-all group" onClick={() => {
                      setPromptConfig({
                        isOpen: true,
                        title: 'Collection Day',
                        description: 'Enter new collection day (1-31)',
                        defaultValue: (formData.subscription?.dueDay || 1).toString(),
                        type: 'number',
                        onConfirm: (val) => {
                          const newDay = Number(val);
                          if (!isNaN(newDay)) {
                            const newSub = { ...(formData.subscription || {amountCents: 0, dueDay: 1, paidMonths: []}), dueDay: newDay };
                            setFormData({ ...formData, subscription: newSub });
                            if (!isEditing) handleQuickSave(newSub);
                          }
                        }
                      });
                   }}>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Collection Day</p>
                        <Edit2 size={10} className="text-white/20 group-hover:text-white transition-colors" />
                      </div>
                      <h5 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">{formData.subscription?.dueDay || 1}<span className="text-sm text-white/40 ml-2">th of Month</span></h5>
                   </Card>
                   <Card glass className="p-6 border-white/5 rounded-3xl flex flex-col relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Client Notes</p>
                        <MessageSquare size={12} className="text-white/20" />
                      </div>
                      <textarea 
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value } as any)}
                        placeholder="Add a quick note..."
                        className="bg-transparent border-none outline-none text-[11px] font-medium text-white/60 resize-none h-full w-full placeholder:text-white/10 scrollbar-hide min-h-[40px]"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400/30 to-orange-500/30"></div>
                   </Card>
                </div>

                {/* Year Selector */}
                <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Calendar size={18} className="text-[#5850ec]" />
                  <span className="text-sm font-bold text-white/60">Year:</span>
                  <div className="flex gap-2">
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                      <button
                        key={year}
                        onClick={() => handleYearChange(year)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-black transition-all",
                          selectedYear === year 
                            ? "bg-[#5850ec] text-white shadow-lg shadow-[#5850ec]/20" 
                            : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-white/40 ml-auto">
                    Showing payments for {selectedYear}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {MONTHS.map((month, index) => {
                    // Check if this month/year is paid based on actual payment records (status is 'posted')
                    const isPaid = clientPayments.some(p => 
                      p.subscriptionMonth === index && 
                      p.subscriptionYear === selectedYear && 
                                      (p.status === 'posted' || p.status === 'paid')
                    );
                    const monthOverride = (formData.subscription?.monthAmounts || []).find(ma => ma.month === index);
                    const monthAmountCents = monthOverride ? monthOverride.amountCents : formData.subscription.amountCents;
                    const isCurrentMonth = index === new Date().getMonth() && selectedYear === new Date().getFullYear();
                    
                    return (
                      <button
                        key={`${month}-${selectedYear}`}
                        onClick={() => handleMonthClick(index)}
                        className={cn(
                          "relative group p-6 rounded-[32px] border transition-all flex flex-col items-center justify-center gap-2 overflow-hidden min-h-[140px]",
                          isPaid 
                            ? "bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5" 
                            : isCurrentMonth
                              ? "bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10 animate-pulse"
                              : "bg-orange-500/5 border-orange-500/10"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          isPaid ? "text-emerald-400/60" : "text-orange-400/60"
                        )}>{month}</span>
                        
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-lg font-black uppercase tracking-widest",
                            isPaid ? "text-emerald-400" : "text-orange-400"
                          )}>
                            {isPaid ? 'PAID' : 'PENDING'}
                          </span>
                          <span className={cn(
                            "text-sm font-bold mt-1",
                            isPaid ? "text-emerald-400/40" : "text-orange-400/40"
                          )}>
                            {formatCurrency(monthAmountCents)}
                          </span>
                        </div>

                        {isPaid && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                          >
                            <CheckCircle2 size={12} className="text-white" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Month Quick Edit Modal */}
            {selectedMonthIndex !== null && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#121214] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl relative"
                >
                  <button 
                    onClick={() => setSelectedMonthIndex(null)}
                    className="absolute top-6 right-6 text-white/20 hover:text-white"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">{MONTHS[selectedMonthIndex]} {monthEditData.year}</h4>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Update Payment Record</p>
                      </div>
                    </div>

                    {/* Year Selection in Modal */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <Calendar size={16} className="text-[#5850ec]" />
                      <span className="text-xs text-white/40 font-bold">Year:</span>
                      <div className="flex gap-1">
                        {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                          <button
                            key={year}
                            onClick={() => setMonthEditData({...monthEditData, year})}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-black transition-all",
                              monthEditData.year === year 
                                ? "bg-[#5850ec] text-white" 
                                : "text-white/40 hover:text-white"
                            )}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">المبلغ (جنيه)</p>
                        <input 
                          type="number"
                          value={monthEditData.amount}
                          onChange={e => setMonthEditData({...monthEditData, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setMonthEditData({...monthEditData, status: 'pending'})}
                          className={cn(
                            "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border",
                            monthEditData.status === 'pending' ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/5 border-white/10 text-white/40"
                          )}
                        >
                          Pending
                        </button>
                        <button 
                          onClick={() => setMonthEditData({...monthEditData, status: 'paid'})}
                          className={cn(
                            "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border",
                            monthEditData.status === 'paid' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/10 text-white/40"
                          )}
                        >
                          Paid
                        </button>
                      </div>

                      <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                        <input 
                          type="checkbox"
                          checked={monthEditData.updateGlobal}
                          onChange={e => setMonthEditData({...monthEditData, updateGlobal: e.target.checked})}
                          className="w-5 h-5 rounded-lg accent-indigo-500"
                        />
                        <span className="text-sm font-bold text-white/80">Update global subscription amount</span>
                      </label>
                    </div>

                    <Button 
                      className="w-full py-6 rounded-2xl font-black uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 shadow-xl shadow-indigo-500/20"
                      onClick={handleMonthUpdate}
                    >
                      Apply Changes
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog 
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleDeletePayment}
          isLoading={isDeletingRecord}
          title="Delete Record"
          description="Are you sure you want to delete this financial record? This action cannot be undone."
          confirmText="Delete Record"
          variant="danger"
        />

        <PromptDialog 
          isOpen={promptConfig.isOpen}
          onClose={() => setPromptConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={promptConfig.onConfirm}
          title={promptConfig.title}
          description={promptConfig.description}
          defaultValue={promptConfig.defaultValue}
          type={promptConfig.type}
        />
      </motion.div>
    </div>
  );
}
