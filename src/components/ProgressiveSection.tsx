import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Premium progressive disclosure component.
 * Renders a header that toggles the visibility of its content with smooth animation.
 * Uses the same design tokens as the UI library for a cohesive look.
 */
export const ProgressiveSection = ({ title, children, defaultOpen = false }: ProgressiveSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between p-4 text-left",
          "bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        )}
      >
        <span className="font-medium text-[var(--text-primary)]">{title}</span>
        <svg
          className={cn("w-4 h-4 transform transition-transform", open ? "rotate-180" : "rotate-0")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={cn(
          "px-4 pb-4 transition-max-height duration-300 ease-in-out overflow-hidden",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default ProgressiveSection;
