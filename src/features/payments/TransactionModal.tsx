import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, PenTool, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';

import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
}

export function TransactionModal({ isOpen, onClose, type }: TransactionModalProps) {
  const [amount, setAmount] = useLocalStorage('draft-tx-amount', '');
  const [description, setDescription] = useLocalStorage('draft-tx-description', '');
  const [date, setDate] = useLocalStorage('draft-tx-date', new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useLocalStorage('draft-tx-category', 'General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { token } = useAuth();
  const createTransaction = useMutation(api.transactions.createTransaction);

  if (!isOpen) return null;

  const isIncome = type === 'income';
  const colorClass = isIncome ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !amount || !description) return;
    
    setIsSubmitting(true);
    try {
      await createTransaction({
        token,
        type,
        amount: parseFloat(amount),
        description,
        category,
        date: new Date(date).getTime(),
        source: 'Manual',
      });
      setAmount('');
      setDescription('');
      setCategory('General');
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {isIncome ? 'Add New Income' : 'Add New Expense'}
          </h2>
          <button onClick={onClose} className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] rounded-full transition-colors">
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Amount Input */}
          <div>
            <label className="form-label text-right">Amount</label>
            <div className="relative flex items-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] focus-within:border-[var(--color-brand)] transition-all overflow-hidden shadow-sm">
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent border-none outline-none p-4 text-2xl font-bold text-[var(--text-primary)]"
                dir="ltr"
              />
              <div className="pr-4 flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-black text-xs">جنيه</span>
                <Wallet className={`w-6 h-6 ${colorClass}`} />
              </div>
            </div>
          </div>

          {/* Optional Invoice Image */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 text-right">Invoice Image (Optional)</label>
            <div className="flex items-center gap-4">
              <button type="button" className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 hover:bg-blue-500/20 transition-colors">
                <ImageIcon size={24} />
              </button>
              <div className="flex-1 text-sm text-[var(--text-muted)]">
                Attach an image or receipt for this transaction.
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="form-label text-right">Description</label>
            <div className="relative flex items-center bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] focus-within:border-[var(--color-brand)] transition-all overflow-hidden px-4 shadow-sm">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Income source or notes..."
                className="flex-1 bg-transparent border-none outline-none py-4 text-[var(--text-primary)] text-sm"
              />
              <PenTool className="w-4 h-4 text-[var(--text-muted)] ml-2" />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 text-right">Category</label>
            <button type="button" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[var(--border-subtle)] rounded-xl text-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-colors font-medium">
              <Plus size={18} />
              New Category
            </button>
          </div>

          {/* Date Input */}
          <div>
            <DatePicker
              label="Date"
              value={date}
              onChange={setDate}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full py-6 text-lg font-bold shadow-xl shadow-brand/20 mt-4 rounded-xl"
            variant="primary"
            disabled={isSubmitting || !amount || !description}
          >
            {isSubmitting ? 'Saving...' : type === 'income' ? 'إضافة الدخل' : 'إضافة المصروف'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
