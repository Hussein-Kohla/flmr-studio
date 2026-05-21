import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepChange?: (step: number) => void;
}

/**
 * Premium stepper component for progressive disclosure.
 * Displays steps horizontally with smooth transition and brand colors.
 */
export function Stepper({ steps, currentStep, onStepChange }: StepperProps) {
  return (
    <div className="flex items-center space-x-4">
      {steps.map((label, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <div key={idx} className="flex items-center">
            <button
              type="button"
              onClick={() => onStepChange && onStepChange(idx)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isActive
                  ? "bg-brand text-white shadow-lg"
                  : isCompleted
                  ? "bg-emerald-500 text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
              )}
            >
              {idx + 1}
            </button>
            <span className="ml-2 text-sm font-medium text-[var(--text-primary)]">
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-[var(--border-subtle)] mx-3" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;
