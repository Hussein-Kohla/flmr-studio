import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useState } from 'react'
import { NewEventModal } from './NewEventModal'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ListTodo, Clock, Check, X as XIcon, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPE_VARIANT: Record<string, "muted" | "brand" | "warning" | "danger" | "success" | "info" | "default"> = {
  meeting:    'brand',
  deadline:   'danger',
  booking:    'success',
  montage:    'info',
  dish_ad:    'warning',
  match_ad:   'danger',
  fb_image:   'brand',
  collection: 'success',
  send_money: 'success',
  other:      'muted',
}

function buildCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarPage() {
  const { token } = useAuth()
  const events = useQuery(api.calendar.getEvents, token ? { token } : 'skip')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [view, setView] = useState<'month' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editingEvent, setEditingEvent] = useState<any | null>(null)

  const updateStatus = useMutation(api.calendar.updateEventStatus)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const cells = buildCells(year, month)
  
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handlePrevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    setSelectedDate(prev)
    setCurrentDate(prev) // Keep calendar sync
  }
  const handleNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    setSelectedDate(next)
    setCurrentDate(next) // Keep calendar sync
  }

  const handleDayClick = (day: number) => {
    const newSelected = new Date(year, month, day)
    setSelectedDate(newSelected)
    setView('day')
  }

  const getEventsForDate = (date: Date) => {
    if (!events) return []
    return events.filter(e => {
      const d = new Date(e.startAt)
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    }).sort((a, b) => a.startAt - b.startAt)
  }

  const getEventsForDayNumber = (day: number) => {
    return getEventsForDate(new Date(year, month, day))
  }

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const selectedDayEvents = getEventsForDate(selectedDate)

  return (
    <PageWrapper
      title="Calendar & Tasks"
      subtitle="Manage your monthly schedule and daily tasks"
      actions={
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              onClick={() => setView('month')}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2", view === 'month' ? "bg-[var(--color-brand)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
            >
              <CalendarIcon size={16} /> Month
            </button>
            <button
              onClick={() => setView('day')}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2", view === 'day' ? "bg-[var(--color-brand)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
            >
              <ListTodo size={16} /> Day
            </button>
          </div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>+ New Task / Event</Button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card className="min-h-[600px] flex flex-col">
            
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pb-6 border-b border-[var(--border-subtle)]">
              <div className="flex flex-col">
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {view === 'month' 
                    ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                  }
                </h2>
                <p className="text-[var(--text-muted)] text-sm font-medium mt-1">
                  {view === 'month' ? "Overview of your monthly schedule" : "Detailed view for the selected day"}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleToday} className="font-bold border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]">
                  Today
                </Button>
                <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-2xl p-1 border border-[var(--border-subtle)] shadow-inner">
                  <button 
                    onClick={view === 'month' ? handlePrevMonth : handlePrevDay}
                    className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1" />
                  <button 
                    onClick={view === 'month' ? handleNextMonth : handleNextDay}
                    className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            </div>

            {/* View Switching */}
            {view === 'month' ? (
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[var(--text-xs)] font-bold text-[var(--text-muted)] py-2 uppercase tracking-wider">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 flex-1">
                  {cells.map((day, idx) => {
                    const dayEvents = day ? getEventsForDayNumber(day) : []
                    const isToday = isCurrentMonth && day === today.getDate()
                    const isSelected = day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => day && handleDayClick(day)}
                        className={cn(
                          "min-h-[100px] rounded-xl p-2 transition-all flex flex-col gap-1 border",
                          day ? "bg-[var(--bg-surface)] hover:border-[var(--color-brand-subtle)] cursor-pointer" : "bg-transparent border-transparent",
                          !day ? "" : isToday ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5" : "border-[var(--border-subtle)]",
                          isSelected && day && !isToday ? "ring-2 ring-[var(--color-brand)] ring-offset-2 ring-offset-[var(--bg-card)]" : ""
                        )}
                      >
                        {day && (
                          <>
                            <div className="flex justify-between items-center mb-1">
                              <span className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold",
                                isToday ? "bg-[var(--color-brand)] text-white shadow-lg shadow-brand/30" : "text-[var(--text-secondary)]"
                              )}>
                                {day}
                              </span>
                              {dayEvents.length > 0 && (
                                <span className="text-[10px] font-bold text-[var(--text-muted)]">{dayEvents.length} Tasks</span>
                              )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                              {!events && <Skeleton height="16px" className="mt-1 w-full" />}
                              {dayEvents.map(event => (
                                <div key={event._id} className={cn(
                                  "text-[10px] px-1.5 py-1 rounded-md truncate font-semibold transition-transform hover:scale-[1.02]",
                                  TYPE_VARIANT[event.type] === 'danger' ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'
                                  : TYPE_VARIANT[event.type] === 'brand'  ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                                  : TYPE_VARIANT[event.type] === 'warning' ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]'
                                  : TYPE_VARIANT[event.type] === 'success' ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)]'
                                  : TYPE_VARIANT[event.type] === 'info' ? 'bg-[var(--color-info-subtle)] text-[var(--color-info)]'
                                  : 'bg-[var(--color-muted-subtle)] text-[var(--text-muted)]'
                                )}>
                                  <span className="opacity-75 mr-1">{formatTime(event.startAt)}</span>
                                  {event.title}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                {!events ? (
                  <div className="space-y-4">
                    <Skeleton height="80px" className="w-full rounded-xl" />
                    <Skeleton height="80px" className="w-full rounded-xl" />
                  </div>
                ) : selectedDayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-4 py-20">
                    <ListTodo size={48} className="opacity-20" />
                    <p className="font-medium text-lg">No tasks or events scheduled for this day.</p>
                    <Button variant="outline" onClick={() => setIsModalOpen(true)}>Add your first task</Button>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border-subtle)] before:to-transparent">
                    {selectedDayEvents.map((ev) => (
                      <div key={ev._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--bg-card)] bg-[var(--bg-surface)] text-[var(--color-brand)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <Clock size={16} />
                        </div>
                        
                        <Card 
                          glass 
                          className={cn(
                            "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 transition-all relative group/card border-white/5",
                            ev.status === 'done' ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10" :
                            ev.status === 'cancelled' ? "bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10" :
                            "hover:border-[var(--color-brand-subtle)]"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant={ev.status === 'done' ? 'success' : ev.status === 'cancelled' ? 'danger' : TYPE_VARIANT[ev.type]}>
                              {ev.status === 'done' ? 'Completed' : ev.status === 'cancelled' ? 'Cancelled' : ev.type}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[var(--text-muted)] mr-2">{formatTime(ev.startAt)}</span>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => updateStatus({ token: token!, eventId: ev._id, status: 'done' })}
                                  className={cn("p-1.5 rounded-lg transition-all", ev.status === 'done' ? "bg-emerald-500 text-white" : "bg-white/5 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-500")}
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={() => updateStatus({ token: token!, eventId: ev._id, status: 'cancelled' })}
                                  className={cn("p-1.5 rounded-lg transition-all", ev.status === 'cancelled' ? "bg-red-500 text-white" : "bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500")}
                                >
                                  <XIcon size={14} />
                                </button>
                                <button 
                                  onClick={() => setEditingEvent(ev)}
                                  className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <h3 className={cn("font-bold text-lg", ev.status === 'done' ? "text-emerald-400" : ev.status === 'cancelled' ? "text-red-400" : "text-[var(--text-primary)]")}>
                            {ev.title}
                          </h3>
                          {ev.notes && (
                            <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">{ev.notes}</p>
                          )}
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar / Mini Calendar or Summary */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl border-none">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <ListTodo size={24} />
               </div>
               <div>
                 <p className="text-white/80 font-medium text-sm">Daily Progress</p>
                 <h3 className="text-2xl font-bold">{selectedDayEvents.length} Tasks</h3>
               </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-white/80">
                <span>Completed</span>
                <span>0%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 w-0 rounded-full transition-all duration-1000" />
              </div>
            </div>
          </Card>

          <div>
            <h3 className="text-[var(--text-sm)] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex justify-between items-center">
              <span>Upcoming</span>
              <Badge variant="brand">{!events ? '...' : events.length}</Badge>
            </h3>
            
            <div className="space-y-3">
              {!events ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="70px" className="w-full rounded-xl" />)
              ) : events.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">No upcoming events.</p>
              ) : (
                events.slice(0, 5).map((ev) => (
                  <Card key={ev._id} glass padding="sm" hoverable className="border-[var(--border-subtle)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-sm)] font-bold text-[var(--text-primary)] truncate">{ev.title}</p>
                        <p className="text-[var(--text-xs)] text-[var(--text-muted)] mt-1 font-medium">
                          {new Date(ev.startAt).toLocaleDateString()} • {formatTime(ev.startAt)}
                        </p>
                      </div>
                      <Badge variant={TYPE_VARIANT[ev.type]}>{ev.type}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
      
      <NewEventModal 
        isOpen={isModalOpen || !!editingEvent} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }} 
        eventToEdit={editingEvent}
      />
    </PageWrapper>
  )
}
