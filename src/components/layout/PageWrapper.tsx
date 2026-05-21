import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageWrapperProps {
  children: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -8  },
}

export function PageWrapper({ children, title, subtitle, actions }: PageWrapperProps) {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 overflow-y-auto p-6! lg:p-8!"
    >
      {(title ?? actions) && (
        <div className="flex items-start justify-between gap-4 mb-8">
          {title && (
            <div>
              <h1 className="text-[var(--text-3xl)] font-bold text-[var(--text-primary)]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-[var(--text-secondary)] text-[var(--text-sm)]">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </motion.main>
  )
}
