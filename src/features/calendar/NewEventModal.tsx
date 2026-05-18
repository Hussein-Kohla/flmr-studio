import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '../../lib/utils';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any | null;
}

export function NewEventModal({ isOpen, onClose, eventToEdit }: NewEventModalProps) {
  const { token } = useAuth();
  const createEvent = useMutation(api.calendar.createEvent);
  const updateEvent = useMutation(api.calendar.updateEvent);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('other');
  const [startAt, setStartAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (eventToEdit && isOpen) {
      setTitle(eventToEdit.title);
      setType(eventToEdit.type);
      setStartAt(new Date(eventToEdit.startAt).toISOString().slice(0, 16));
    } else if (isOpen) {
      setTitle('');
      setType('other');
      setStartAt('');
    }
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title || !startAt) return;
    
    setIsSubmitting(true);
    try {
      if (eventToEdit) {
        await updateEvent({
          token,
          eventId: eventToEdit._id,
          title,
          type,
          startAt: new Date(startAt).getTime(),
        });
      } else {
        await createEvent({
          token,
          title,
          type,
          startAt: new Date(startAt).getTime(),
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4")}>
      <Card className="w-full max-w-md shadow-2xl overflow-hidden relative border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-2xl" padding="none">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {eventToEdit ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] rounded-full transition-colors">
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Kickoff Call"
            />
          </div>
          <div>
            <label className="form-label">Type *</label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field select-field"
            >
               <option value="montage">مونتاج</option>
               <option value="dish_ad">اعلان دش</option>
               <option value="match_ad">اعلان مباريات</option>
               <option value="fb_image">صورة فيس</option>
               <option value="collection">تحصيل</option>
               <option value="send_money">ابعت فلوس</option>
               <option value="meeting">Meeting</option>
               <option value="deadline">Deadline</option>
               <option value="booking">Booking</option>
               <option value="other">Other</option>
            </select>
          </div>
          <div>
            <DatePicker
              label="Date & Time *"
              value={startAt}
              onChange={setStartAt}
              withTime
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !title || !startAt}>
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
