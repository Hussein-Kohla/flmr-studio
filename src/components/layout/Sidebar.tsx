import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useDisclosure } from '@/hooks/useDisclosure'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

interface SidebarProps {
  navItems: NavItem[]
  logo?: React.ReactNode
  userSection?: React.ReactNode
}

export function Sidebar({ navItems, logo }: SidebarProps) {
  const { isOpen, toggle } = useDisclosure(true)

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 80 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col h-screen shrink-0 bg-[var(--bg-raised)] border-r border-[var(--border-subtle)] overflow-hidden z-20"
    >
      {/* Premium Glass Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-[var(--border-subtle)] bg-black/10 backdrop-blur-sm">
        <motion.div
          animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -10 }}
          className="overflow-hidden"
        >
          {logo}
        </motion.div>
        <button
          onClick={toggle}
          className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-lg)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:shadow-brand transition-all duration-200"
        >
          <motion.span animate={{ rotate: isOpen ? 0 : 180 }}>
            {isOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            )}
          </motion.span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-4 h-12 px-3 rounded-[var(--radius-xl)] transition-all duration-300',
                isActive
                  ? 'bg-gradient-to-r from-[var(--color-brand-subtle)] to-transparent text-[var(--color-brand)] shadow-[inset_0_0_12px_rgba(167,139,250,0.05)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-[var(--color-brand)] drop-shadow-[0_0_8px_var(--color-brand-glow)]" : "text-[var(--text-muted)]"
                )}>
                  {item.icon}
                </span>
                <motion.span
                  animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -20 }}
                  className="font-semibold text-[var(--text-sm)] tracking-wide whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-[var(--color-brand)] rounded-r-full shadow-[0_0_12px_var(--color-brand-glow)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section / Footer */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-black/5">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-[var(--radius-xl)] transition-all duration-300",
          isOpen ? "bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]" : "justify-center"
        )}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] p-[1px]">
            <div className="w-full h-full rounded-full bg-[var(--bg-base)] flex items-center justify-center font-bold text-xs">
              HK
            </div>
          </div>
          {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">Hussein Kohla</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">Admin</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
