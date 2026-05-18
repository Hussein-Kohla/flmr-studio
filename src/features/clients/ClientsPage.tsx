import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, List, TrendingUp, Trash2, Search, Plus, Mail, Phone, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { NewClientModal } from './NewClientModal'
import { ClientDetailsModal } from './ClientDetailsModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

const ITEMS_PER_PAGE = 12;

export default function ClientsPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'recent'>('recent')
  const debouncedSearch = useDebounce(search, 300)
  const { token } = useAuth()
  const { toast } = useToast()

  // Pagination State
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);

  const clientsData = useQuery(api.clients.getClients, token ? {
    token,
    paginationOpts: { numItems: ITEMS_PER_PAGE, cursor: paginationCursor }
  } : 'skip');

  const projectsData = useQuery(api.projects.getProjects, token ? {
    token,
    paginationOpts: { numItems: 1000, cursor: null }
  } : 'skip');

  const deleteClient = useMutation(api.clients.deleteClient)

  const FILTERS = [
    { id: 'تحصيل', label: 'تحصيل', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { id: 'فيس', label: 'فيس', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'مميزين', label: 'مميزين', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  ];

  const clients = clientsData?.page || [];
  const projects = projectsData?.page || [];

  // Filter and Sort Clients
  const filtered = clients.filter((c) => {
    const matchesSearch = [c.name, c.email, c.company].some((v) =>
      v?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    const matchesFilter = !activeFilter || c.tags?.includes(activeFilter);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'balance') return (b.revenueCents || 0) - (a.revenueCents || 0)
    return (b.createdAt || 0) - (a.createdAt || 0)
  })

  // Get client stats
  const getClientStats = (clientId: string) => {
    const clientProjects = projects.filter(p => p.clientId === clientId)
    return {
      projectCount: clientProjects.length,
      activeProjects: clientProjects.filter(p => p.status !== 'done').length
    }
  }

  const handleDeleteClient = async (clientId: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmId(clientId)
  }

  const performDelete = async () => {
    if (!token || !deleteConfirmId) return
    try {
      await deleteClient({ token, clientId: deleteConfirmId as any })
      toast("Client deleted successfully.", "success")
    } catch (err) {
      console.error(err)
      toast("Failed to delete client.", "error")
    } finally {
      setDeleteConfirmId(null)
    }
  }

  return (
    <PageWrapper
      title="Clients"
      subtitle={clientsData ? `${filtered.length} clients in your network` : "Loading clients..."}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients/analytics')}>
            <TrendingUp size={16} className="mr-2" /> Analytics
          </Button>
          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? 'bg-brand text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? 'bg-brand text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <List size={18} />
            </button>
          </div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> New Client
          </Button>
        </div>
      }
    >
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} className="text-[var(--text-muted)]" />}
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <div className="w-[1px] h-6 bg-white/10 mx-2 hidden md:block" />

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 px-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-secondary)] focus:outline-none focus:border-brand"
          >
            <option value="recent">Recently Added</option>
            <option value="name">Name A-Z</option>
            <option value="balance">Highest Revenue</option>
          </select>

          {FILTERS.map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all h-10",
                activeFilter === filter.id
                  ? filter.color
                  : "bg-white/5 text-white/40 border-white/5 hover:text-white/60"
              )}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Total Clients</p>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{clients.length}</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Active Projects</p>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">
            {projects.filter(p => p.status !== 'done').length}
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</p>
          <h3 className="text-2xl font-black text-emerald-400">
            {formatCurrency(clients.reduce((a, c) => a + (c.revenueCents || 0), 0))}
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-4"
        >
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Avg. Revenue</p>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">
            {clients.length > 0 ? formatCurrency(clients.reduce((a, c) => a + (c.revenueCents || 0), 0) / clients.length) : '0 جنيه'}
          </h3>
        </motion.div>
      </div>

      {/* Clients Display */}
      {!clientsData ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mb-4">
            <Search size={32} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)] mb-2">No clients found</p>
          <p className="text-[var(--text-muted)] mb-6">Try adjusting your search or filters</p>
          <Button onClick={() => { setSearch(''); setActiveFilter(null); }}>
            <Plus size={16} className="mr-2" /> Add First Client
          </Button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((client, i) => {
              return (
                <motion.div
                  key={client._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    glass
                    className={cn(
                      "flex flex-col gap-4 group relative overflow-hidden transition-all duration-500 cursor-pointer",
                      "hover:bg-white/[0.04] hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/5 hover:-translate-y-1"
                    )}
                    onClick={() => setSelectedClient(client)}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={client.name}
                        src={client.avatarUrl}
                        size="lg"
                        className="ring-2 ring-white/10 group-hover:ring-brand/30 transition-all"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[var(--text-primary)] text-sm truncate group-hover:text-brand transition-colors">
                          {client.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold truncate uppercase tracking-tighter">
                          {client.company || 'Personal'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteClient(client._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
                      {client.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone size={12} className="shrink-0" />
                          <span className="truncate">{client.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {client.tags && client.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {client.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="h-px bg-white/5 w-full" />
                    <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-1">Revenue</span>
                        <span className="text-xl font-black text-white">
                          {formatCurrency(client.revenueCents || 0)}
                        </span>
                        <span className="text-[8px] text-[var(--text-muted)] uppercase font-bold tracking-tighter mt-0.5">Total Collected</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* List View */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-muted)]/20 text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">
                <th className="p-4">Client</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Projects</th>
                <th className="p-4 text-emerald-400">Revenue</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((client) => {
                const stats = getClientStats(client._id)
                return (
                  <tr
                    key={client._id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={client.name} src={client.avatarUrl} size="sm" />
                        <div>
                          <p className="font-bold text-[var(--text-primary)] text-sm">{client.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{client.company || 'Personal'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-[var(--text-secondary)]">
                      <p>{client.email || '—'}</p>
                      <p className="opacity-60">{client.phone || '—'}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant={stats.activeProjects > 0 ? 'info' : 'muted'}>
                        {stats.projectCount} total
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-black text-white text-sm">
                          {formatCurrency(client.revenueCents || 0)}
                        </span>
                        <span className="text-[8px] text-emerald-400/70 font-bold uppercase tracking-tighter">Total Collected</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}>Details</Button>
                        <button
                          onClick={(e) => handleDeleteClient(client._id, e)}
                          className="p-2 text-rose-500/50 hover:text-rose-500 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {clientsData && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="secondary"
            size="sm"
            disabled={!paginationCursor}
            onClick={() => setPaginationCursor(null)}
          >
            First Page
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={clientsData.isDone}
            onClick={() => setPaginationCursor(clientsData.continueCursor)}
          >
            Next Page
          </Button>
        </div>
      )}

      <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {selectedClient && (
        <ClientDetailsModal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          client={clients.find(c => c._id === selectedClient._id) || selectedClient}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={performDelete}
        title="Delete Client?"
        description="This will permanently delete the client and all associated projects/history."
        confirmText="Yes, Delete"
        variant="danger"
      />
    </PageWrapper>
  )
}
