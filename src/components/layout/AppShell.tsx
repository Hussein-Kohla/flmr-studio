import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { useToast } from '../ui/Toast'

// Icons (inline SVG to avoid extra deps)
const DashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const ClientsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const ProjectsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const PaymentsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const SettingsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.41 1.41l-1.06 1.06M4.93 4.93l-1.06 1.06A10 10 0 0 0 2.52 7.4M21.48 16.6a10 10 0 0 1-1.41 1.41l-1.06-1.06M4.07 19.07l-1.06-1.06a10 10 0 0 1-1.41-1.41"/></svg>
const AnalyticsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
const TasksIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
const NAV_ITEMS = [
  { to: '/',           icon: <DashIcon />,     label: 'Dashboard'  },
  { to: '/analytics',  icon: <AnalyticsIcon />, label: 'Statistics' },
  { to: '/clients',    icon: <ClientsIcon />,   label: 'Clients'    },
  { to: '/projects',   icon: <ProjectsIcon />,  label: 'Projects'   },
  { to: '/calendar',   icon: <CalendarIcon />,  label: 'Calendar'   },
  { to: '/payments',   icon: <PaymentsIcon />,  label: 'Payments'   },
  { to: '/tasks',      icon: <TasksIcon />,     label: 'To-Do'      },
  { to: '/settings',   icon: <SettingsIcon />,  label: 'Settings'   },
]

const Logo = () => (
  <span className="gradient-text font-bold text-lg tracking-tight">FLMR</span>
)

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { toast } = useToast()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      <Sidebar navItems={NAV_ITEMS} logo={<Logo />} />
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Premium Top Header */}
        <header className="h-20 shrink-0 border-b border-[var(--border-subtle)] bg-black/10 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 flex-1">
             {/* Search Bar Removed as requested */}
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={() => toast("You have no new notifications.", "info")}
                className="w-11 h-11 rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand-subtle)] transition-all relative group"
             >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--color-danger)] rounded-full border-2 border-[var(--bg-surface)] group-hover:scale-125 transition-transform" />
             </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </div>
      </div>
    </div>
  )
}
