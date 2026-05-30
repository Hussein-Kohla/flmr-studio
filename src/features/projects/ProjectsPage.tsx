import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { formatCurrency, cn } from '@/lib/utils';
import { Folder, Plus, Printer, DollarSign, Target, Monitor, CalendarDays, Loader2, CheckCircle2, Trash2, TrendingUp, Presentation, BarChart2 } from 'lucide-react';
import { ProjectDetailsDrawer } from './ProjectDetailsDrawer';
import { DatePicker } from '@/components/ui/DatePicker';
import { CustomSelect } from '@/components/ui/CustomSelect';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InputBox({ value, onChange, onBlur, onKeyDown, placeholder, type = "text", className, inputClassName, list }: any) {
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <div className={cn("relative group", className)}>
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--color-brand)] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none font-bold"
          >
            {placeholder}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-surface)] border-b border-r border-[var(--border-default)] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
      <input
        type={type}
        list={list}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => {
          setIsFocused(false);
          if (onBlur) onBlur(e);
        }}
        onFocus={() => setIsFocused(true)}
        onKeyDown={onKeyDown}
        placeholder={isFocused && type !== 'date' ? "" : placeholder}
        className={cn(
          "w-full bg-white/5 border border-white/10 hover:border-white/30 focus:bg-[var(--bg-surface)] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--color-brand)] transition-colors text-center shadow-sm placeholder-[var(--text-muted)]",
          inputClassName || "text-white"
        )}
      />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MultiAutocompleteInput({ value, onChange, onBlur, onKeyDown, placeholder, className, options = [] }: any) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const words = (value || "").split(',');
  const currentWord = words[words.length - 1].trimStart();
  const currentTrimmed = currentWord.trim();

  const existingWords = words.map((w: string) => w.trim()).filter(Boolean);

  const filteredOptions = options.filter((o: string) =>
    o.toLowerCase().includes(currentTrimmed.toLowerCase()) &&
    !existingWords.includes(o)
  );

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    const arr = (value || "").split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
    const last = (value || "").split(',').pop()?.trim() || "";
    if (last && option.toLowerCase().includes(last.toLowerCase())) {
      arr.pop();
    }
    arr.push(option);
    const newValue = arr.join(', ') + ', ';
    onChange(newValue);
    setShowOptions(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative group", className)}>
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--color-brand)] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none font-bold"
          >
            {placeholder}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-surface)] border-b border-r border-[var(--border-default)] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowOptions(true);
        }}
        onFocus={() => { setIsFocused(true); setShowOptions(true); }}
        onBlur={e => {
          setIsFocused(false);
          setTimeout(() => {
            if (onBlur) onBlur(e);
            setShowOptions(false);
          }, 200);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && currentTrimmed !== '') {
            e.preventDefault();
            e.stopPropagation();
            handleSelect(currentTrimmed);
          } else if (onKeyDown) {
            onKeyDown(e);
          }
        }}
        placeholder={isFocused ? "" : placeholder}
        className={cn(
          "w-full bg-white/5 border border-white/10 hover:border-white/30 focus:bg-[var(--bg-surface)] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--color-brand)] transition-colors text-center shadow-sm placeholder-[var(--text-muted)] text-white"
        )}
      />

      {showOptions && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
          {filteredOptions.map((opt: string) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              className="w-full text-right px-3 py-2 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--color-brand)] hover:text-white rounded-lg transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineProjectRow({
  project,
  dayDate,
  clientId,
  onSave,
  onDelete,
  isNew = false,
  uniquePlatforms = [],
  uniqueTypes = []
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project?: any,
  dayDate: string,
  clientId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any, projectId?: string) => Promise<string | void>,
  onDelete?: () => void,
  isNew?: boolean,
  uniquePlatforms?: string[],
  uniqueTypes?: string[]
}) {
  const [title, setTitle] = useState(project?.title || '');
  const [platform, setPlatform] = useState(project?.platform || '');
  const [projectType, setProjectType] = useState(project?.projectType || '');
  const [revenue, setRevenue] = useState(project?.revenueCents ? project.revenueCents / 100 : '');
  const [remaining, setRemaining] = useState(
    project?.budgetCents
      ? ((project.budgetCents || 0) - (project.revenueCents || 0)) / 100
      : ''
  );
  const [startDateInput, setStartDateInput] = useState(project?.tags?.[0] || '');
  const [deadline, setDeadline] = useState(project?.tags?.[1] || '');
  const [isSaving, setIsSaving] = useState(false);

  const [visibleFields, setVisibleFields] = useState<string[]>(() => {
    if (isNew) return ['title'];
    const fields = ['title'];
    if (project?.platform || project?.projectType) fields.push('details');
    if (project?.tags?.[0] || project?.deadline) fields.push('dates');
    if (project?.revenueCents || project?.budgetCents) fields.push('financials');
    return fields;
  });

  const toggleField = (field: string) => {
    if (visibleFields.includes(field)) {
      setVisibleFields(visibleFields.filter(f => f !== field));
    } else {
      setVisibleFields([...visibleFields, field]);
    }
  };

  React.useEffect(() => {
    if (!isNew && project) {
      setTitle(project.title || '');
      setPlatform(project.platform || '');
      setProjectType(project.projectType || '');
      setRevenue(project.revenueCents ? project.revenueCents / 100 : '');
      setRemaining(project.budgetCents ? ((project.budgetCents || 0) - (project.revenueCents || 0)) / 100 : '');
      setStartDateInput(project.tags?.[0] || '');
      setDeadline(project.tags?.[1] || '');
    }
  }, [project, isNew]);

  const handleSave = async () => {
    if (isNew && !title && !projectType && !revenue) return;

    if (!isNew && project) {
      const isChanged =
        title !== (project.title || '') ||
        platform !== (project.platform || '') ||
        projectType !== (project.projectType || '') ||
        revenue !== (project.revenueCents ? project.revenueCents / 100 : '') ||
        remaining !== (project.budgetCents ? ((project.budgetCents || 0) - (project.revenueCents || 0)) / 100 : '') ||
        startDateInput !== (project.tags?.[0] || '') ||
        deadline !== (project.tags?.[1] || '');

      if (!isChanged) return;
    }

    setIsSaving(true);
    const budget = (parseFloat(revenue.toString()) || 0) + (parseFloat(remaining.toString()) || 0);
    await onSave({
      title: title || 'بدون اسم',
      platform,
      projectType,
      revenue: parseFloat(revenue.toString()) || 0,
      budget: budget || 0,
      startDate: new Date(dayDate).getTime(),
      tags: [startDateInput, deadline].filter(Boolean),
      clientId
    }, project?._id);

    setIsSaving(false);

    if (isNew) {
      setTitle('');
      setPlatform('');
      setProjectType('');
      setRevenue('');
      setRemaining('');
      setStartDateInput('');
      setDeadline('');
      setVisibleFields(['title']);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full group relative mb-3 bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex gap-2">
        <button onClick={() => toggleField('details')} className={cn("text-xs px-2 py-1 rounded-md transition-colors border border-transparent", visibleFields.includes('details') ? "bg-[var(--color-brand)]/20 text-[var(--color-brand)] border-[var(--color-brand)]/30" : "bg-black/20 text-[var(--text-muted)] hover:bg-white/10")}>+ التفاصيل (المنصة/النوع)</button>
        <button onClick={() => toggleField('dates')} className={cn("text-xs px-2 py-1 rounded-md transition-colors border border-transparent", visibleFields.includes('dates') ? "bg-[var(--color-brand)]/20 text-[var(--color-brand)] border-[var(--color-brand)]/30" : "bg-black/20 text-[var(--text-muted)] hover:bg-white/10")}>+ التاريخ</button>
        <button onClick={() => toggleField('financials')} className={cn("text-xs px-2 py-1 rounded-md transition-colors border border-transparent", visibleFields.includes('financials') ? "bg-[var(--color-brand)]/20 text-[var(--color-brand)] border-[var(--color-brand)]/30" : "bg-black/20 text-[var(--text-muted)] hover:bg-white/10")}>+ المالية</button>
      </div>

      <div className="flex gap-2 items-center flex-wrap xl:flex-nowrap w-full relative">
        <InputBox placeholder={isNew ? "اضغط هنا لإضافة عمل جديد..." : "اسم العمل"} value={title} onChange={setTitle} onBlur={!isNew ? handleSave : undefined} onKeyDown={onKeyDown} className={cn("flex-[2] min-w-[120px]", isNew && !title && "opacity-80")} />

        {visibleFields.includes('details') && (
          <>
            <MultiAutocompleteInput placeholder="المنصات (تلقائي)" value={platform} onChange={setPlatform} options={uniquePlatforms} onBlur={!isNew ? handleSave : undefined} onKeyDown={onKeyDown} className="flex-1 min-w-[130px]" />
            <MultiAutocompleteInput placeholder="الأنواع (تلقائي)" value={projectType} onChange={setProjectType} options={uniqueTypes} onBlur={!isNew ? handleSave : undefined} onKeyDown={onKeyDown} className="flex-1 min-w-[130px]" />
          </>
        )}

        {visibleFields.includes('dates') && (
          <div className="flex flex-1 gap-2 min-w-[260px]">
            <div className="flex-1 min-w-[130px]">
              <DatePicker placeholder="من تاريخ" value={startDateInput} onChange={setStartDateInput} />
            </div>
            <div className="flex-1 min-w-[130px]">
              <DatePicker placeholder="إلى تاريخ" value={deadline} onChange={setDeadline} />
            </div>
          </div>
        )}

        {visibleFields.includes('financials') && (
          <>
            <InputBox placeholder="المدفوع" value={revenue} onChange={setRevenue} type="number" onBlur={!isNew ? handleSave : undefined} onKeyDown={onKeyDown} className="flex-1 min-w-[90px]" inputClassName="text-[var(--color-success)] font-black" />
            <InputBox placeholder="المتبقي" value={remaining} onChange={setRemaining} type="number" onBlur={!isNew ? handleSave : undefined} onKeyDown={onKeyDown} className="flex-1 min-w-[90px]" inputClassName="text-[var(--color-warning)] font-black" />
          </>
        )}

        <div className="flex items-center gap-1 shrink-0 mt-2 xl:mt-0">
          <button onClick={handleSave} disabled={isSaving || !title} className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--border-default)] hover:border-[var(--color-success)]/50 flex items-center justify-center disabled:opacity-50 transition-all shadow-sm">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
          </button>

          {!isNew && onDelete && (
            <button onClick={onDelete} className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] hover:bg-red-500/20 text-red-500 border border-[var(--border-default)] hover:border-red-500/50 flex items-center justify-center transition-all shadow-sm">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PDF helpers ──────────────────────────────────────────────────────────────

/**
 * Loads the Cairo font as a base64 data-URL and returns it so jsPDF can embed it.
 * We load the font directly; no external canvas rendering needed for text.
 */
async function loadCairoFont(): Promise<string | null> {
  try {
    const url = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.woff2';
    const resp = await fetch(url);
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}

/**
 * Generates the PDF purely with jsPDF (no html2canvas), so Arabic text is
 * fully rendered and bidirectional – no more gibberish or broken letters.
 */
async function generateArabicPDF(params: {
  clientName: string;
  periodLabel: string;
  totalRevenue: number;
  totalBudget: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statsProjects: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  platformStats: [string, { count: number; revenue: number; budget: number }][];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeStats: [string, { count: number; revenue: number; budget: number }][];
  statsPeriod: 'month' | 'year';
  selectedMonth: number;
  selectedYear: number;
}): Promise<void> {
  const {
    clientName, periodLabel, totalRevenue, totalBudget,
    statsProjects, platformStats, typeStats
  } = params;

  // We still use html2canvas but render a self-contained hidden iframe
  // so the font is loaded and bidi is handled by the browser's own layout engine.
  // That gives us pixel-perfect Arabic text in the PDF.

  const fmt = (cents: number) => `${(cents / 100).toLocaleString('ar-EG')} جنيه`;
  const totalRemaining = totalBudget - totalRevenue;

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', Arial, sans-serif;
    background: #ffffff;
    color: #111827;
    font-size: 13px;
    line-height: 1.7;
    padding: 40px;
    width: 960px;
    direction: rtl;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 4px solid #9333ea;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  .header h1 { font-size: 32px; font-weight: 900; color: #111827; margin-bottom: 4px; }
  .header h2 { font-size: 20px; font-weight: 700; color: #374151; }
  .header p  { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .revenue-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px 24px;
    text-align: center;
    min-width: 200px;
  }
  .revenue-box .big { font-size: 28px; font-weight: 900; color: #16a34a; }
  .revenue-box .label { font-size: 11px; color: #9ca3af; font-weight: 700; text-transform: uppercase; margin-top: 4px; }

  .cards { display: flex; gap: 16px; margin-bottom: 28px; }
  .card {
    flex: 1;
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    border: 1px solid;
  }
  .card.gray  { background: #f9fafb; border-color: #e5e7eb; }
  .card.green { background: #f0fdf4; border-color: #bbf7d0; }
  .card.orange{ background: #fff7ed; border-color: #fed7aa; }
  .card .card-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
  .card .card-value { font-size: 26px; font-weight: 900; }
  .card.gray  .card-value { color: #111827; }
  .card.green .card-value { color: #16a34a; }
  .card.orange .card-value { color: #ea580c; }

  .section-title {
    font-size: 17px;
    font-weight: 900;
    color: #111827;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  .two-col { display: flex; gap: 32px; margin-bottom: 28px; }
  .two-col > div { flex: 1; }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    margin-bottom: 8px;
  }
  .stat-row .left { display: flex; align-items: center; gap: 12px; }
  .stat-count {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #f3e8ff;
    color: #9333ea;
    font-weight: 900;
    font-size: 15px;
    display: flex; align-items: center; justify-content: center;
  }
  .stat-name { font-weight: 700; font-size: 15px; color: #1f2937; }
  .stat-money { font-weight: 900; font-size: 13px; color: #16a34a; }

  .platform-row {
    padding: 12px 14px;
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    margin-bottom: 8px;
  }
  .platform-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .platform-name { font-weight: 700; font-size: 15px; color: #1f2937; }
  .platform-count { font-size: 13px; color: #6b7280; font-weight: 700; }
  .bar-bg { background: #e5e7eb; border-radius: 99px; height: 8px; overflow: hidden; }
  .bar-fill { background: #3b82f6; height: 100%; border-radius: 99px; }
  .platform-money { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; font-weight: 700; }
  .paid { color: #16a34a; }
  .remain { color: #ea580c; }

  /* Projects table */
  .projects-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .projects-table th {
    background: #f3e8ff;
    color: #7e22ce;
    font-weight: 900;
    font-size: 13px;
    padding: 10px 12px;
    text-align: right;
  }
  .projects-table td {
    padding: 9px 12px;
    font-size: 13px;
    border-bottom: 1px solid #f3f4f6;
    color: #1f2937;
    font-weight: 600;
  }
  .projects-table tr:last-child td { border-bottom: none; }
  .projects-table tr:nth-child(even) td { background: #fafafa; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
  }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-orange { background: #ffedd5; color: #ea580c; }

  .footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
    font-weight: 700;
  }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div>
    <h1>تقرير أعمال وإحصائيات</h1>
    <h2>العميل: ${clientName}</h2>
    <p>${periodLabel}</p>
  </div>
  <div class="revenue-box">
    <div class="big">${fmt(totalRevenue)}</div>
    <div class="label">إجمالي الإيرادات</div>
  </div>
</div>

<!-- Summary cards -->
<div class="cards">
  <div class="card gray">
    <div class="card-label">الميزانية الكلية</div>
    <div class="card-value">${fmt(totalBudget)}</div>
  </div>
  <div class="card green">
    <div class="card-label">تم الدفع</div>
    <div class="card-value">${fmt(totalRevenue)}</div>
  </div>
  <div class="card orange">
    <div class="card-label">المتبقي</div>
    <div class="card-value">${fmt(totalRemaining)}</div>
  </div>
</div>

<!-- Types + Platforms -->
<div class="two-col">
  <div>
    <div class="section-title">تفاصيل المهام والمنشورات</div>
    ${typeStats.map(([type, data]) => `
      <div class="stat-row">
        <div class="left">
          <div class="stat-count">${data.count}</div>
          <div class="stat-name">${type}</div>
        </div>
        <div class="stat-money">${fmt(data.revenue)}</div>
      </div>
    `).join('')}
  </div>
  <div>
    <div class="section-title">المنصات</div>
    ${platformStats.map(([platform, data]) => `
      <div class="platform-row">
        <div class="platform-top">
          <span class="platform-name">${platform}</span>
          <span class="platform-count">${data.count} أعمال</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width:${Math.max(5, (data.count / statsProjects.length) * 100)}%"></div>
        </div>
        <div class="platform-money">
          <span class="paid">مدفوع: ${fmt(data.revenue)}</span>
          <span class="remain">متبقي: ${fmt(data.budget - data.revenue)}</span>
        </div>
      </div>
    `).join('')}
  </div>
</div>




</body>
</html>`;

  // Render in an off-screen iframe so the browser handles Arabic layout correctly
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1000px;height:1px;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        // Wait for fonts
        await iframe.contentDocument?.fonts.ready;
        // Small extra delay for layout
        await new Promise(r => setTimeout(r, 600));

        const body = iframe.contentDocument?.body;
        if (!body) throw new Error('No body');

        // Expand iframe to full content height
        const scrollH = iframe.contentDocument!.documentElement.scrollHeight;
        iframe.style.height = scrollH + 'px';
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(iframe.contentDocument!.body, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1000,
          scrollX: 0,
          scrollY: 0,
          width: 1000,
          height: scrollH,
        });

        document.body.removeChild(iframe);

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfW = 210; // A4 mm
        const pdfH = (canvas.height * pdfW) / canvas.width;

        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: pdfH > 297 ? [pdfW, pdfH] : 'a4',
        });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        pdf.save(`تقرير_${params.clientName}_${params.periodLabel}.pdf`);
        resolve();
      } catch (err) {
        document.body.removeChild(iframe);
        reject(err);
      }
    };

    iframe.srcdoc = html;
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { token } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [statsPeriod, setStatsPeriod] = useState<'month' | 'year'>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [addingDays, setAddingDays] = useState<number[]>([]);

  const projectsQuery = useQuery(api.projects.getProjects, token ? {
    token,
    paginationOpts: { numItems: 1000, cursor: null }
  } : 'skip');

  const clientsQuery = useQuery(api.clients.getClients, token ? {
    token,
    paginationOpts: { numItems: 1000, cursor: null }
  } : 'skip');

  const createProject = useMutation(api.projects.createProject);
  const updateProject = useMutation(api.projects.updateProject);
  const deleteProject = useMutation(api.projects.deleteProject);

  const projects = useMemo(() => projectsQuery?.page || [], [projectsQuery?.page]);
  const clients = useMemo(() => clientsQuery?.page || [], [clientsQuery?.page]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveProject = async (data: any, projectId?: string) => {
    if (!token) return;
    try {
      if (projectId) {
        await updateProject({ token, projectId: projectId as any, ...data });
      } else {
        await createProject({ token, ...data, clientId: selectedClientId, status: 'current' });
      }
    } catch (err) {
      console.error('Failed to save project inline:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!token) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا العمل؟')) return;
    try {
      await deleteProject({ token, projectId: projectId as any });
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear + 1);
    projects.forEach(p => {
      const date = p.startDate || p.deadline || p.createdAt;
      if (date) years.add(new Date(date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [projects, currentYear]);

  const uniquePlatforms = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.platform) p.platform.split(',').forEach((s: string) => set.add(s.trim()));
    });
    return Array.from(set).filter(Boolean);
  }, [projects]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.projectType) p.projectType.split(',').forEach((s: string) => set.add(s.trim()));
    });
    return Array.from(set).filter(Boolean);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!selectedClientId) return [];
    return projects.filter(p => {
      if (p.clientId !== selectedClientId) return false;
      const date = p.startDate || p.deadline || p.createdAt;
      if (!date) return false;
      const pDate = new Date(date);
      return pDate.getFullYear() === selectedYear && pDate.getMonth() === selectedMonth;
    });
  }, [projects, selectedClientId, selectedYear, selectedMonth]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const timelineDays = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const days: { day: number; projects: any[] }[] = [];
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, projects: [] });
    filteredProjects.forEach(p => {
      const date = p.startDate || p.deadline || p.createdAt;
      const day = new Date(date).getDate();
      const dayObj = days.find(d => d.day === day);
      if (dayObj) dayObj.projects.push(p);
    });
    return days;
  }, [filteredProjects, daysInMonth]);

  const statsProjects = useMemo(() => {
    if (!selectedClientId) return [];
    if (statsPeriod === 'month') return filteredProjects;
    return projects.filter(p => {
      if (p.clientId !== selectedClientId) return false;
      const date = p.startDate || p.deadline || p.createdAt;
      if (!date) return false;
      return new Date(date).getFullYear() === selectedYear;
    });
  }, [projects, filteredProjects, statsPeriod, selectedClientId, selectedYear]);

  const { totalRevenue, totalBudget } = useMemo(() => {
    let totalBudget = 0, totalPaid = 0;
    statsProjects.forEach(p => {
      totalBudget += (p.budgetCents || 0);
      totalPaid += (p.revenueCents || 0);
    });
    return { totalRevenue: totalPaid, totalBudget };
  }, [statsProjects]);

  const platformStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number; budget: number }> = {};
    statsProjects.forEach(p => {
      const rawPlatforms = p.platform ? p.platform.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const platforms = rawPlatforms.length > 0 ? rawPlatforms : ['أخرى'];
      platforms.forEach((platform: string) => {
        if (!stats[platform]) stats[platform] = { count: 0, revenue: 0, budget: 0 };
        stats[platform].count++;
        if (p.revenueCents) stats[platform].revenue += (p.revenueCents) / platforms.length;
        if (p.budgetCents) stats[platform].budget += (p.budgetCents) / platforms.length;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  }, [statsProjects]);

  const typeStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number; budget: number }> = {};
    statsProjects.forEach(p => {
      const rawTypes = p.projectType ? p.projectType.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const types = rawTypes.length > 0 ? rawTypes : ['أخرى'];
      types.forEach((type: string) => {
        if (!stats[type]) stats[type] = { count: 0, revenue: 0, budget: 0 };
        stats[type].count++;
        if (p.revenueCents) stats[type].revenue += (p.revenueCents) / types.length;
        if (p.budgetCents) stats[type].budget += (p.budgetCents) / types.length;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  }, [statsProjects]);

  const handleExportPDF = async () => {
    if (!selectedClientId) { alert("الرجاء اختيار العميل أولاً"); return; }
    if (statsProjects.length === 0) { alert("لا توجد أعمال في هذه الفترة"); return; }

    setIsExporting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientName = clients.find((c: any) => c._id === selectedClientId)?.name || '';
    const periodLabel = statsPeriod === 'month'
      ? `شهر ${ARABIC_MONTHS[selectedMonth]} ${selectedYear}`
      : `سنة ${selectedYear}`;

    try {
      await generateArabicPDF({
        clientName,
        periodLabel,
        totalRevenue,
        totalBudget,
        statsProjects,
        platformStats,
        typeStats,
        statsPeriod,
        selectedMonth,
        selectedYear,
      });
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("حدث خطأ أثناء حفظ الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageWrapper
      title={
        <div className="flex items-center gap-3">
          <Folder className="text-[var(--color-brand)]" size={28} />
          <div dir="rtl">
            <h1 className="text-2xl font-black text-white">خطة العمل والمشاريع</h1>
            <p className="text-sm text-[var(--text-muted)] font-normal">إدارة الجدول الزمني للمشاريع</p>
          </div>
        </div>
      }
    >
      <div dir="rtl" className="flex flex-col gap-8 pb-12">
        {/* 1. Client Selection */}
        <div className="bg-[var(--bg-surface)] p-6 rounded-3xl border border-[var(--border-default)] shadow-sm">
          <label className="block text-sm font-bold text-[var(--text-muted)] mb-3">اختر العميل</label>
          <CustomSelect
            value={selectedClientId}
            onChange={(val) => setSelectedClientId(val as string)}
            options={[
              { label: '-- الرجاء اختيار عميل --', value: '' },
              ...clients.map((c: any) => ({ label: c.name, value: c._id }))
            ]}
            placeholder="-- الرجاء اختيار عميل --"
            className="w-full text-lg font-black"
          />
        </div>

        {/* 2. Year & Month Selection */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-[var(--bg-surface)] rounded-2xl p-2 border border-[var(--border-default)]">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 pb-1 px-2">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-lg font-black whitespace-nowrap transition-all",
                    selectedYear === year
                      ? "bg-[var(--color-brand)] text-white shadow-lg"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-muted)]"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[var(--bg-surface)] rounded-2xl p-2 border border-[var(--border-default)] overflow-x-auto custom-scrollbar">
            {ARABIC_MONTHS.map((monthName, index) => (
              <button
                key={index}
                onClick={() => setSelectedMonth(index)}
                className={cn(
                  "px-6 py-3 rounded-xl text-md font-bold whitespace-nowrap transition-all flex-1 min-w-[100px] text-center",
                  selectedMonth === index
                    ? "bg-white/10 text-white shadow-md border border-white/20"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-muted)] border border-transparent"
                )}
              >
                {monthName}
              </button>
            ))}
          </div>
        </div>

        {!selectedClientId ? (
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-default)] p-12 text-center flex flex-col items-center justify-center">
            <Target size={48} className="text-[var(--text-muted)] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">يرجى اختيار العميل أولاً</h3>
            <p className="text-[var(--text-muted)]">يجب تحديد العميل من القائمة أعلاه لعرض الجدول الزمني وإضافة الأعمال.</p>
          </div>
        ) : (
          <>
            {/* 3. Timeline */}
            <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-default)] p-6 md:p-8 min-h-[400px]">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--border-default)]">
                <CalendarDays size={24} className="text-[var(--color-brand)]" />
                <h2 className="text-xl font-black text-white">الجدول الزمني لأعمال الشهر</h2>
              </div>

              <div className="flex flex-col gap-8 relative">
                <div className="absolute right-[35px] top-4 bottom-4 w-0.5 bg-[var(--border-default)] z-0 hidden md:block"></div>

                {timelineDays.map(({ day, projects }) => {
                  const hasProjects = projects.length > 0;
                  const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                  return (
                    <div key={day} className="flex flex-col md:flex-row gap-4 md:gap-8 relative z-10 group">
                      <div className="flex items-center md:items-start gap-4 w-full md:w-auto shrink-0 relative">
                        <div className={cn(
                          "w-[70px] h-[70px] rounded-2xl flex flex-col items-center justify-center border-2 transition-all shadow-sm bg-[var(--bg-surface)]",
                          hasProjects
                            ? "border-[var(--color-brand)] text-[var(--color-brand)] shadow-[0_0_15px_var(--color-brand-glow)]"
                            : "border-[var(--border-default)] text-[var(--text-muted)] group-hover:border-[var(--text-muted)]"
                        )}>
                          <span className="text-xs font-bold uppercase mb-1">يوم</span>
                          <span className="text-2xl font-black">{day}</span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col pt-2">
                        {projects.map((project, idx) => (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={project._id}
                            className="w-full"
                          >
                            <InlineProjectRow
                              project={project}
                              dayDate={dateStr}
                              clientId={selectedClientId}
                              onSave={handleSaveProject}
                              onDelete={() => handleDeleteProject(project._id)}
                              uniquePlatforms={uniquePlatforms}
                              uniqueTypes={uniqueTypes}
                            />
                          </motion.div>
                        ))}

                        {addingDays.includes(day) && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full mt-2"
                          >
                            <InlineProjectRow
                              isNew
                              dayDate={dateStr}
                              clientId={selectedClientId}
                              uniquePlatforms={uniquePlatforms}
                              uniqueTypes={uniqueTypes}
                              onSave={async (data) => {
                                await handleSaveProject(data);
                                setAddingDays(prev => prev.filter(d => d !== day));
                              }}
                            />
                          </motion.div>
                        )}

                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => {
                            if (!addingDays.includes(day)) {
                              setAddingDays(prev => [...prev, day]);
                            }
                          }}
                          className="w-10 h-10 mt-2 rounded-xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-default)] hover:border-[var(--color-brand)] text-[var(--text-muted)] hover:text-[var(--color-brand)] flex items-center justify-center transition-all shadow-sm"
                          title="إضافة عمل جديد في هذا اليوم"
                        >
                          <Plus size={20} />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Statistics Section */}
            <div className="relative">
              <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-2xl font-black text-white">إحصائيات الأعمال</h2>

                <div className="flex gap-2">
                  <div className="bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-default)] flex">
                    <button
                      onClick={() => setStatsPeriod('month')}
                      className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-colors", statsPeriod === 'month' ? "bg-white/10 text-white" : "text-[var(--text-muted)]")}
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => setStatsPeriod('year')}
                      className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-colors", statsPeriod === 'year' ? "bg-white/10 text-white" : "text-[var(--text-muted)]")}
                    >
                      كل السنة
                    </button>
                  </div>

                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-[var(--bg-surface)] hover:bg-white/5 text-[var(--text-primary)] px-5 py-2.5 rounded-2xl border border-[var(--border-default)] hover:border-[var(--color-brand)] transition-all shadow-sm font-bold text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <Loader2 size={18} className="text-[var(--color-brand)] animate-spin" />
                    ) : (
                      <Printer size={18} className="text-[var(--color-brand)] group-hover:scale-110 transition-transform" />
                    )}
                    <span>{isExporting ? 'جاري التحضير...' : 'طباعة التقرير PDF'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] p-8 rounded-3xl border border-[rgba(255,255,255,0.1)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center mb-8 border-b border-[rgba(255,255,255,0.1)] pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      تقرير العميل: {clients.find((c: any) => c._id === selectedClientId)?.name || ''}
                    </h3>
                    <p className="text-[rgba(255,255,255,0.5)] font-bold">
                      {statsPeriod === 'month' ? `تقرير شهر ${ARABIC_MONTHS[selectedMonth]} لسنة ${selectedYear}` : `التقرير السنوي لسنة ${selectedYear}`}
                    </p>
                  </div>
                  <div className="text-left" dir="ltr">
                    <p className="text-3xl font-black text-[var(--color-success)] mb-1">{formatCurrency(totalRevenue)}</p>
                    <p className="text-sm font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-widest">إجمالي الإيرادات</p>
                  </div>
                </div>

                {statsProjects.length === 0 ? (
                  <div className="py-12 text-center text-[rgba(255,255,255,0.4)] font-bold">
                    لا توجد أعمال في هذه الفترة لعرض الإحصائيات
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)] flex flex-col items-center justify-center text-center">
                        <Target className="text-[var(--color-brand)] mb-3" size={32} />
                        <p className="text-[rgba(255,255,255,0.5)] font-bold mb-1 uppercase text-xs tracking-widest">الميزانية الكلية</p>
                        <p className="text-2xl font-black text-white">{formatCurrency(totalBudget)}</p>
                      </div>
                      <div className="bg-[rgba(59,222,119,0.1)] rounded-2xl p-6 border border-[rgba(59,222,119,0.2)] flex flex-col items-center justify-center text-center">
                        <DollarSign className="text-[var(--color-success)] mb-3" size={32} />
                        <p className="text-[rgba(255,255,255,0.5)] font-bold mb-1 uppercase text-xs tracking-widest">تم الدفع</p>
                        <p className="text-2xl font-black text-[var(--color-success)]">{formatCurrency(totalRevenue)}</p>
                      </div>
                      <div className="bg-[rgba(250,175,46,0.1)] rounded-2xl p-6 border border-[rgba(250,175,46,0.2)] flex flex-col items-center justify-center text-center">
                        <TrendingUp className="text-[var(--color-warning)] mb-3" size={32} />
                        <p className="text-[rgba(255,255,255,0.5)] font-bold mb-1 uppercase text-xs tracking-widest">المتبقي</p>
                        <p className="text-2xl font-black text-[var(--color-warning)]">{formatCurrency(totalBudget - totalRevenue)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Platform Stats */}
                      <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)]">
                        <h4 className="text-lg font-black text-white flex items-center gap-2 mb-6">
                          <Monitor size={20} className="text-[var(--color-brand)]" />
                          الإحصائيات حسب المنصة
                        </h4>
                        <div className="flex flex-col gap-4">
                          {platformStats.map(([platform, data]) => (
                            <div key={platform} className="flex flex-col gap-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-white">{platform}</span>
                                <span className="text-[rgba(255,255,255,0.5)] font-bold">{data.count} أعمال</span>
                              </div>
                              <div className="w-full bg-[rgba(0,0,0,0.4)] rounded-full h-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 h-full bg-[var(--color-brand)] rounded-full" style={{ width: `${Math.max(5, (data.count / statsProjects.length) * 100)}%` }} />
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-[var(--color-success)] font-black">{formatCurrency(data.revenue)} مدفوع</span>
                                <span className="text-[var(--color-warning)] font-black">{formatCurrency(data.budget - data.revenue)} متبقي</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Type Stats */}
                      <div className="bg-[rgba(255,255,255,0.05)] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)]">
                        <h4 className="text-lg font-black text-white flex items-center gap-2 mb-6">
                          <Presentation size={20} className="text-[var(--color-brand)]" />
                          الإحصائيات حسب نوع العمل
                        </h4>
                        <div className="flex flex-col gap-4">
                          {typeStats.map(([type, data]) => (
                            <div key={type} className="flex items-center justify-between p-4 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[rgba(138,92,246,0.2)] flex items-center justify-center text-[var(--color-brand)] font-black">
                                  {data.count}
                                </div>
                                <span className="font-bold text-white">{type}</span>
                              </div>
                              <div className="text-left">
                                <p className="text-[var(--color-success)] font-black text-sm">{formatCurrency(data.revenue)}</p>
                                <p className="text-[rgba(255,255,255,0.4)] text-xs font-bold uppercase tracking-widest mt-1">مدفوعات</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>


                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <ProjectDetailsDrawer
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject ? (projects.find(p => p._id === selectedProject._id) || selectedProject) : null}
      />
    </PageWrapper>
  );
}
